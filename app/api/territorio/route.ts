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
    const {
      userId,
      dominio,
      ancora_mental,
      lente,
      tese,
      expansao,
      manifesto, // legado
      fronteiras,
      fronteiras_positivas,
      areas_atuacao,
    } = body;

    if (!userId || !dominio) {
      return NextResponse.json(
        { error: "userId e dominio obrigatórios" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { error } = await supabase.from("territorios").upsert(
      {
        user_id: userId,
        dominio,
        ancora_mental: ancora_mental || null,
        lente: lente || null,
        tese: tese || null,
        expansao: expansao || null,
        manifesto: manifesto || tese || null, // mantém compat
        fronteiras: fronteiras || [],
        fronteiras_positivas: fronteiras_positivas || [],
        areas_atuacao: areas_atuacao || [],
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
