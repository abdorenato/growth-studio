import { NextResponse } from "next/server";

import { callClaude, parseJSON } from "@/lib/claude";
import { DISCOVERY_QUESTIONS } from "@/lib/voz/constants";
import { VOZ_SYSTEM_PROMPT } from "@/lib/voz/prompt";

export async function POST(req: Request) {
  try {
    const { answers } = (await req.json()) as {
      answers: Record<string, string>;
    };

    if (!answers) {
      return NextResponse.json(
        { error: "answers é obrigatório" },
        { status: 400 }
      );
    }

    const formatted = DISCOVERY_QUESTIONS.map(
      (q) =>
        `**${q.question}**\n${(answers[q.key] || "").trim() || "(não respondeu)"}`
    ).join("\n\n");

    const userMessage = `Analise as respostas abaixo e identifique o arquétipo primário e secundário:\n\n${formatted}`;

    const text = await callClaude(VOZ_SYSTEM_PROMPT, userMessage, 2000);
    const result = parseJSON(text);

    return NextResponse.json(result);
  } catch (err) {
    console.error("Voz generate error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro desconhecido" },
      { status: 500 }
    );
  }
}
