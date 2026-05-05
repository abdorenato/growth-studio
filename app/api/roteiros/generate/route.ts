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

    const roteiro = parseJSON(text) as Record<string, unknown>;
    return NextResponse.json({ roteiro });
  } catch (err) {
    console.error("Roteiros generate error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 }
    );
  }
}
