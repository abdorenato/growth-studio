// Admin auth via Supabase Auth (cookie de sessão) + flag is_admin no banco.
//
// O middleware ja garante que so users approved chegam nas rotas autenticadas,
// mas as rotas /api/admin/* precisam de uma camada extra: confirmar que o
// caller eh admin (is_admin=true em public.users).

import { createClient } from "@/lib/supabase/server";

// Default hardcoded — caso o flag is_admin nao esteja seteado por algum motivo
// (ex: edge case de migracao), esses emails ainda sao admin como fallback.
const DEFAULT_ADMIN_EMAILS = ["renatocamarotta@gmail.com"];

/**
 * Valida que o request veio de um admin logado.
 * Retorna { ok: true, profile } se autorizado, { ok: false } se nao.
 *
 * Uso:
 *   const auth = await requireAdmin();
 *   if (!auth.ok) return NextResponse.json({error}, { status: 401 });
 */
export async function requireAdmin(): Promise<
  | {
      ok: true;
      profile: {
        id: string;
        email: string;
        is_admin: boolean;
      };
    }
  | { ok: false; reason: "unauthenticated" | "not_admin" }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, reason: "unauthenticated" };

  const { data: profile } = await supabase
    .from("users")
    .select("id, email, is_admin")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!profile) return { ok: false, reason: "unauthenticated" };

  // Admin se: is_admin=true no banco OU email no fallback hardcoded
  const isAdmin =
    profile.is_admin ||
    DEFAULT_ADMIN_EMAILS.includes(profile.email.toLowerCase().trim());

  if (!isAdmin) return { ok: false, reason: "not_admin" };

  return { ok: true, profile: { ...profile, is_admin: true } };
}

/** Lista de emails admin defaults (pra UI mostrar na bulk-block 'except admins'). */
export function getDefaultAdminEmails(): string[] {
  return [...DEFAULT_ADMIN_EMAILS];
}
