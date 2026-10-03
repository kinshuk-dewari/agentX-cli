import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";
import { parseArgs } from "node:util";
// load the .env next to the code, so mypi works from any folder
config({
  path: fileURLToPath(new URL("../.env", import.meta.url)),
  quiet: true,
});

const { values } = parseArgs({
  options: {
    prompt: { type: "string", short: "p" },
    model: { type: "string", default: "nvidia/nemotron-3-ultra-550b-a55b" },
  },
});

if (!values.prompt) {
  console.error("Please provide a prompt using --prompt or -p");
  process.exit(1);
}

const client = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1",
});

const stream = await client.responses.create({
  model: values.model,
  input: [{ role: "user", content: values.prompt }],
  max_output_tokens:400,
  stream:true
});

for await (const event of stream) {
  if (event.type === "response.output_text.delta") {
    process.stdout.write(event.delta);
  } else if (event.type === "response.completed") {
    console.log("\nResponse completed");
  } else if (event.type === "error") {
    console.error(event.message);
  }
}
