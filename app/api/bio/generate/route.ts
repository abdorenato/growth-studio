import { NextResponse } from "next/server";

import { callClaude } from "@/lib/claude";
import { fetchStrategyContext } from "@/lib/db/strategy-context";
import { bioPrompt } from "@/lib/prompts/bio";
import type { BioPlatform } from "@/types";

const PLATFORMS: BioPlatform[] = ["instagram", "tiktok", "linkedin"];

// POST /api/bio/generate
// Body: { userId, icpId, platform }
// Gera o texto da bio, NAO salva — frontend salva via POST /api/bio.
export async function POST(req: Request) {
  try {
    const { userId, icpId, platform } = await req.json();

    if (!userId || !icpId || !platform) {
      return NextResponse.json(
        { error: "userId, icpId e platform obrigatorios" },
        { status: 400 }
      );
    }
    if (!PLATFORMS.includes(platform)) {
      return NextResponse.json(
        { error: "platform deve ser instagram, tiktok ou linkedin" },
        { status: 400 }
      );
    }

    const ctx = await fetchStrategyContext(userId, icpId, { atrelarOferta: false });
    if (!ctx) {
      return NextResponse.json({ error: "ICP nao encontrado" }, { status: 404 });
    }

    const { system, user } = bioPrompt(ctx, platform);
    // Bio é curta (max 220 char no LinkedIn), mas dou folga pro reasoning interno.
    const text = await callClaude(system, user, 800);

    return NextResponse.json({ text: text.trim() });
  } catch (err) {
    console.error("Bio generate error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 }
    );
  }
}
