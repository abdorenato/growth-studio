import Anthropic from "@anthropic-ai/sdk";

// Cliente lazy-instanciado: garante que lê process.env no momento da chamada
// (evita problema de env var não carregada na importação do módulo)
let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY não configurada. Verifique .env.local e reinicie o servidor."
    );
  }
  _client = new Anthropic({ apiKey });
  return _client;
}

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

export async function callClaude(
  system: string,
  userMessage: string,
  maxTokens = 2000
): Promise<string> {
  const client = getClient();
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
