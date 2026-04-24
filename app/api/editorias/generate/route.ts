import { NextResponse } from "next/server";

import { callClaude, parseJSON } from "@/lib/claude";
import { createClient } from "@/lib/supabase/server";
import { getICP } from "@/lib/db/icp";
import { getUserById } from "@/lib/db/users";
import {
  generateEditoriasPrompt,
  regenerateOneEditoriaPrompt,
} from "@/lib/prompts/editorias";
import type { TipoObjetivo } from "@/lib/editorias/constants";

type Body =
  | { kind: "all"; userId: string; icpId: string }
  | {
      kind: "one";
      userId: string;
      icpId: string;
      tipo_objetivo: TipoObjetivo;
      nome_anterior?: string;
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
    if (!icp) return NextResponse.json({ error: "ICP não encontrado" }, { status: 404 });

    const supabase = await createClient();

    const [vozResp, posResp, terResp] = await Promise.all([
      supabase.from("vozes").select("mapa_voz").eq("user_id", userId).maybeSingle(),
      supabase
        .from("posicionamentos")
        .select("frase")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("territorios")
        .select("nome, lente, manifesto, fronteiras")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    const mapaVoz = vozResp.data?.mapa_voz || null;
    const pos = posResp.data || null;
    const ter = terResp.data || null;

    if (body.kind === "all") {
      const { system, user } = generateEditoriasPrompt(
        creator,
        icp,
        mapaVoz,
        pos,
        ter
      );
      const text = await callClaude(system, user, 2500);
      return NextResponse.json(parseJSON(text));
    }

    if (body.kind === "one") {
      const { system, user } = regenerateOneEditoriaPrompt(
        creator,
        icp,
        mapaVoz,
        pos,
        ter,
        body.tipo_objetivo,
        body.nome_anterior
      );
      const text = await callClaude(system, user, 1500);
      return NextResponse.json(parseJSON(text));
    }

    return NextResponse.json({ error: "kind inválido" }, { status: 400 });
  } catch (err) {
    console.error("Editorias generate error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 }
    );
  }
}
