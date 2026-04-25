import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import type { BioPlatform } from "@/types";

const PLATFORMS: BioPlatform[] = ["instagram", "tiktok", "linkedin"];

// GET /api/bio?userId=...
// Retorna todas as bios do usuario (1 por plataforma).
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId obrigatorio" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("bios")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Bio GET error:", error);
      return NextResponse.json({ error: "Falha" }, { status: 500 });
    }

    return NextResponse.json({ bios: data || [] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}

// POST /api/bio
// Body: { userId, platform, bio_text }
// Upsert (insere ou atualiza) — 1 bio por plataforma por usuario.
export async function POST(req: Request) {
  try {
    const { userId, platform, bio_text } = await req.json();

    if (!userId || !platform || typeof bio_text !== "string") {
      return NextResponse.json(
        { error: "userId, platform e bio_text obrigatorios" },
        { status: 400 }
      );
    }
    if (!PLATFORMS.includes(platform)) {
      return NextResponse.json(
        { error: "platform deve ser instagram, tiktok ou linkedin" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("bios")
      .upsert(
        {
          user_id: userId,
          platform,
          bio_text,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,platform" }
      )
      .select()
      .single();

    if (error) {
      console.error("Bio POST error:", error);
      return NextResponse.json({ error: "Falha" }, { status: 500 });
    }

    return NextResponse.json({ bio: data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
