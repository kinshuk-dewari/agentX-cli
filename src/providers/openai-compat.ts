import OpenAI from "openai";
import type {
  ContentBlock,
  Message,
  Provider,
  StopReason,
  Usage,
} from "../types.ts";

// our messages -> OpenAI Responses API wire format
function toOpenAI(messages: Message[]): OpenAI.Responses.ResponseInput {
  return messages.flatMap((m): OpenAI.Responses.ResponseInput => {
    if (m.role === "user") {
      return [{ role: "user", content: m.content}];
    }

    if (m.role === "assistant") {
      const text = m.content.filter((b) => b.type === "text").map((b) => b.text).join("");

      const calls = m.content.filter((b) => b.type === "toolCall");

      const items: OpenAI.Responses.ResponseInput = [];

      if (text) {
        items.push({ role: "assistant", content: text});
      }

      for (const c of calls) {
        items.push({
          type: "function_call",
          call_id: c.id,
          name: c.name,
          arguments: JSON.stringify(c.arguments),
        });
      }

      return items;
    }

    // toolResult -> function_call_output
    return [
      {
        type: "function_call_output",
        call_id: m.toolCallId,
        output: m.content,
      },
    ];
  });
}

// one adapter for every OpenAI-compatible API: only baseURL, key and model change
export function createOpenAICompat(
  name: string,
  baseURL: string,
  apiKey: string | undefined,
  defaultModel: string,
): Provider {
  const client = new OpenAI({ baseURL, apiKey });

  return {
    name,
    defaultModel,

    async *stream({ messages, model, system, tools = [] }) {
      const input = toOpenAI(messages);

      const stream = await client.responses.create({
        model,
        stream: true,
        instructions: system,
        input,
        tools: tools.length
          ? tools.map((t) => ({
              type: "function" as const,
              name: t.name,
              description: t.description,
              parameters: t.parameters,
              strict:true
            }))
          : undefined,
      });

      let text = "";

      const calls: {
        id: string;
        name: string;
        args: string;
      }[] = [];

      let usage: Usage = { input: 0, output: 0 };

      let stopReason: StopReason = "stop";

      for await (const event of stream) {
        if (event.type === "response.output_text.delta") {
          text += event.delta;

          yield {
            type: "text_delta",
            delta: event.delta,
          };
        }

        if (event.type === "response.function_call_arguments.delta") {
          const index = calls.findIndex((c) => c.id === event.item_id);

          if (index === -1) {
            calls.push({
              id: event.item_id,
              name: "",
              args: event.delta,
            });
          } else {
            calls[index].args += event.delta;
          }
        }

        if (event.type === "response.output_item.done") {
          const item = event.item;

          if (item.type === "function_call") {
            const existing = calls.find((c) => c.id === item.call_id);

            if (existing) {
              existing.name = item.name;
              existing.args = item.arguments;
            } else {
              calls.push({
                id: item.call_id,
                name: item.name,
                args: item.arguments,
              });
            }

            stopReason = "toolUse";
          }
        }

        if (event.type === "response.completed") {
          const response = event.response;

          if (response.status === "incomplete") {
            stopReason = "length";
          }

          if (response.usage) {
            usage = {
              input: response.usage.input_tokens,
              output: response.usage.output_tokens,
            };
          }
        }
      }

      const content: ContentBlock[] = text ? [{ type: "text", text }] : [];

      for (const c of calls) {
        if (c) {
          content.push({
            type: "toolCall",
            id: c.id,
            name: c.name,
            arguments: c.args ? JSON.parse(c.args) : {},
          });
        }
      }

      if (content.some((b) => b.type === "toolCall")) {
        stopReason = "toolUse";
      }

      yield {
        type: "done",
        message: {
          role: "assistant",
          content,
          usage,
          stopReason,
        },
      };
    },
  };
}
