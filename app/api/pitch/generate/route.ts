import { NextResponse } from "next/server";

import { callClaude, parseJSON } from "@/lib/claude";
import { getICP } from "@/lib/db/icp";
import { createClient } from "@/lib/supabase/server";
import { pitchFinalPrompt, pitchPrompt } from "@/lib/prompts/pitch";
import type { Offer } from "@/types";

export async function POST(req: Request) {
  try {
    const { icpId, ofertaId, mode, answers } = await req.json();

    if (!icpId || !ofertaId) {
      return NextResponse.json({ error: "icpId e ofertaId obrigatórios" }, { status: 400 });
    }

    const icp = await getICP(icpId);
    if (!icp) return NextResponse.json({ error: "ICP não encontrado" }, { status: 404 });

    const supabase = await createClient();
    const { data: oferta } = await supabase
      .from("ofertas")
      .select("*")
      .eq("id", ofertaId)
      .maybeSingle();

    if (!oferta) return NextResponse.json({ error: "Oferta não encontrada" }, { status: 404 });

    if (mode === "final") {
      const { system, user } = pitchFinalPrompt(icp, oferta as Offer, answers);
      const text = await callClaude(system, user, 2000);
      return NextResponse.json({ pitch: text });
    }

    const { system, user } = pitchPrompt(icp, oferta as Offer);
    const text = await callClaude(system, user, 3000);
    const result = parseJSON(text);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Pitch error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro" }, { status: 500 });
  }
}
