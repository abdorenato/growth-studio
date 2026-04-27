-- Auth com Google OAuth via Supabase Auth + whitelist de acesso.
--
-- Adiciona:
--   - auth_user_id UUID  → linka com auth.users (criada pelo Supabase Auth)
--   - provider TEXT      → 'google' (futuro: 'github', 'apple', etc.)
--   - provider_id TEXT   → ID externo do provider (sub claim do Google)
--   - avatar_url TEXT    → foto do perfil Google
--   - access_status TEXT → 'pending' | 'approved' | 'blocked'
--   - is_admin BOOLEAN   → admin do sistema (acesso ao /admin)
--   - last_login_at      → atualizado em todo login
--
-- BACKFILL:
--   - Todos usuarios existentes (criados antes desse deploy) ficam approved
--   - renatocamarotta@gmail.com fica is_admin=true
--   - Novos usuarios entram com access_status='pending' (DEFAULT)

alter table users
  add column if not exists auth_user_id uuid unique,
  add column if not exists provider text,
  add column if not exists provider_id text,
  add column if not exists avatar_url text,
  add column if not exists access_status text not null default 'pending'
    check (access_status in ('pending', 'approved', 'blocked')),
  add column if not exists is_admin boolean not null default false,
  add column if not exists last_login_at timestamptz;

-- Indices
create index if not exists idx_users_auth_user_id on users (auth_user_id);
create index if not exists idx_users_access_status on users (access_status);

-- Backfill: usuarios JA EXISTENTES (criados antes dessa migration) ficam approved
-- (nao queremos deslogar/bloquear quem ja usa o sistema)
update users
set access_status = 'approved'
where access_status = 'pending'
  and created_at < now();  -- todos os ja existentes

-- Renato como admin
update users
set is_admin = true
where lower(email) = 'renatocamarotta@gmail.com';

-- Se o renato ainda nao existe na tabela (caso edge), insere agora pra garantir
-- que ele consiga aprovar os primeiros pending users
insert into users (email, name, access_status, is_admin, origem)
select 'renatocamarotta@gmail.com', 'Renato', 'approved', true, 'platform'
where not exists (
  select 1 from users where lower(email) = 'renatocamarotta@gmail.com'
);
