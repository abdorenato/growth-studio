import { NextResponse } from "next/server";

import { callClaude, parseJSON } from "@/lib/claude";
import { getUserById } from "@/lib/db/users";
import { suggestICPPrompt } from "@/lib/prompts/icp";

export async function POST(req: Request) {
  try {
    const { userId, name, niche, demographics } = await req.json();
    if (!name?.trim() || !niche?.trim()) {
      return NextResponse.json(
        { error: "name e niche obrigatórios" },
        { status: 400 }
      );
    }

    const creator = userId ? await getUserById(userId) : null;

    const { system, user } = suggestICPPrompt(
      name,
      niche,
      demographics || {},
      creator
    );
    const text = await callClaude(system, user, 2000, {
      endpoint: "/api/icp/suggest",
      userId,
    });
    const result = parseJSON(text);
    return NextResponse.json(result);
  } catch (err) {
    console.error("ICP suggest error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 }
    );
  }
}
