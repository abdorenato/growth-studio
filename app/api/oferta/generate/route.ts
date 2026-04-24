import { NextResponse } from "next/server";

import { callClaude, parseJSON } from "@/lib/claude";
import { getICP } from "@/lib/db/icp";
import { getUserById } from "@/lib/db/users";
import { ofertaFullPrompt } from "@/lib/prompts/oferta";

export async function POST(req: Request) {
  try {
    const { userId, icpId, product, differentiator, priceRange } = await req.json();

    if (!icpId || !product || !differentiator || !priceRange) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 }
      );
    }

    const icp = await getICP(icpId);
    if (!icp) {
      return NextResponse.json({ error: "ICP não encontrado" }, { status: 404 });
    }

    const creator = userId ? await getUserById(userId) : null;

    const { system, user } = ofertaFullPrompt(icp, product, differentiator, priceRange, creator);
    const text = await callClaude(system, user, 3000);
    const result = parseJSON(text);

    return NextResponse.json(result);
  } catch (err) {
    console.error("Oferta generate error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 }
    );
  }
}
