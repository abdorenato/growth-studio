import Anthropic from "@anthropic-ai/sdk";
import { IABDO_SYSTEM_PROMPT } from "./knowledge";
import { appendMessage, getRecentMessages, getSessionById } from "./memory";
import { loadAlunoContextForChat } from "./strategy-loader";

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

  // 1. Salva mensagem do user + carrega sessao em paralelo
  const [, session] = await Promise.all([
    appendMessage(sessionId, "user", userMessage),
    getSessionById(sessionId),
  ]);

  if (!session) throw new Error(`Sessao nao encontrada: ${sessionId}`);

  // 2. MODO LEITURA + historico em paralelo:
  // - history (ja inclui a mensagem que acabou de salvar no passo 1)
  // - alunoCtx (se sessao tem user_id, carrega contexto estrategico do aluno
  //   — voz, ICP, posicionamento, territorio, editorias, oferta — pra injetar
  //   no system prompt. iAbdo "conhece" o aluno.)
  const [history, alunoCtx] = await Promise.all([
    getRecentMessages(sessionId, CONTEXT_WINDOW),
    loadAlunoContextForChat(session),
  ]);

  // Log diagnostico (visivel nos logs do Vercel)
  console.log(
    `[chat][${sessionId.slice(0, 8)}] email=${session.channel_user_id} user_id=${session.user_id || "null"} ctx=${alunoCtx.hasData}`
  );

  // ATALHO DE DEBUG — usuario pode digitar /contexto ou /debug pra ver
  // o que o iAbdo enxerga sobre ele (pula chamada do Claude)
  const trimmed = userMessage.trim().toLowerCase();
  if (trimmed === "/contexto" || trimmed === "/debug") {
    const debugReply = buildDebugReply(session, alunoCtx);
    await appendMessage(sessionId, "assistant", debugReply);
    return { reply: debugReply };
  }

  // CONTEXTO NO TOPO + wrapper emfatico — ajuda Claude a NAO seguir o
  // padrao "nao te conheço" que possa estar no historico de conversa.
  const systemPrompt = alunoCtx.hasData
    ? `═══════════════════════════════════════════
🚨 ATENÇÃO: VOCÊ JÁ CONHECE ESTE ALUNO 🚨
═══════════════════════════════════════════

Os dados abaixo são REAIS, ja existem no banco da plataforma e foram carregados especificamente pra voce. NAO ignore. NAO diga que "nao tem informacao" sobre o aluno. NAO peca de novo o que ja esta aqui.

${alunoCtx.resumo}

═══════════════════════════════════════════
COMO USAR:
═══════════════════════════════════════════

- Se o aluno perguntar "voce sabe X sobre mim?" e X esta acima → RESPONDA SIM com o conteudo. Ex: "Sim, sua voz é [arquetipo X], tom [Y], com palavras como [Z]."
- Se aluno pedir um modulo (voz, ICP, posicionamento...) que ja existe acima → NAO inicie do zero. Diga "vejo que voce ja tem isso, é [resumo]. Quer ajustar ou seguir adiante?"
- Use a VOZ do aluno (palavras a usar/evitar, tom) em TODAS as respostas, mesmo as que nao sao do modulo Voz
- Respeite as fronteiras NEGATIVAS do territorio em qualquer sugestao
- Se aluno pedir conteudo (ideia, pitch, oferta) → use as editorias e ICP ja definidos
- Se conversa anterior tiver voce dizendo "nao te conheço", IGNORE essas mensagens — voce estava sem contexto, agora tem

═══════════════════════════════════════════

${IABDO_SYSTEM_PROMPT}`
    : IABDO_SYSTEM_PROMPT;

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
    system: systemPrompt,
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

/**
 * Resposta do comando /contexto ou /debug — mostra exatamente o que o
 * iAbdo enxerga sobre o aluno. Usado pra diagnosticar "por que ele nao
 * lembra de mim?".
 */
function buildDebugReply(
  session: { channel_user_id: string; user_id?: string | null },
  alunoCtx: { hasData: boolean; resumo: string }
): string {
  const lines = [
    "🔍 DEBUG — o que o iAbdo enxerga sobre você:",
    "",
    `Email da sessão: ${session.channel_user_id}`,
    `User da plataforma vinculado: ${session.user_id ? `SIM (id ${session.user_id.slice(0, 8)}...)` : "NÃO"}`,
    `Contexto estratégico carregado: ${alunoCtx.hasData ? "SIM" : "NÃO"}`,
    "",
  ];

  if (alunoCtx.hasData) {
    lines.push("─── Contexto que vai pro Claude ───");
    lines.push("");
    // Remove os separadores grandes pra ficar mais clean no chat
    const cleanResumo = alunoCtx.resumo
      .replace(/═+/g, "─")
      .trim();
    lines.push(cleanResumo);
  } else if (!session.user_id) {
    lines.push("⚠️ Sem User vinculado.");
    lines.push("");
    lines.push("Provavelmente o email que você usou no chat NÃO é o mesmo");
    lines.push("que você usou pra cadastrar na plataforma do Growth Studio.");
    lines.push("");
    lines.push("Solução: faça logout (botão no canto superior) e entre");
    lines.push("novamente com o MESMO email do seu cadastro na plataforma.");
  } else {
    lines.push("⚠️ User vinculado, mas sem dados estratégicos na plataforma.");
    lines.push("");
    lines.push("Você está logado como User existente, mas ainda não gerou");
    lines.push("ICP, voz, posicionamento, etc. na plataforma.");
    lines.push("");
    lines.push("Você pode gerar tudo pelo chat também — comece com /voz.");
  }

  return lines.join("\n");
}
