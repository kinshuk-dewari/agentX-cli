import { Provider } from "../types.ts";
import { createAnthropic } from "./anthropic.ts";
import { createOpenAICompat } from "./openai-compat.ts";

const providers:Record<string, ()=>Provider>={
    anthropic:createAnthropic,
    "anthropic-openai":()=>createOpenAICompat("anthropic-openai", "https://api.anthropic.com/v1/", process.env.ANTHROPIC_API_KEY!, "claude-sonnet-5"),
    "groq":()=>createOpenAICompat("groq", "https://api.groq.com/openai/v1", process.env.GROQ_API_KEY!, "qwen/qwen3.8-27b"),
    "nvidia":()=>createOpenAICompat("nvidia","https://integrate.api.nvidia.com/v1", process.env.NVIDIA_API_KEY, "nvidia/nemotron-3-ultra-550b-a55b"),
    "openai":()=>createOpenAICompat("openai", "https://api.openai.com/v1", process.env.OPENAI_API_KEY, "gpt-5.5",)
}

export function getProvider(name:string):Provider {
    const create = providers[name];
    if(!create){
        throw new Error('Providers Error index.ts')
    }
    return create();
}