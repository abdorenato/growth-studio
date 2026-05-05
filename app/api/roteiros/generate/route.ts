import { NextResponse } from "next/server";

import { callClaude, parseJSON } from "@/lib/claude";
import { fetchStrategyContext } from "@/lib/db/strategy-context";
import {
  roteiroPrompt,
  FORMATOS,
  TONS,
  PLATAFORMAS,
  type FormatoKey,
  type TomKey,
  type PlataformaKey,
} from "@/lib/prompts/roteiros-video";
import { getScriptLimits } from "@/lib/roteiros/limits";
import { postProcessRoteiro } from "@/lib/roteiros/post-process";
import { reviewRoteiro, REVIEWER_ENABLED } from "@/lib/roteiros/reviewer";
import type { Roteiro } from "@/lib/roteiros/types";

// 1 ideia → 1 formato → 1 tom → 1 plataforma → 1 roteiro.
// Sem batch. Sem 5 variacoes. Decisao ativa do usuario.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      userId,
      icpId,
      topic,
      hook,
      angle,
      formato,
      tom,
      plataforma,
      duracaoSegundos,
      atrelarOferta,
      editoriaId,
      targetStage,
    } = body as {
      userId?: string;
      icpId?: string;
      topic?: string;
      hook?: string;
      angle?: string;
      formato?: FormatoKey;
      tom?: TomKey;
      plataforma?: PlataformaKey;
      duracaoSegundos?: number;
      atrelarOferta?: boolean;
      editoriaId?: string | null;
      targetStage?: string | null;
    };

    // Validacoes basicas
    if (!userId || !icpId || !topic || !formato || !tom || !plataforma) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando (userId, icpId, topic, formato, tom, plataforma)" },
        { status: 400 }
      );
    }
    if (!FORMATOS[formato]) {
      return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
    }
    if (!TONS[tom]) {
      return NextResponse.json({ error: "Tom inválido" }, { status: 400 });
    }
    if (!PLATAFORMAS[plataforma]) {
      return NextResponse.json({ error: "Plataforma inválida" }, { status: 400 });
    }

    const ctx = await fetchStrategyContext(userId, icpId, {
      editoriaId: editoriaId || null,
      atrelarOferta: Boolean(atrelarOferta),
    });
    if (!ctx) {
      return NextResponse.json(
        { error: "Contexto incompleto (ICP não encontrado)" },
        { status: 404 }
      );
    }

    const prompt = roteiroPrompt(ctx, {
      topic,
      hook,
      angle,
      formato,
      tom,
      plataforma,
      duracaoSegundos,
      targetStage: targetStage || null,
    });

    const text = await callClaude(prompt.system, prompt.user, 3500, {
      endpoint: `/api/roteiros/generate (${formato}/${tom}/${plataforma})`,
      userId,
    });

    const roteiroRaw = parseJSON(text) as Roteiro;

    // ─── Pipeline de pos-processamento (deterministico) ───────────────
    // Aplica em ordem:
    //  1. sanitizeClaims  → tira numeros inventados (regex)
    //  2. enforceSingleCTA → mantem 1 verbo imperativo
    //  3. enforceScriptLimits → trunca CTA, gera warnings de excesso
    //  4. metricas (word_count, duracao_calculada_s)
    const limits = getScriptLimits(plataforma, duracaoSegundos);
    const briefing = { topic, hook, angle };
    const roteiro = postProcessRoteiro(roteiroRaw, { briefing, limits });

    // ─── Revisor LLM (opt-in via env ENABLE_SCRIPT_REVIEWER=true) ─────
    // Quando ligado, faz uma 2a chamada Claude pra julgar qualidade
    // subjetiva. Hoje desativado — esqueleto pronto pra ligar.
    if (REVIEWER_ENABLED) {
      const review = await reviewRoteiro(roteiro, { userId });
      if (review && !review.passed) {
        roteiro.warnings.push(
          `Revisor sinalizou: ${review.failures.join(", ")}. ${review.notes}`
        );
      }
    }

    return NextResponse.json({ roteiro });
  } catch (err) {
    console.error("Roteiros generate error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 }
    );
  }
}
