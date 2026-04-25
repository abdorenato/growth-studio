import { NextResponse } from "next/server";

import { callClaude, parseJSON } from "@/lib/claude";
import { fetchStrategyContext } from "@/lib/db/strategy-context";
import { ofertaFullPrompt } from "@/lib/prompts/oferta";

export async function POST(req: Request) {
  try {
    const { userId, icpId, product, differentiator, priceRange } = await req.json();

    if (!userId || !icpId || !product || !differentiator || !priceRange) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando (userId, icpId, product, differentiator, priceRange)" },
        { status: 400 }
      );
    }

    // Carrega contexto estratégico completo (voz, posicionamento, território, ICP).
    // Sem oferta atrelada (estamos gerando uma nova).
    const ctx = await fetchStrategyContext(userId, icpId, { atrelarOferta: false });
    if (!ctx) {
      return NextResponse.json({ error: "ICP não encontrado" }, { status: 404 });
    }

    const { system, user } = ofertaFullPrompt(ctx, product, differentiator, priceRange);
    const text = await callClaude(system, user, 3000);
    const result = parseJSON(text);

    return NextResponse.json(result);
  } catch (err) {
    console.error("Oferta generate error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 }
    );
  }
}
