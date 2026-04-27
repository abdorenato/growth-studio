import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getFullProgress } from "@/lib/db/users";

// GET /api/me
// Retorna o profile do user logado (via Supabase Auth) + progress.
// Chamado pelo AuthBootstrap no client pra hidratar o Zustand store.
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from("users")
      .select(
        "id, email, name, instagram, atividade, atividade_descricao, oferta_em_foco_id, avatar_url, access_status, is_admin, origem, created_at"
      )
      .eq("auth_user_id", authUser.id)
      .maybeSingle();

    if (error || !profile) {
      return NextResponse.json(
        { error: "Profile não encontrado" },
        { status: 404 }
      );
    }

    let progress = {};
    try {
      progress = await getFullProgress(profile.id);
    } catch (e) {
      console.warn("getFullProgress falhou:", e);
    }

    return NextResponse.json({ user: profile, progress });
  } catch (err) {
    console.error("/api/me error:", err);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
