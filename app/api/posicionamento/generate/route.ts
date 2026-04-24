import { NextResponse } from "next/server";

import { callClaude, parseJSON } from "@/lib/claude";
import { createClient } from "@/lib/supabase/server";
import { getICP } from "@/lib/db/icp";
import { posicionamentoPrompt } from "@/lib/prompts/posicionamento";

export async function POST(req: Request) {
  try {
    const { userId, icpId, whatYouDo, forWhom } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });
    if (!whatYouDo || !forWhom) {
      return NextResponse.json(
        { error: "whatYouDo e forWhom obrigatórios" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: voz } = await supabase
      .from("vozes")
      .select("mapa_voz")
      .eq("user_id", userId)
      .maybeSingle();

    const icp = icpId ? await getICP(icpId) : null;

    const { system, user } = posicionamentoPrompt(
      voz?.mapa_voz || null,
      icp,
      whatYouDo,
      forWhom
    );
    const text = await callClaude(system, user, 1500);
    const result = parseJSON(text);

    return NextResponse.json(result);
  } catch (err) {
    console.error("Posicionamento error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 }
    );
  }
}
