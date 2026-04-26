import { NextResponse } from "next/server";

import { respond } from "@/lib/chat/engine";

// POST /api/chat/web
// Body: { sessionId, message }
// Envia mensagem do aluno, retorna resposta do iAbdo.
export async function POST(req: Request) {
  try {
    const { sessionId, message } = await req.json();

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: "sessionId obrigatorio" }, { status: 400 });
    }
    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "message obrigatoria" }, { status: 400 });
    }

    const result = await respond(sessionId, message);

    return NextResponse.json({
      reply: result.reply,
      tokens: { in: result.tokensIn, out: result.tokensOut },
    });
  } catch (err) {
    console.error("Chat web error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao processar" },
      { status: 500 }
    );
  }
}
