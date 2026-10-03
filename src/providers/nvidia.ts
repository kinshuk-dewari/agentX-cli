import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

const openai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

if (!openai.apiKey) {
  throw new Error("NVIDIA_API_KEY is missing from .env");
}



type ExtendedDelta = {
  content?: string | null;
  reasoning_content?: string | null;
};

async function main() {
  const completion = (await openai.chat.completions.create({
    model: 'nvidia/nemotron-3-ultra-550b-a55b',
    messages: [
      { role: 'user', content: 'what is the capital of india?' },
    ],
    temperature: 1,
    top_p: 0.95,
    max_tokens: 16384,
    chat_template_kwargs: { enable_thinking: true },
    stream: true,
  } as any)) as unknown as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;

  for await (const chunk of completion) {
    const delta = chunk.choices[0]?.delta as ExtendedDelta | undefined;

    if (delta?.reasoning_content) process.stdout.write(delta.reasoning_content);
    if (delta?.content) process.stdout.write(delta.content);
  }
}

main().catch(console.error);