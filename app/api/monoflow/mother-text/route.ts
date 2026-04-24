import { NextResponse } from "next/server";

import { callClaude } from "@/lib/claude";
import { fetchStrategyContext } from "@/lib/db/strategy-context";
import { motherTextPrompt } from "@/lib/prompts/monoflow";

export async function POST(req: Request) {
  try {
    const { userId, icpId, topic, hook, angle, atrelarOferta, editoriaId } =
      await req.json();
    if (!userId || !icpId) {
      return NextResponse.json(
        { error: "userId e icpId obrigatórios" },
        { status: 400 }
      );
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

    const { system, user } = motherTextPrompt(
      ctx,
      topic || "",
      hook || "",
      angle || ""
    );
    const text = await callClaude(system, user, 1500);
    return NextResponse.json({ motherText: text });
  } catch (err) {
    console.error("Mother text error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 }
    );
  }
}
