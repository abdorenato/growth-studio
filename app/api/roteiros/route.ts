import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

// GET — lista roteiros do usuario, opcionalmente filtrados por ideia
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const ideiaId = searchParams.get("ideiaId");

  if (!userId) {
    return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });
  }

  const supabase = await createClient();
  let query = supabase
    .from("roteiros")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (ideiaId) query = query.eq("ideia_id", ideiaId);

  const { data, error } = await query;
  if (error) {
    console.error("Roteiros list error:", error);
    return NextResponse.json({ error: "Falha" }, { status: 500 });
  }

  return NextResponse.json({ roteiros: data || [] });
}

// POST — salva 1 roteiro novo (gerado pela /generate)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      userId,
      ideiaId,
      topic,
      hook,
      angle,
      formato,
      tom,
      plataforma,
      targetStage,
      editoriaId,
      atrelarOferta,
      data,
    } = body as Record<string, unknown>;

    if (!userId || !topic || !formato || !tom || !plataforma || !data) {
      return NextResponse.json(
        { error: "userId, topic, formato, tom, plataforma e data obrigatórios" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from("roteiros")
      .insert({
        user_id: userId,
        ideia_id: ideiaId || null,
        topic,
        hook: hook || null,
        angle: angle || null,
        formato,
        tom,
        plataforma,
        target_stage: targetStage || null,
        editoria_id: editoriaId || null,
        atrelar_oferta: Boolean(atrelarOferta),
        data,
      })
      .select()
      .single();

    if (error) {
      console.error("Roteiro insert error:", error);
      return NextResponse.json({ error: "Falha ao salvar" }, { status: 500 });
    }

    return NextResponse.json({ roteiro: row });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
