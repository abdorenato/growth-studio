import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

export async function callClaude(
  system: string,
  userMessage: string,
  maxTokens = 2000
): Promise<string> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: userMessage }],
  });

  const block = response.content[0];
  if (block.type === "text") return block.text;
  return "";
}

export function parseJSON<T = unknown>(text: string): T {
  let cleaned = text.trim();

  // Remove markdown code fence
  if (cleaned.startsWith("```")) {
    const lines = cleaned.split("\n");
    const jsonLines: string[] = [];
    let inside = false;
    for (const line of lines) {
      if (line.trim().startsWith("```") && !inside) {
        inside = true;
        continue;
      }
      if (line.trim() === "```" && inside) break;
      if (inside) jsonLines.push(line);
    }
    cleaned = jsonLines.join("\n");
  }

  return JSON.parse(cleaned) as T;
}
