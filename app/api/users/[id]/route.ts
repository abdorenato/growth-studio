import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

// PATCH — atualiza dados do usuário (exceto email)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Campos permitidos pra editar (email NÃO entra)
    const allowedFields = ["name", "instagram", "atividade", "atividade_descricao"];
    const patch: Record<string, unknown> = {
      ultima_atividade: new Date().toISOString(),
    };
    for (const key of allowedFields) {
      if (key in body) {
        // Normaliza instagram (sem @)
        if (key === "instagram" && typeof body[key] === "string") {
          patch[key] = body[key].trim().replace(/^@/, "");
        } else {
          patch[key] = body[key];
        }
      }
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("users")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("User update error:", error);
      return NextResponse.json({ error: "Falha" }, { status: 500 });
    }

    return NextResponse.json({ user: data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
