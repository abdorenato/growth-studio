import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

// PATCH — atualiza campos de uma ideia
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const allowedFields = [
      "topic",
      "hook",
      "angle",
      "carousel_style",
      "target_emotion",
      "target_stage",
    ];
    const patch: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body) patch[key] = body[key];
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Nada pra atualizar" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("ideias")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Ideia update error:", error);
      return NextResponse.json({ error: "Falha" }, { status: 500 });
    }

    return NextResponse.json({ ideia: data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}

// DELETE — apaga uma ideia
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { error } = await supabase.from("ideias").delete().eq("id", id);

    if (error) {
      console.error("Ideia delete error:", error);
      return NextResponse.json({ error: "Falha" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
