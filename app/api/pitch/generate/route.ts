import { NextResponse } from "next/server";

import { callClaude, parseJSON } from "@/lib/claude";
import { fetchStrategyContext } from "@/lib/db/strategy-context";
import { createClient } from "@/lib/supabase/server";
import { pitchFinalPrompt, pitchPrompt } from "@/lib/prompts/pitch";
import type { Offer } from "@/types";

export async function POST(req: Request) {
  try {
    const { userId, icpId, ofertaId, mode, answers } = await req.json();

    if (!userId || !icpId || !ofertaId) {
      return NextResponse.json(
        { error: "userId, icpId e ofertaId obrigatórios" },
        { status: 400 }
      );
    }

    // Carrega contexto estratégico completo (voz, posicionamento, território, ICP).
    // Não atrelar oferta automaticamente — vamos buscar a específica do pitch abaixo.
    const ctx = await fetchStrategyContext(userId, icpId, { atrelarOferta: false });
    if (!ctx) return NextResponse.json({ error: "ICP não encontrado" }, { status: 404 });

    const supabase = await createClient();
    const { data: oferta } = await supabase
      .from("ofertas")
      .select("*")
      .eq("id", ofertaId)
      .maybeSingle();

    if (!oferta) return NextResponse.json({ error: "Oferta não encontrada" }, { status: 404 });

    if (mode === "final") {
      const { system, user } = pitchFinalPrompt(ctx, oferta as Offer, answers);
      const text = await callClaude(system, user, 2000, {
        endpoint: "/api/pitch/generate (final)",
        userId,
      });
      return NextResponse.json({ pitch: text });
    }

    const { system, user } = pitchPrompt(ctx, oferta as Offer);
    const text = await callClaude(system, user, 3000, {
      endpoint: "/api/pitch/generate",
      userId,
    });
    const result = parseJSON(text);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Pitch error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro" }, { status: 500 });
  }
}
