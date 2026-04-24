import { NextResponse } from "next/server";

import { createOferta, listOfertas } from "@/lib/db/oferta";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });
  const ofertas = await listOfertas(userId);
  return NextResponse.json({ ofertas });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, oferta } = body;
    if (!userId || !oferta) {
      return NextResponse.json({ error: "userId e oferta obrigatórios" }, { status: 400 });
    }
    const created = await createOferta(userId, oferta);
    if (!created) return NextResponse.json({ error: "Falha" }, { status: 500 });
    return NextResponse.json({ oferta: created });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
