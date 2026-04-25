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
    // 8-12 destaques com 4 campos texto cada pode passar de 3000 facil.
    // 6000 da folga sem custo perceptivel.
    const text = await callClaude(system, user, 6000);

    let result;
    try {
      result = parseJSON(text);
    } catch (parseErr) {
      console.error("Destaques generate: parseJSON falhou", {
        parseErr,
        textPreview: text.slice(0, 500),
      });
      return NextResponse.json(
        {
          error: "IA retornou resposta em formato invalido. Tente regerar.",
          debug: { preview: text.slice(0, 300) },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Destaques generate error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 }
    );
  }
}
