import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });

  const supabase = await createClient();
  const { data } = await supabase
    .from("territorios")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return NextResponse.json({ territorio: data });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, nome, lente, manifesto, fronteiras } = body;

    if (!userId || !nome) {
      return NextResponse.json(
        { error: "userId e nome obrigatórios" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { error } = await supabase.from("territorios").upsert(
      {
        user_id: userId,
        nome,
        lente: lente || null,
        manifesto: manifesto || null,
        fronteiras: fronteiras || [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) {
      console.error("Territorio save error:", error);
      return NextResponse.json({ error: "Falha" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
