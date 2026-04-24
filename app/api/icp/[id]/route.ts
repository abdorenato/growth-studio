import { NextResponse } from "next/server";

import { deleteICP, getICP, updateICP } from "@/lib/db/icp";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const icp = await getICP(id);
  if (!icp) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json({ icp });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const updated = await updateICP(id, body);
  if (!updated) return NextResponse.json({ error: "Falha" }, { status: 500 });
  return NextResponse.json({ icp: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ok = await deleteICP(id);
  if (!ok) return NextResponse.json({ error: "Falha" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
