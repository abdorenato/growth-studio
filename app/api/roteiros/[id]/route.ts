import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

// PATCH — atualiza data (output editavel) do roteiro
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data } = await req.json();

    if (!data) {
      return NextResponse.json({ error: "data obrigatório" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: updated, error } = await supabase
      .from("roteiros")
      .update({ data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Roteiro update error:", error);
      return NextResponse.json({ error: "Falha" }, { status: 500 });
    }

    return NextResponse.json({ roteiro: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}

// DELETE — apaga roteiro
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { error } = await supabase.from("roteiros").delete().eq("id", id);
    if (error) {
      console.error("Roteiro delete error:", error);
      return NextResponse.json({ error: "Falha" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
