import { NextResponse } from "next/server";

import { getOrCreateSession, getRecentMessages } from "@/lib/chat/memory";

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

    const session = await getOrCreateSession("web", email.toLowerCase().trim(), {
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
