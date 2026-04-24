import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

// PATCH — atualiza pitch (texto e/ou respostas)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if ("pitch_text" in body) patch.pitch_text = body.pitch_text;
    if ("answers" in body) patch.answers = body.answers;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("pitches")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Pitch update error:", error);
      return NextResponse.json({ error: "Falha" }, { status: 500 });
    }

    return NextResponse.json({ pitch: data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}

// DELETE — apaga pitch
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { error } = await supabase.from("pitches").delete().eq("id", id);
    if (error) return NextResponse.json({ error: "Falha" }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
