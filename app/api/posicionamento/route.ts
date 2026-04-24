import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });

  const supabase = await createClient();
  const { data } = await supabase
    .from("posicionamentos")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return NextResponse.json({ posicionamento: data });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      userId,
      frase,
      icp_id,
      resultado,
      mecanismo_descricao,
      mecanismo_nome,
      diferencial_categoria,
      diferencial_frase,
    } = body;

    if (!userId || !frase) {
      return NextResponse.json({ error: "userId e frase obrigatórios" }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase.from("posicionamentos").upsert(
      {
        user_id: userId,
        frase,
        icp_id: icp_id || null,
        resultado: resultado || null,
        mecanismo_descricao: mecanismo_descricao || null,
        mecanismo_nome: mecanismo_nome || null,
        diferencial_categoria: diferencial_categoria || null,
        diferencial_frase: diferencial_frase || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) {
      console.error("Posicionamento save error:", error);
      return NextResponse.json({ error: "Falha" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
