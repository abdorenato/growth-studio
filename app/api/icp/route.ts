import { NextResponse } from "next/server";

import { createICP, listICPs } from "@/lib/db/icp";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });
  const icps = await listICPs(userId);
  return NextResponse.json({ icps });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, icp } = body;
    if (!userId || !icp) {
      return NextResponse.json({ error: "userId e icp obrigatórios" }, { status: 400 });
    }
    const created = await createICP(userId, icp);
    if (!created) return NextResponse.json({ error: "Falha ao criar" }, { status: 500 });
    return NextResponse.json({ icp: created });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
