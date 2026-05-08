// Supabase admin client — usa SERVICE_ROLE_KEY pra bypassar RLS.
//
// NUNCA usar em rotas autenticadas pelo usuario final. So usar em:
//   - Endpoints /api/admin/* APOS validacao com requireAdmin()
//   - Operacoes de sistema (cron, backfill, etc)
//
// O cliente normal (lib/supabase/server.ts createClient) usa anon key +
// cookie do user logado, sujeito a RLS. Pra UPDATE/DELETE em users
// (admin alterando outros users), RLS bloqueia silenciosamente porque
// nenhuma policy autoriza um user a editar outro.
//
// Service role bypassa todas as policies. Caller eh responsavel por
// garantir que so admin chega aqui (via requireAdmin()).
//
// SERVICE_ROLE_KEY eh secret — nunca expor pro client. Configurar em:
//   - .env.local (dev)
//   - Vercel env vars (prod) — Settings > Environment Variables

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Tipamos como `SupabaseClient` generico (sem schema tipado do projeto) pra
// que .from("qualquer_tabela") aceite e .select()/.update() nao virem `never`.
// O projeto nao usa types gerados do supabase, entao essa eh a forma certa
// de manter os endpoints admin compilando sem cast inline em cada query.
type AnySupabase = SupabaseClient<unknown, string, unknown>;

let _client: AnySupabase | null = null;

export function createServiceClient(): AnySupabase {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY não configurada. Pegue no Supabase Dashboard → Settings → API → Secret key (sb_secret_...) e adicione no .env.local + Vercel."
    );
  }

  _client = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }) as AnySupabase;

  return _client;
}
