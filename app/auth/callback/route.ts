import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

// GET /auth/callback?code=xxx&next=/dashboard
//
// Recebe o redirect do Google (via Supabase Auth), troca o code por sessao,
// faz bootstrap do user em public.users (cria se novo OU linka se ja existe
// pelo email), atualiza last_login_at e redireciona.
//
// IMPORTANTE — sobre estrategia de bootstrap:
//   - Se ja existe row em public.users com mesmo email -> LINKA (set auth_user_id)
//   - Senao, CRIA nova row com access_status='pending'
//   - access_status NUNCA eh sobrescrito aqui (preserva approved/blocked)

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();

  // 1. Troca code por sessao
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    console.error("Auth exchange error:", exchangeError);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(exchangeError.message)}`
    );
  }

  // 2. Pega user autenticado
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser || !authUser.email) {
    return NextResponse.redirect(`${origin}/login?error=no_user`);
  }

  const email = authUser.email.toLowerCase().trim();
  const meta = authUser.user_metadata || {};
  const fullName = (meta.full_name || meta.name || authUser.email.split("@")[0]) as string;
  const avatarUrl = (meta.avatar_url || meta.picture || null) as string | null;
  const providerId = (meta.provider_id || meta.sub || authUser.id) as string;

  // 3. Bootstrap em public.users
  // 3a. Tenta achar user existente pelo email (legacy lead OU re-login)
  const { data: existing } = await supabase
    .from("users")
    .select("id, access_status, auth_user_id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    // Linka auth_user_id se ainda nao tem (legacy lead fazendo primeiro login Google)
    // E atualiza dados que vieram do Google
    const patch: Record<string, unknown> = {
      auth_user_id: authUser.id,
      provider: "google",
      provider_id: providerId,
      last_login_at: new Date().toISOString(),
    };
    // So preenche se atual ta vazio (nao sobrescreve dados do user)
    if (avatarUrl) patch.avatar_url = avatarUrl;

    await supabase.from("users").update(patch).eq("id", existing.id);
  } else {
    // Cria novo (entra como pending)
    await supabase.from("users").insert({
      auth_user_id: authUser.id,
      email,
      name: fullName,
      avatar_url: avatarUrl,
      provider: "google",
      provider_id: providerId,
      origem: "platform", // veio pelo login direto
      access_status: "pending", // novo: precisa aprovacao
      last_login_at: new Date().toISOString(),
    });
  }

  // 4. Redireciona pra rota original (middleware vai verificar status e
  // redirecionar pra /pending /blocked se necessario)
  return NextResponse.redirect(`${origin}${next}`);
}
