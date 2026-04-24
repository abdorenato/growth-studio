import { NextResponse } from "next/server";

import { getVoz, saveVoz } from "@/lib/db/voz";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId é obrigatório" }, { status: 400 });
  }
  const voz = await getVoz(userId);
  return NextResponse.json({ voz });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, voz } = body;

    if (!userId || !voz) {
      return NextResponse.json(
        { error: "userId e voz são obrigatórios" },
        { status: 400 }
      );
    }

    const saved = await saveVoz(userId, voz);
    if (!saved) {
      return NextResponse.json({ error: "Falha ao salvar" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Voz save error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 }
    );
  }
}
