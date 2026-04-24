import { NextResponse } from "next/server";

import { callClaude, parseJSON } from "@/lib/claude";
import { createClient } from "@/lib/supabase/server";
import { getICP } from "@/lib/db/icp";
import { getUserById } from "@/lib/db/users";
import {
  suggestResultadoPrompt,
  nameMecanismoPrompt,
  suggestDiferencialPrompt,
  type DiferencialCategoria,
} from "@/lib/prompts/posicionamento-v2";

type Body =
  | { kind: "resultado"; userId: string; icpId: string }
  | { kind: "mecanismo-nome"; userId: string; icpId: string; descricao: string }
  | {
      kind: "diferencial";
      userId: string;
      icpId: string;
      categoria: DiferencialCategoria;
    };

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const { userId, icpId } = body;

    if (!userId || !icpId) {
      return NextResponse.json({ error: "userId e icpId obrigatórios" }, { status: 400 });
    }

    const icp = await getICP(icpId);
    if (!icp) return NextResponse.json({ error: "ICP não encontrado" }, { status: 404 });

    const creator = await getUserById(userId);

    const supabase = await createClient();
    const { data: voz } = await supabase
      .from("vozes")
      .select("mapa_voz, respostas")
      .eq("user_id", userId)
      .maybeSingle();

    if (body.kind === "resultado") {
      const { system, user } = suggestResultadoPrompt(icp, creator);
      const text = await callClaude(system, user, 1500);
      return NextResponse.json(parseJSON(text));
    }

    if (body.kind === "mecanismo-nome") {
      const { system, user } = nameMecanismoPrompt(
        icp,
        voz?.mapa_voz || null,
        body.descricao
      );
      const text = await callClaude(system, user, 1000);
      return NextResponse.json(parseJSON(text));
    }

    if (body.kind === "diferencial") {
      const { system, user } = suggestDiferencialPrompt(
        icp,
        voz?.mapa_voz || null,
        voz?.respostas || null,
        body.categoria,
        creator
      );
      const text = await callClaude(system, user, 1500);
      return NextResponse.json(parseJSON(text));
    }

    return NextResponse.json({ error: "kind inválido" }, { status: 400 });
  } catch (err) {
    console.error("Suggest error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 }
    );
  }
}
