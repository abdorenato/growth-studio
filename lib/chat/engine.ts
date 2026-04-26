import Anthropic from "@anthropic-ai/sdk";
import { IABDO_SYSTEM_PROMPT } from "./knowledge";
import { appendMessage, getRecentMessages } from "./memory";

// Cliente lazy (mesmo padrao do lib/claude.ts)
let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY nao configurada");
  _client = new Anthropic({ apiKey });
  return _client;
}

const MODEL = process.env.ANTHROPIC_CHAT_MODEL || "claude-haiku-4-5-20251001";

// Janela de contexto: ultimas N mensagens. 30 ja cobre umas 30-50 trocas
// considerando que uma resposta tipica eh 50-200 palavras.
const CONTEXT_WINDOW = 30;

// Limite de output por resposta (suficiente pra texto-mae completo, oferta, etc.)
const MAX_OUTPUT_TOKENS = 2000;

export type EngineResponse = {
  reply: string;
  tokensIn?: number;
  tokensOut?: number;
};

/**
 * Recebe mensagem do usuario, responde com Claude, persiste tudo.
 * Funcao pura do ponto de vista de canal — qualquer adapter (web, whatsapp)
 * chama essa.
 */
export async function respond(
  sessionId: string,
  userMessage: string
): Promise<EngineResponse> {
  if (!userMessage.trim()) {
    return { reply: "Mensagem vazia. Pode escrever de novo?" };
  }

  // 1. Salva mensagem do usuario
  await appendMessage(sessionId, "user", userMessage);

  // 2. Carrega historico (ja inclui a mensagem que acabou de salvar)
  const history = await getRecentMessages(sessionId, CONTEXT_WINDOW);

  // 3. Monta messages no formato Anthropic (so user/assistant, system fica fora)
  const messages = history
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  // 4. Chama Claude
  const client = getClient();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: IABDO_SYSTEM_PROMPT,
    messages,
  });

  const block = response.content[0];
  const reply = block.type === "text" ? block.text.trim() : "";

  if (!reply) {
    throw new Error("Claude retornou resposta vazia");
  }

  // 5. Salva resposta
  await appendMessage(sessionId, "assistant", reply);

  return {
    reply,
    tokensIn: response.usage?.input_tokens,
    tokensOut: response.usage?.output_tokens,
  };
}
