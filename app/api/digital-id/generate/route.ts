import { NextResponse } from "next/server";

import { callClaude, parseJSON } from "@/lib/claude";
import { fetchStrategyContext } from "@/lib/db/strategy-context";
import { digitalIdPrompt, type Archetypes } from "@/lib/prompts/digital-id";
import { buildFieldMeta } from "@/lib/digital-id/fields";
import { createClient } from "@/lib/supabase/server";
import type { ArchetypeKey } from "@/types";

// POST /api/digital-id/generate
// Body: { userId, icpId }
//
// Passo de SÍNTESE — consolida Voz + ICP + Posicionamento + Território
// num Digital ID. Sem UI ainda: usado pra validar a saida do prompt em
// chamada crua antes de investir na interface.
//
// Retorna { digitalId, field_meta } — field_meta classifica cada campo
// como espelho/decisão (metadata estatica injetada pelo codigo, nao pela IA).

export async function POST(req: Request) {
  try {
    const { userId, icpId } = await req.json();

    if (!userId || !icpId) {
      return NextResponse.json(
        { error: "userId e icpId obrigatórios" },
        { status: 400 }
      );
    }

    // 1. Contexto estratégico (Voz/ICP/Posicionamento/Território)
    const ctx = await fetchStrategyContext(userId, icpId);
    if (!ctx) {
      return NextResponse.json(
        { error: "ICP não encontrado" },
        { status: 404 }
      );
    }

    // 2. Valida que a fundação está completa — Digital ID é síntese dos 4
    // módulos; sem qualquer um deles não há o que sintetizar.
    const faltando: string[] = [];
    if (!ctx.mapaVoz) faltando.push("Voz da Marca");
    if (!ctx.posicionamento?.frase) faltando.push("Posicionamento");
    if (!ctx.territorio?.dominio && !ctx.territorio?.tese) {
      faltando.push("Território");
    }
    if (faltando.length > 0) {
      return NextResponse.json(
        {
          error: `Fundação incompleta. Complete antes: ${faltando.join(", ")}.`,
        },
        { status: 422 }
      );
    }

    // 3. Arquétipos — fetchStrategyContext só traz mapa_voz, não os
    // arquétipos. Query extra na tabela vozes.
    const supabase = await createClient();
    const { data: vozRow } = await supabase
      .from("vozes")
      .select("arquetipo_primario, arquetipo_secundario")
      .eq("user_id", userId)
      .maybeSingle<{
        arquetipo_primario: ArchetypeKey;
        arquetipo_secundario: ArchetypeKey;
      }>();

    if (!vozRow?.arquetipo_primario) {
      return NextResponse.json(
        { error: "Arquétipos não encontrados no módulo de Voz." },
        { status: 422 }
      );
    }

    const arquetipos: Archetypes = {
      primario: vozRow.arquetipo_primario,
      secundario: vozRow.arquetipo_secundario,
    };

    // 4. Monta prompt e chama Claude
    const prompt = digitalIdPrompt(ctx, arquetipos);
    const text = await callClaude(prompt.system, prompt.user, 2500, {
      endpoint: "/api/digital-id/generate",
      userId,
    });

    const digitalId = parseJSON(text) as Record<string, unknown>;

    // 5. Injeta metadata estática de campos (espelho/decisão + depends_on).
    // NÃO vem da IA — ela erraria. É estrutura fixa do sistema.
    return NextResponse.json({
      digitalId,
      field_meta: buildFieldMeta(),
    });
  } catch (err) {
    console.error("Digital ID generate error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 }
    );
  }
}
