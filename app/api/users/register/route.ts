import { NextResponse } from "next/server";
import { z } from "zod";

import { getFullProgress, registerLead } from "@/lib/db/users";

const BodySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  instagram: z.string().optional().default(""),
  atividade: z.string().optional().default(""),
  atividade_descricao: z.string().optional().default(""),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = BodySchema.parse(body);

    const user = await registerLead(
      parsed.name,
      parsed.email,
      parsed.instagram || "",
      parsed.atividade || "",
      parsed.atividade_descricao || ""
    );

    if (!user) {
      return NextResponse.json(
        { error: "Falha ao registrar usuário" },
        { status: 500 }
      );
    }

    let progress = {};
    try {
      progress = await getFullProgress(user.id);
    } catch (e) {
      console.warn("Could not fetch progress", e);
    }

    return NextResponse.json({ user, progress });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "Erro ao processar requisição" },
      { status: 500 }
    );
  }
}
