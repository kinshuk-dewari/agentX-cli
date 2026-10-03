import { createOpenAICompat } from "./openai-compat.ts";

export function createOpenAI() {
  return createOpenAICompat(
    "openai",
    "https://api.openai.com/v1",
    process.env.OPENAI_API_KEY,
    process.env.OPENAI_MODEL ?? "gpt-5.5",
  );
}