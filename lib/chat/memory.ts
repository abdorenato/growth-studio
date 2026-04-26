import { createClient } from "@/lib/supabase/server";
import type { ChatChannel, ChatMessage, ChatSession, ChatRole } from "./types";

// ─────────────────────────────────────────────────────────────────
// SESSIONS
// ─────────────────────────────────────────────────────────────────

type SessionInputs = {
  displayName?: string;
  instagram?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Busca sessao existente OU cria nova (upsert por channel + channel_user_id).
 *
 * Captura de leads (canal web): se o email nao existe na tabela `users`,
 * cria um novo User com origem='chat'. Se existe, ATUALIZA campos vazios
 * (nunca sobrescreve dados ja preenchidos pelo aluno).
 */
export async function getOrCreateSession(
  channel: ChatChannel,
  channelUserId: string,
  inputs: SessionInputs = {}
): Promise<ChatSession> {
  const supabase = await createClient();
  const { displayName, instagram, metadata } = inputs;

  // 1. Sessao ja existe? Atualiza last_active e retorna.
  const { data: existing } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("channel", channel)
    .eq("channel_user_id", channelUserId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("chat_sessions")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", existing.id);

    // Mesmo com sessao existente, tenta enriquecer User com dados novos
    if (channel === "web" && (existing as ChatSession).user_id) {
      await enrichExistingUser((existing as ChatSession).user_id!, displayName, instagram);
    }
    return existing as ChatSession;
  }

  // 2. Resolve User (canal web): linka com existente OU cria novo (lead).
  let userId: string | null = null;
  let resolvedDisplayName = displayName;

  if (channel === "web") {
    const email = channelUserId.toLowerCase().trim();
    const { data: platformUser } = await supabase
      .from("users")
      .select("id, name")
      .eq("email", email)
      .maybeSingle();

    if (platformUser) {
      // User ja existe: linka + enriquece se tem dado novo
      userId = platformUser.id;
      if (!resolvedDisplayName && platformUser.name) resolvedDisplayName = platformUser.name;
      await enrichExistingUser(platformUser.id, displayName, instagram);
    } else {
      // User nao existe: CAPTURA O LEAD criando novo User com origem='chat'
      const insta = (instagram || "").trim().replace(/^@/, "");
      const { data: created, error: createUserErr } = await supabase
        .from("users")
        .insert({
          email,
          name: displayName?.trim() || email.split("@")[0],
          instagram: insta || null,
          origem: "chat",
        })
        .select("id, name")
        .single();
      if (createUserErr) {
        console.error("Falha ao criar User-lead:", createUserErr);
        // nao bloqueia: continua sem userId, sessao funciona mesmo assim
      } else {
        userId = created.id;
        if (!resolvedDisplayName) resolvedDisplayName = created.name;
      }
    }
  }

  // 3. Cria sessao
  const { data: created, error } = await supabase
    .from("chat_sessions")
    .insert({
      channel,
      channel_user_id: channelUserId,
      user_id: userId,
      display_name: resolvedDisplayName || null,
      metadata: metadata || {},
    })
    .select()
    .single();

  if (error) throw new Error(`Falha ao criar sessao: ${error.message}`);
  return created as ChatSession;
}

/**
 * Atualiza User existente com dados novos do chat — APENAS preenche
 * campos vazios. Nunca sobrescreve nome/instagram ja preenchidos pelo aluno.
 */
async function enrichExistingUser(
  userId: string,
  displayName?: string,
  instagram?: string
): Promise<void> {
  if (!displayName && !instagram) return;

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("users")
    .select("name, instagram")
    .eq("id", userId)
    .maybeSingle();

  if (!current) return;

  const patch: Record<string, string> = {};
  // So preenche se atual ta vazio E veio dado novo
  if (displayName?.trim() && !current.name) patch.name = displayName.trim();
  if (instagram?.trim()) {
    const insta = instagram.trim().replace(/^@/, "");
    if (insta && !current.instagram) patch.instagram = insta;
  }

  if (Object.keys(patch).length > 0) {
    await supabase.from("users").update(patch).eq("id", userId);
  }
}

/**
 * Busca sessao por id (usado no engine pra checar user_id linkado).
 */
export async function getSessionById(sessionId: string): Promise<ChatSession | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();
  return (data as ChatSession) || null;
}

// ─────────────────────────────────────────────────────────────────
// MESSAGES
// ─────────────────────────────────────────────────────────────────

/**
 * Carrega ultimas N mensagens da sessao em ordem cronologica.
 * Usado pra montar o contexto que vai pro Claude.
 */
export async function getRecentMessages(
  sessionId: string,
  limit = 30
): Promise<ChatMessage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Falha ao carregar mensagens: ${error.message}`);
  // Inverte pra cronologico (mais antiga primeiro) — necessario pro Claude
  return (data as ChatMessage[]).reverse();
}

/**
 * Adiciona uma mensagem ao historico.
 */
export async function appendMessage(
  sessionId: string,
  role: ChatRole,
  content: string
): Promise<ChatMessage> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({ session_id: sessionId, role, content })
    .select()
    .single();

  if (error) throw new Error(`Falha ao salvar mensagem: ${error.message}`);

  // Atualiza last_active da sessao em paralelo (fire-and-forget)
  supabase
    .from("chat_sessions")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", sessionId)
    .then(() => {});

  return data as ChatMessage;
}
