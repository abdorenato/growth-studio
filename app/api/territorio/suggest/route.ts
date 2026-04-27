import { NextResponse } from "next/server";

import { callClaude, parseJSON } from "@/lib/claude";
import { createClient } from "@/lib/supabase/server";
import { getICP } from "@/lib/db/icp";
import { getUserById } from "@/lib/db/users";
import {
  suggestDominiosPrompt,
  suggestAncorasPrompt,
  generateManifestoPrompt,
  suggestFronteirasPrompt,
  suggestAreasAtuacaoPrompt,
} from "@/lib/prompts/territorio";
import type { LenteKey } from "@/lib/territorio/constants";

type Body =
  | { kind: "dominio"; userId: string; icpId: string }
  | {
      kind: "ancora";
      userId: string;
      icpId: string;
      dominio: string;
      lente: LenteKey;
    }
  | {
      kind: "manifesto";
      userId: string;
      icpId: string;
      dominio: string;
      ancora: string;
      lente: LenteKey;
    }
  | {
      kind: "fronteiras";
      userId: string;
      icpId: string;
      dominio: string;
      ancora: string;
      lente: LenteKey;
      tese: string;
    }
  | {
      kind: "areas";
      userId: string;
      icpId: string;
      dominio: string;
      ancora: string;
      tese: string;
    };

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const { userId, icpId } = body;

    if (!userId || !icpId) {
      return NextResponse.json(
        { error: "userId e icpId obrigatórios" },
        { status: 400 }
      );
    }

    const [icp, creator] = await Promise.all([getICP(icpId), getUserById(userId)]);
    if (!icp)
      return NextResponse.json({ error: "ICP não encontrado" }, { status: 404 });

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

    const mapaVoz = voz?.mapa_voz || null;
    const meta = { endpoint: `/api/territorio/suggest (${body.kind})`, userId };

    if (body.kind === "dominio") {
      const { system, user } = suggestDominiosPrompt(creator, icp, mapaVoz, pos);
      const text = await callClaude(system, user, 1500, meta);
      return NextResponse.json(parseJSON(text));
    }

    if (body.kind === "ancora") {
      const { system, user } = suggestAncorasPrompt(
        creator,
        icp,
        mapaVoz,
        pos,
        body.dominio,
        body.lente
      );
      const text = await callClaude(system, user, 1500, meta);
      return NextResponse.json(parseJSON(text));
    }

    if (body.kind === "manifesto") {
      const { system, user } = generateManifestoPrompt(
        creator,
        icp,
        mapaVoz,
        pos,
        body.dominio,
        body.ancora,
        body.lente
      );
      const text = await callClaude(system, user, 1500, meta);
      return NextResponse.json(parseJSON(text));
    }

    if (body.kind === "fronteiras") {
      const { system, user } = suggestFronteirasPrompt(
        creator,
        icp,
        mapaVoz,
        pos,
        body.dominio,
        body.ancora,
        body.lente,
        body.tese
      );
      const text = await callClaude(system, user, 1500, meta);
      return NextResponse.json(parseJSON(text));
    }

    if (body.kind === "areas") {
      const { system, user } = suggestAreasAtuacaoPrompt(
        creator,
        icp,
        mapaVoz,
        pos,
        body.dominio,
        body.ancora,
        body.tese
      );
      const text = await callClaude(system, user, 1500, meta);
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
