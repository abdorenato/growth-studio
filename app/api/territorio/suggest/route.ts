import { NextResponse } from "next/server";

import { callClaude, parseJSON } from "@/lib/claude";
import { createClient } from "@/lib/supabase/server";
import { getICP } from "@/lib/db/icp";
import { getUserById } from "@/lib/db/users";
import {
  suggestTemasPrompt,
  generateManifestoPrompt,
  suggestFronteirasPrompt,
} from "@/lib/prompts/territorio";
import type { LenteKey } from "@/lib/territorio/constants";

type Body =
  | { kind: "tema"; userId: string; icpId: string }
  | {
      kind: "manifesto";
      userId: string;
      icpId: string;
      tema: string;
      lente: LenteKey;
    }
  | {
      kind: "fronteiras";
      userId: string;
      icpId: string;
      tema: string;
      lente: LenteKey;
      manifesto: string;
    };

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const { userId, icpId } = body;

    if (!userId || !icpId) {
      return NextResponse.json({ error: "userId e icpId obrigatórios" }, { status: 400 });
    }

    const [icp, creator] = await Promise.all([getICP(icpId), getUserById(userId)]);
    if (!icp) return NextResponse.json({ error: "ICP não encontrado" }, { status: 404 });

    const supabase = await createClient();
    const { data: voz } = await supabase
      .from("vozes")
      .select("mapa_voz")
      .eq("user_id", userId)
      .maybeSingle();

    const { data: pos } = await supabase
      .from("posicionamentos")
      .select("frase, resultado, mecanismo_nome, diferencial_frase")
      .eq("user_id", userId)
      .maybeSingle();

    if (body.kind === "tema") {
      const { system, user } = suggestTemasPrompt(
        creator,
        icp,
        voz?.mapa_voz || null,
        pos || null
      );
      const text = await callClaude(system, user, 1500);
      return NextResponse.json(parseJSON(text));
    }

    if (body.kind === "manifesto") {
      const { system, user } = generateManifestoPrompt(
        creator,
        icp,
        voz?.mapa_voz || null,
        pos || null,
        body.tema,
        body.lente
      );
      const text = await callClaude(system, user, 1500);
      return NextResponse.json(parseJSON(text));
    }

    if (body.kind === "fronteiras") {
      const { system, user } = suggestFronteirasPrompt(
        creator,
        icp,
        voz?.mapa_voz || null,
        pos || null,
        body.tema,
        body.lente,
        body.manifesto
      );
      const text = await callClaude(system, user, 1500);
      return NextResponse.json(parseJSON(text));
    }

    return NextResponse.json({ error: "kind inválido" }, { status: 400 });
  } catch (err) {
    console.error("Territorio suggest error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 }
    );
  }
}
