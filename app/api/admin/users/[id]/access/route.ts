import { NextResponse } from "next/server";

import { getDefaultAdminEmails, requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

// POST /api/admin/users/[id]/access
// Body: { access_status?: 'pending'|'approved'|'blocked', is_admin?: boolean }
//
// Atualiza access_status e/ou is_admin de um user. Pelo menos um campo
// precisa vir no body. Auth via cookie Supabase (admin).
//
// Protecoes:
//   - Nao deixa o admin se auto-rebaixar (is_admin=false em si mesmo)
//   - Nao deixa rebaixar default admins (renatocamarotta@gmail.com)
//   - Nao deixa bloquear default admins

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = (await _req.json()) as {
      access_status?: "pending" | "approved" | "blocked";
      is_admin?: boolean;
    };

    if (
      body.access_status === undefined &&
      body.is_admin === undefined
    ) {
      return NextResponse.json(
        { error: "Pelo menos um de access_status ou is_admin é obrigatório" },
        { status: 400 }
      );
    }

    const validStatuses = ["pending", "approved", "blocked"] as const;
    if (
      body.access_status !== undefined &&
      !validStatuses.includes(body.access_status)
    ) {
      return NextResponse.json(
        { error: "access_status inválido" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Busca o target pra validar protecoes
    const { data: target } = await supabase
      .from("users")
      .select("id, email, is_admin")
      .eq("id", id)
      .maybeSingle();

    if (!target) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const targetEmail = target.email.toLowerCase();
    const isDefaultAdmin = getDefaultAdminEmails().includes(targetEmail);

    // Nao deixa rebaixar default admin
    if (body.is_admin === false && isDefaultAdmin) {
      return NextResponse.json(
        { error: "Não é possível rebaixar um admin default." },
        { status: 403 }
      );
    }

    // Nao deixa bloquear default admin
    if (body.access_status === "blocked" && isDefaultAdmin) {
      return NextResponse.json(
        { error: "Não é possível bloquear um admin default." },
        { status: 403 }
      );
    }

    // Nao deixa o admin se auto-rebaixar
    if (auth.profile.id === id && body.is_admin === false) {
      return NextResponse.json(
        { error: "Você não pode se auto-rebaixar." },
        { status: 403 }
      );
    }

    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (body.access_status !== undefined) patch.access_status = body.access_status;
    if (body.is_admin !== undefined) patch.is_admin = body.is_admin;

    const { data, error } = await supabase
      .from("users")
      .update(patch)
      .eq("id", id)
      .select("id, email, name, access_status, is_admin")
      .single();

    if (error) {
      console.error("Update access error:", error);
      return NextResponse.json({ error: "Falha" }, { status: 500 });
    }

    return NextResponse.json({ user: data });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 }
    );
  }
}
