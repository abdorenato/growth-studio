import { NextResponse } from "next/server";

import {
  isRegistrationClosed,
  REGISTRATION_CLOSED_MSG,
} from "@/lib/admin/registration";
import { getOrCreateSession, getRecentMessages } from "@/lib/chat/memory";
import { createClient } from "@/lib/supabase/server";

// POST /api/chat/session
// Body: { email, displayName?, instagram? }
// Cria/recupera sessao web pelo email. Retorna sessao + ultimas mensagens.
// Se email nao existe na tabela users, captura como lead (origem='chat').
export async function POST(req: Request) {
  try {
    const { email, displayName, instagram } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Email valido obrigatorio" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Combina 2 checagens em uma so query: existe? esta bloqueado?
    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("users")
      .select("id, blocked_at")
      .eq("email", normalizedEmail)
      .maybeSingle();

    // Bloqueio individual: se user existe e tem blocked_at, nega
    if (existing?.blocked_at) {
      return NextResponse.json(
        {
          error: "Sua conta está temporariamente bloqueada.",
          code: "USER_BLOCKED",
        },
        { status: 403 }
      );
    }

    // Cadastros fechados: bloqueia emails NOVOS. Existentes (nao bloqueados) passam.
    if (isRegistrationClosed() && !existing) {
      return NextResponse.json(
        {
          error: REGISTRATION_CLOSED_MSG,
          code: "REGISTRATION_CLOSED",
        },
        { status: 403 }
      );
    }

    const session = await getOrCreateSession("web", normalizedEmail, {
      displayName: displayName?.trim() || undefined,
      instagram: instagram?.trim() || undefined,
    });

    const messages = await getRecentMessages(session.id, 50);

    return NextResponse.json({ session, messages });
  } catch (err) {
    console.error("Chat session error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 }
    );
  }
}
