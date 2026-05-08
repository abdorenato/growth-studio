import { NextResponse } from "next/server";

import { getDefaultAdminEmails, requireAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/admin";

// DELETE /api/admin/users/[id]
//
// Apaga o usuario completamente:
//   1. Deleta row de public.users (cascade rola se FKs tiverem ON DELETE
//      CASCADE; se nao, retorna erro pra UI mostrar)
//   2. Deleta de auth.users (Supabase Auth) se tiver auth_user_id linkado
//
// Auth: cookie do admin via requireAdmin
//
// Protecoes:
//   - Nao deleta admins default (renatocamarotta@gmail.com)
//   - Nao deleta o proprio admin logado
//
// IRREVERSIVEL — UI exige confirmacao dupla (digitar email).

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const supabase = createServiceClient();

    // Busca o target pra validar protecoes
    const { data: target } = await supabase
      .from("users")
      .select("id, email, auth_user_id")
      .eq("id", id)
      .maybeSingle<{
        id: string;
        email: string;
        auth_user_id: string | null;
      }>();

    if (!target) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const targetEmail = target.email.toLowerCase();
    const isDefaultAdmin = getDefaultAdminEmails().includes(targetEmail);

    if (isDefaultAdmin) {
      return NextResponse.json(
        { error: "Não é possível apagar um admin default." },
        { status: 403 }
      );
    }

    if (auth.profile.id === id) {
      return NextResponse.json(
        { error: "Você não pode se auto-apagar." },
        { status: 403 }
      );
    }

    // 1. Deleta row de public.users
    // Cascade depende de FKs configuradas (ON DELETE CASCADE) nas tabelas
    // dependentes (icps, vozes, conteudos, etc). Se nao tiver, o DB retorna
    // erro de FK e mostramos pra UI.
    const { error: dbError } = await supabase
      .from("users")
      .delete()
      .eq("id", id);

    if (dbError) {
      console.error("Delete user db error:", JSON.stringify(dbError));
      return NextResponse.json(
        {
          error: dbError.message || "Falha ao apagar do banco.",
          hint: dbError.hint,
          details: dbError,
        },
        { status: 500 }
      );
    }

    // 2. Deleta de auth.users (Supabase Auth) — best-effort, nao bloqueia
    // se falhar (public.users ja foi). Sem auth_user_id, pula.
    if (target.auth_user_id) {
      try {
        // `supabase.auth.admin` requer service role (que ja temos)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const adminAuth = (supabase as any).auth.admin;
        await adminAuth.deleteUser(target.auth_user_id);
      } catch (authErr) {
        console.error("Delete auth user (non-fatal):", authErr);
      }
    }

    return NextResponse.json({
      ok: true,
      deleted: { id: target.id, email: target.email },
    });
  } catch (err) {
    console.error("Delete user exception:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
