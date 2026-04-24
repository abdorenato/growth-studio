import { NextResponse } from "next/server";

import { callClaude, parseJSON } from "@/lib/claude";
import { createClient } from "@/lib/supabase/server";
import { getICP } from "@/lib/db/icp";
import { getUserById } from "@/lib/db/users";
import { ideiasPrompt } from "@/lib/prompts/ideias";

export async function POST(req: Request) {
  try {
    const { userId, icpId, editoriaId, count = 5 } = await req.json();
    if (!userId || !icpId || !editoriaId) {
      return NextResponse.json(
        { error: "userId, icpId e editoriaId obrigatórios" },
        { status: 400 }
      );
    }

    const [icp, creator] = await Promise.all([
      getICP(icpId),
      getUserById(userId),
    ]);
    if (!icp)
      return NextResponse.json({ error: "ICP não encontrado" }, { status: 404 });

    const supabase = await createClient();

    // Editoria é obrigatória
    const { data: editoria } = await supabase
      .from("editorias")
      .select("*")
      .eq("id", editoriaId)
      .maybeSingle();

    if (!editoria) {
      return NextResponse.json(
        { error: "Editoria não encontrada" },
        { status: 404 }
      );
    }

    // Voz e Território como contexto
    const [vozResp, terResp] = await Promise.all([
      supabase.from("vozes").select("mapa_voz").eq("user_id", userId).maybeSingle(),
      supabase
        .from("territorios")
        .select("nome, lente, manifesto, fronteiras")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    // Oferta em foco (só usada se editoria for Converter ou Prova)
    let oferta = null;
    if (creator?.oferta_em_foco_id) {
      const { data } = await supabase
        .from("ofertas")
        .select("*")
        .eq("id", creator.oferta_em_foco_id)
        .maybeSingle();
      oferta = data;
    }

    const { system, user } = ideiasPrompt(
      icp,
      vozResp.data?.mapa_voz || null,
      editoria,
      terResp.data || null,
      oferta,
      count,
      creator
    );

    const text = await callClaude(system, user, 3000);
    const result = parseJSON(text);

    return NextResponse.json(result);
  } catch (err) {
    console.error("Ideias error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 }
    );
  }
}
