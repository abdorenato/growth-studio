import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Helper de middleware Supabase: refresca a sessao a cada request,
 * propaga cookies pro browser e busca o profile do usuario logado
 * (incluindo access_status pra controle de acesso).
 *
 * Uso no middleware.ts da raiz:
 *   const { response, user, profile } = await updateSession(request);
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Importante: getUser revalida o JWT contra o servidor Supabase
  // (mais seguro que getSession que so le o cookie)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Se nao tem user logado, retorna early — rotas publicas se viram
  if (!user) {
    return { response, user: null, profile: null };
  }

  // Busca o profile correspondente em public.users
  const { data: profile } = await supabase
    .from("users")
    .select("id, email, name, access_status, is_admin")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return { response, user, profile };
}
