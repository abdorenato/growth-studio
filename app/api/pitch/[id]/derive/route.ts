import { NextResponse } from "next/server";

import { callClaude } from "@/lib/claude";
import { fetchStrategyContext } from "@/lib/db/strategy-context";
import { createClient } from "@/lib/supabase/server";
import { cartaVendasPrompt, elevatorPitchPrompt } from "@/lib/prompts/pitch";
import type { Offer } from "@/types";

// POST /api/pitch/[id]/derive
// Body: { kind: "elevator" | "carta" }
// Gera o artefato derivado (elevator pitch curto OU carta de vendas longa)
// a partir de um pitch já salvo. NÃO persiste — frontend edita e salva via PATCH.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { kind } = await req.json();

    if (kind !== "elevator" && kind !== "carta") {
      return NextResponse.json(
        { error: "kind deve ser 'elevator' ou 'carta'" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Carrega o pitch base
    const { data: pitch, error: pitchErr } = await supabase
      .from("pitches")
      .select("id, user_id, oferta_id, icp_id, pitch_text")
      .eq("id", id)
      .maybeSingle();

    if (pitchErr || !pitch) {
      return NextResponse.json({ error: "Pitch não encontrado" }, { status: 404 });
    }

    if (!pitch.pitch_text?.trim()) {
      return NextResponse.json(
        { error: "Pitch base vazio. Gere e salve o pitch principal primeiro." },
        { status: 400 }
      );
    }

    if (!pitch.icp_id) {
      return NextResponse.json(
        { error: "Pitch sem ICP atrelado." },
        { status: 400 }
      );
    }

    // Carrega oferta
    const { data: oferta } = await supabase
      .from("ofertas")
      .select("*")
      .eq("id", pitch.oferta_id)
      .maybeSingle();

    if (!oferta) {
      return NextResponse.json({ error: "Oferta não encontrada" }, { status: 404 });
    }

    // Carrega contexto estratégico completo
    const ctx = await fetchStrategyContext(pitch.user_id, pitch.icp_id, {
      atrelarOferta: false,
    });
    if (!ctx) {
      return NextResponse.json({ error: "Contexto estratégico não montado" }, { status: 500 });
    }

    // Gera o artefato
    const { system, user } =
      kind === "elevator"
        ? elevatorPitchPrompt(ctx, oferta as Offer, pitch.pitch_text)
        : cartaVendasPrompt(ctx, oferta as Offer, pitch.pitch_text);

    // Elevator é curto (~120 tokens). Carta longa (~2500 tokens).
    const maxTokens = kind === "elevator" ? 400 : 3500;
    const text = await callClaude(system, user, maxTokens);

    return NextResponse.json({ text });
  } catch (err) {
    console.error("Pitch derive error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 }
    );
  }
}
