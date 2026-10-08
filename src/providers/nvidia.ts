import { createOpenAICompat } from "./openai-compat.ts";

export function createNvidia() {
  console.log("in the createNvidia")
  return createOpenAICompat(
    "nvidia",
    "https://integrate.api.nvidia.com/v1",
    process.env.NVIDIA_API_KEY,
    "nvidia/nemotron-3-ultra-550b-a55b",
  );
}