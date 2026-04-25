import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type IdeiaInput = {
  topic?: string;
  hook?: string;
  angle?: string;
  carousel_style?: string;
  target_emotion?: string;
  target_stage?: string;
};

// GET — lista ideias do usuário, opcionalmente filtradas por editoria
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const editoriaId = searchParams.get("editoriaId");

  if (!userId) {
    return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });
  }

  const supabase = await createClient();
  let query = supabase
    .from("ideias")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (editoriaId) {
    query = query.eq("editoria_id", editoriaId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Ideias list error:", error);
    return NextResponse.json({ error: "Falha ao listar" }, { status: 500 });
  }

  return NextResponse.json({ ideias: data || [] });
}

// POST — salva múltiplas ideias de uma vez (batch)
export async function POST(req: Request) {
  try {
    const { userId, editoriaId, ideias } = await req.json();

    if (!userId || !Array.isArray(ideias)) {
      return NextResponse.json(
        { error: "userId e ideias (array) obrigatórios" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const rows = ideias
      .filter((i: IdeiaInput) => i.topic?.trim())
      .map((i: IdeiaInput) => ({
        user_id: userId,
        editoria_id: editoriaId || null,
        topic: i.topic,
        hook: i.hook || null,
        angle: i.angle || null,
        carousel_style: i.carousel_style || null,
        target_emotion: i.target_emotion || null,
        target_stage: i.target_stage || null,
      }));

    if (rows.length === 0) {
      return NextResponse.json({ ideias: [] });
    }

    const { data, error } = await supabase
      .from("ideias")
      .insert(rows)
      .select();

    if (error) {
      console.error("Ideias insert error:", error);
      return NextResponse.json({ error: "Falha ao salvar" }, { status: 500 });
    }

    return NextResponse.json({ ideias: data || [] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
