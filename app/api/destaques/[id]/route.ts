import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

// PATCH /api/destaques/[id]
// Atualiza campos do destaque (nome, descricao, conteudo_sugerido, capa_sugerida, ordem).
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
    if ("nome" in body) patch.nome = body.nome;
    if ("descricao" in body) patch.descricao = body.descricao;
    if ("conteudo_sugerido" in body) patch.conteudo_sugerido = body.conteudo_sugerido;
    if ("capa_sugerida" in body) patch.capa_sugerida = body.capa_sugerida;
    if ("ordem" in body) patch.ordem = body.ordem;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("destaques")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Destaque PATCH error:", error);
      return NextResponse.json({ error: "Falha" }, { status: 500 });
    }

    return NextResponse.json({ destaque: data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}

// DELETE /api/destaques/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { error } = await supabase.from("destaques").delete().eq("id", id);
    if (error) return NextResponse.json({ error: "Falha" }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
