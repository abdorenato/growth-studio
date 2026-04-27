import { NextResponse } from "next/server";

import { checkAdminAuth, getAdminEmails } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

// POST /api/admin/users/bulk-block
//
// Body: {
//   scope: 'all-except-admins' | 'chat-only' | 'inactive' | 'all'
//   action: 'block' | 'unblock'
//   mode: 'preview' | 'apply'   // preview = so conta, apply = executa
// }
//
// Auth: header x-admin-email validado contra ADMIN_EMAILS
//
// Em modo 'preview' retorna { count, sample } com primeiros 5 emails
// que seriam afetados.
// Em modo 'apply' executa e retorna { affected }.

type Scope = "all-except-admins" | "chat-only" | "inactive" | "all";
type Action = "block" | "unblock";

export async function POST(req: Request) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { scope, action, mode } = (await req.json()) as {
      scope: Scope;
      action: Action;
      mode: "preview" | "apply";
    };

    const validScopes: Scope[] = ["all-except-admins", "chat-only", "inactive", "all"];
    if (!validScopes.includes(scope)) {
      return NextResponse.json({ error: "scope inválido" }, { status: 400 });
    }
    if (action !== "block" && action !== "unblock") {
      return NextResponse.json({ error: "action inválida" }, { status: 400 });
    }
    if (mode !== "preview" && mode !== "apply") {
      return NextResponse.json({ error: "mode inválido" }, { status: 400 });
    }

    const supabase = await createClient();
    const adminEmails = getAdminEmails();

    // Pra desbloqueio em massa, scope = 'all' (afeta todos os blocked) é o caso comum
    if (action === "unblock") {
      const { data: candidates } = await supabase
        .from("users")
        .select("id, email")
        .not("blocked_at", "is", null);
      const ids = (candidates || []).map((u) => u.id);

      if (mode === "preview") {
        return NextResponse.json({
          count: ids.length,
          sample: (candidates || []).slice(0, 5).map((u) => u.email),
        });
      }

      if (ids.length === 0) {
        return NextResponse.json({ affected: 0 });
      }

      const { error } = await supabase
        .from("users")
        .update({ blocked_at: null })
        .in("id", ids);

      if (error) throw new Error(error.message);
      return NextResponse.json({ affected: ids.length });
    }

    // BLOCK: monta query base (so blocked_at is null pra nao re-bloquear)
    let q = supabase
      .from("users")
      .select("id, email")
      .is("blocked_at", null);

    if (scope === "all-except-admins") {
      // Filtra adminEmails fora
      q = q.not("email", "in", `(${adminEmails.map((e) => `"${e}"`).join(",")})`);
    } else if (scope === "chat-only") {
      q = q.eq("origem", "chat");
    } else if (scope === "inactive") {
      const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      q = q.lt("created_at", cutoff);
    }
    // scope === 'all' → sem filtro adicional (BLOQUEIA TODOS, inclusive admin!)

    const { data: candidates, error: selErr } = await q;
    if (selErr) throw new Error(selErr.message);

    let filtered = candidates || [];

    // Pra 'inactive' filtra ainda mais: apenas quem nao tem voz nem ICP
    if (scope === "inactive") {
      const { data: vozes } = await supabase.from("vozes").select("user_id");
      const { data: icps } = await supabase.from("icps").select("user_id");
      const usuariosAtivos = new Set([
        ...(vozes || []).map((v: { user_id: string }) => v.user_id),
        ...(icps || []).map((i: { user_id: string }) => i.user_id),
      ]);
      filtered = filtered.filter((u) => !usuariosAtivos.has(u.id));
    }

    if (mode === "preview") {
      return NextResponse.json({
        count: filtered.length,
        sample: filtered.slice(0, 5).map((u) => u.email),
      });
    }

    if (filtered.length === 0) {
      return NextResponse.json({ affected: 0 });
    }

    const { error: updErr } = await supabase
      .from("users")
      .update({ blocked_at: new Date().toISOString() })
      .in(
        "id",
        filtered.map((u) => u.id)
      );

    if (updErr) throw new Error(updErr.message);

    return NextResponse.json({ affected: filtered.length });
  } catch (err) {
    console.error("Bulk block error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 }
    );
  }
}
