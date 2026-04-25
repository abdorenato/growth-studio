import { NextResponse } from "next/server";

import { callClaude, parseJSON } from "@/lib/claude";
import { fetchStrategyContext } from "@/lib/db/strategy-context";
import {
  reelsPrompt,
  postPrompt,
  carouselPrompt,
  storiesPrompt,
  linkedinPrompt,
  tiktokPrompt,
} from "@/lib/prompts/monoflow";

type Platform =
  | "reels"
  | "post"
  | "carousel"
  | "stories"
  | "linkedin"
  | "tiktok";

export async function POST(req: Request) {
  try {
    const {
      userId,
      icpId,
      motherText,
      platform,
      numSlides,
      atrelarOferta,
      editoriaId,
      targetStage,
    } = await req.json();

    if (!userId || !icpId || !motherText || !platform) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
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

    let prompt;
    const stage = targetStage || null;
    switch (platform as Platform) {
      case "reels":
        prompt = reelsPrompt(ctx, motherText, stage);
        break;
      case "post":
        prompt = postPrompt(ctx, motherText, stage);
        break;
      case "carousel":
        prompt = carouselPrompt(ctx, motherText, numSlides || 7, stage);
        break;
      case "stories":
        prompt = storiesPrompt(ctx, motherText, stage);
        break;
      case "linkedin":
        prompt = linkedinPrompt(ctx, motherText, stage);
        break;
      case "tiktok":
        prompt = tiktokPrompt(ctx, motherText, stage);
        break;
      default:
        return NextResponse.json(
          { error: "Platform inválida" },
          { status: 400 }
        );
    }

    const text = await callClaude(prompt.system, prompt.user, 3000);
    const result = parseJSON(text) as Record<string, unknown>;

    // Safeguard: se a IA não respeitou o limite, corta no servidor
    if (platform === "carousel" && Array.isArray(result.slides)) {
      const max = Math.min(numSlides || 5, 5);
      result.slides = (result.slides as unknown[]).slice(0, max);
    }
    if (platform === "stories" && Array.isArray(result.stories)) {
      result.stories = (result.stories as unknown[]).slice(0, 4);
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Monoflow generate error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 }
    );
  }
}
