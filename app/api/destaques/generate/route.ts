import { NextResponse } from "next/server";

import { callClaude, parseJSON } from "@/lib/claude";
import { fetchStrategyContext } from "@/lib/db/strategy-context";
import { destaquesPrompt } from "@/lib/prompts/destaques";
import { createClient } from "@/lib/supabase/server";

// POST /api/destaques/generate
// Body: { userId, icpId }
// Gera estrutura de destaques (8-12 itens) baseada no contexto estrategico
// + editorias do usuario. NAO salva — frontend revisa e salva via POST /api/destaques.
export async function POST(req: Request) {
  try {
    const { userId, icpId } = await req.json();

    if (!userId || !icpId) {
      return NextResponse.json(
        { error: "userId e icpId obrigatorios" },
        { status: 400 }
      );
    }

    // Atrelar oferta em foco se existir — destaques precisam saber se ha oferta pra
    // criar destaque "Trabalho comigo" coerente.
    const ctx = await fetchStrategyContext(userId, icpId, { atrelarOferta: true });
    if (!ctx) {
      return NextResponse.json({ error: "ICP nao encontrado" }, { status: 404 });
    }

    // Carrega editorias do usuario pra alimentar o prompt
    const supabase = await createClient();
    const { data: edsData } = await supabase
      .from("editorias")
      .select("nome, tipo_objetivo, objetivo, descricao")
      .eq("user_id", userId);

    const editorias = (edsData || []) as Array<{
      nome: string;
      tipo_objetivo?: string;
      objetivo?: string;
      descricao?: string;
    }>;

    const { system, user } = destaquesPrompt(ctx, editorias);
    const text = await callClaude(system, user, 3000);
    const result = parseJSON(text);

    return NextResponse.json(result);
  } catch (err) {
    console.error("Destaques generate error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 }
    );
  }
}
