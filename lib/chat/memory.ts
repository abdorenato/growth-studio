import { createClient } from "@/lib/supabase/server";
import type { ChatChannel, ChatMessage, ChatSession, ChatRole } from "./types";

// ─────────────────────────────────────────────────────────────────
// SESSIONS
// ─────────────────────────────────────────────────────────────────

/**
 * Busca sessao existente OU cria nova (upsert por channel + channel_user_id).
 * Tambem tenta vincular com User da plataforma (via email pra canal web).
 */
export async function getOrCreateSession(
  channel: ChatChannel,
  channelUserId: string,
  displayName?: string,
  metadata?: Record<string, unknown>
): Promise<ChatSession> {
  const supabase = await createClient();

  // 1. Tenta buscar existente
  const { data: existing } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("channel", channel)
    .eq("channel_user_id", channelUserId)
    .maybeSingle();

  if (existing) {
    // Atualiza last_active
    await supabase
      .from("chat_sessions")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", existing.id);
    return existing as ChatSession;
  }

  // 2. Tenta vincular com User da plataforma (so canal web, channel_user_id eh email)
  let userId: string | null = null;
  if (channel === "web") {
    const { data: platformUser } = await supabase
      .from("users")
      .select("id, name")
      .eq("email", channelUserId.toLowerCase().trim())
      .maybeSingle();
    if (platformUser) {
      userId = platformUser.id;
      if (!displayName && platformUser.name) displayName = platformUser.name;
    }
  }

  // 3. Cria nova
  const { data: created, error } = await supabase
    .from("chat_sessions")
    .insert({
      channel,
      channel_user_id: channelUserId,
      user_id: userId,
      display_name: displayName || null,
      metadata: metadata || {},
    })
    .select()
    .single();

  if (error) throw new Error(`Falha ao criar sessao: ${error.message}`);
  return created as ChatSession;
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
