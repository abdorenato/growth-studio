import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

// GET — lista pitches do usuário, opcionalmente filtrados por oferta
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const ofertaId = searchParams.get("ofertaId");

  if (!userId) {
    return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });
  }

  const supabase = await createClient();
  let query = supabase
    .from("pitches")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (ofertaId) query = query.eq("oferta_id", ofertaId);

  const { data, error } = await query;
  if (error) {
    console.error("Pitch list error:", error);
    return NextResponse.json({ error: "Falha" }, { status: 500 });
  }
  return NextResponse.json({ pitches: data || [] });
}

// POST — cria pitch
export async function POST(req: Request) {
  try {
    const { userId, ofertaId, icpId, answers, pitch_text } = await req.json();
    if (!userId || !ofertaId || !pitch_text) {
      return NextResponse.json(
        { error: "userId, ofertaId e pitch_text obrigatórios" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("pitches")
      .insert({
        user_id: userId,
        oferta_id: ofertaId,
        icp_id: icpId || null,
        answers: answers || [],
        pitch_text,
      })
      .select()
      .single();

    if (error) {
      console.error("Pitch insert error:", error);
      return NextResponse.json({ error: "Falha" }, { status: 500 });
    }

    return NextResponse.json({ pitch: data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
