import { NextResponse } from "next/server";

import { getOrCreateSession, getRecentMessages } from "@/lib/chat/memory";

// POST /api/chat/session
// Body: { email, displayName? }
// Cria/recupera sessao web pelo email. Retorna sessao + ultimas mensagens.
export async function POST(req: Request) {
  try {
    const { email, displayName } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Email valido obrigatorio" },
        { status: 400 }
      );
    }

    const session = await getOrCreateSession(
      "web",
      email.toLowerCase().trim(),
      displayName?.trim() || undefined
    );

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
