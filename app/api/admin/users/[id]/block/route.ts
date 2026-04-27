import { NextResponse } from "next/server";

import { getDefaultAdminEmails, requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

// POST /api/admin/users/[id]/block
// Body: { action: 'block' | 'unblock' }
// Auth: header x-admin-email validado contra ADMIN_EMAILS
//
// Bloquear admin? NAO. Mesmo admin nao pode bloquear outro admin via UI
// (proteção pra evitar lockout acidental — se quiser fazer mesmo assim,
// rode SQL direto no Supabase).
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { action } = (await req.json()) as { action: "block" | "unblock" };

    if (action !== "block" && action !== "unblock") {
      return NextResponse.json(
        { error: "action deve ser 'block' ou 'unblock'" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Busca o user pra validar
    const { data: target } = await supabase
      .from("users")
      .select("id, email")
      .eq("id", id)
      .maybeSingle();

    if (!target) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Proteção: não bloqueia admins via UI
    if (action === "block" && getDefaultAdminEmails().includes(target.email.toLowerCase())) {
      return NextResponse.json(
        {
          error:
            "Não é possível bloquear um admin pela UI. Se realmente quiser, rode SQL direto.",
        },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("users")
      .update({
        blocked_at: action === "block" ? new Date().toISOString() : null,
      })
      .eq("id", id)
      .select("id, email, blocked_at")
      .single();

    if (error) {
      console.error("Block user error:", error);
      return NextResponse.json({ error: "Falha" }, { status: 500 });
    }

    return NextResponse.json({ user: data, action });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 }
    );
  }
}
