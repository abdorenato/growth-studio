import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });

  const supabase = await createClient();
  const { data } = await supabase
    .from("editorias")
    .select("*")
    .eq("user_id", userId)
    .order("ordem");
  return NextResponse.json({ editorias: data || [] });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, editorias } = body;

    if (!userId || !Array.isArray(editorias)) {
      return NextResponse.json(
        { error: "userId e editorias (array) obrigatórios" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Substitui todas as editorias do usuário (delete + insert)
    await supabase.from("editorias").delete().eq("user_id", userId);

    if (editorias.length > 0) {
      const rows = editorias.map((e: {
        nome: string;
        tipo_objetivo?: string;
        objetivo?: string;
        descricao?: string;
      }, i: number) => ({
        user_id: userId,
        nome: e.nome,
        tipo_objetivo: e.tipo_objetivo || null,
        objetivo: e.objetivo || null,
        descricao: e.descricao || null,
        ordem: i,
      }));

      const { error } = await supabase.from("editorias").insert(rows);
      if (error) {
        console.error("Editorias insert error:", error);
        return NextResponse.json({ error: "Falha" }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
