import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

// GET: retorna a oferta em foco atual do usuário
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: userData } = await supabase
    .from("users")
    .select("oferta_em_foco_id")
    .eq("id", userId)
    .maybeSingle();

  if (!userData?.oferta_em_foco_id) {
    return NextResponse.json({ oferta: null });
  }

  const { data: oferta } = await supabase
    .from("ofertas")
    .select("*")
    .eq("id", userData.oferta_em_foco_id)
    .maybeSingle();

  return NextResponse.json({ oferta });
}

// POST: seta ou remove a oferta em foco
export async function POST(req: Request) {
  try {
    const { userId, ofertaId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("users")
      .update({ oferta_em_foco_id: ofertaId || null })
      .eq("id", userId);

    if (error) {
      console.error("Oferta em foco set error:", error);
      return NextResponse.json({ error: "Falha" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
