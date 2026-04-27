import Anthropic from "@anthropic-ai/sdk";

import { createClient } from "@/lib/supabase/server";

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

// Pricing Haiku 4.5 (USD por milhao de tokens). Override via env se quiser.
const PRICE_INPUT_PER_MTOK = Number(process.env.ANTHROPIC_PRICE_INPUT || 1);
const PRICE_OUTPUT_PER_MTOK = Number(process.env.ANTHROPIC_PRICE_OUTPUT || 5);

export type CallMeta = {
  /** Endpoint que originou a chamada (ex: '/api/voz/generate') — pra metricas no /admin */
  endpoint?: string;
  /** User id quando conhecido — pra atribuir custo por aluno */
  userId?: string | null;
};

export async function callClaude(
  system: string,
  userMessage: string,
  maxTokens = 2000,
  meta?: CallMeta
): Promise<string> {
  const client = getClient();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: userMessage }],
  });

  // Log fire-and-forget — nunca bloqueia ou quebra a request principal
  if (response.usage) {
    logAiCall({
      endpoint: meta?.endpoint ?? null,
      userId: meta?.userId ?? null,
      model: MODEL,
      tokensIn: response.usage.input_tokens,
      tokensOut: response.usage.output_tokens,
    }).catch((err) => {
      console.error("[ai_calls] log falhou:", err);
    });
  }

  const block = response.content[0];
  if (block.type === "text") return block.text;
  return "";
}

/**
 * Persiste uma chamada de IA na tabela ai_calls. Async, fire-and-forget.
 * Erros aqui nao devem propagar — se logging falhar, request principal continua.
 *
 * Exportado pra ser usado tambem no chat/engine (que faz client.messages
 * direto, sem callClaude). Toda chamada manual ao SDK deve chamar isso.
 */
export async function logAiCall(args: {
  endpoint: string | null;
  userId: string | null;
  model: string;
  tokensIn: number;
  tokensOut: number;
}): Promise<void> {
  const cost =
    (args.tokensIn / 1_000_000) * PRICE_INPUT_PER_MTOK +
    (args.tokensOut / 1_000_000) * PRICE_OUTPUT_PER_MTOK;

  const supabase = await createClient();
  await supabase.from("ai_calls").insert({
    user_id: args.userId,
    endpoint: args.endpoint,
    model: args.model,
    tokens_in: args.tokensIn,
    tokens_out: args.tokensOut,
    cost_usd: cost,
  });
}

export function parseJSON<T = unknown>(text: string): T {
  let cleaned = text.trim();

  // Strip ```json ... ``` ou ``` ... ``` wrappers
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
    cleaned = jsonLines.join("\n").trim();
  }

  // Tenta parse direto
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Fallback: extrai primeiro bloco {...} ou [...] da string,
    // pra casos em que o LLM enfia preambulo/posambulo
    const objMatch = cleaned.match(/\{[\s\S]*\}/);
    const arrMatch = cleaned.match(/\[[\s\S]*\]/);
    const candidate = objMatch?.[0] || arrMatch?.[0];
    if (candidate) {
      return JSON.parse(candidate) as T;
    }
    // Re-throw original com mais contexto
    const preview = cleaned.slice(0, 200);
    throw new Error(
      `parseJSON falhou. Preview da resposta: "${preview}${cleaned.length > 200 ? "..." : ""}"`
    );
  }
}
