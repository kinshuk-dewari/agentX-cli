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

if(!values.prompt) {
  console.error("Please provide a prompt using --prompt or -p");
  process.exit(1);
}

const client = new OpenAI();

const message = await client.chat.completions.create({
  model: values.model,
  messages: [
    { role: "user", content: values.prompt }
  ]
});