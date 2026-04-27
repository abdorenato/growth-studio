-- Bloqueio provisorio de usuario.
-- Quando blocked_at nao eh null, login e chat/session retornam 403.
-- Plataforma continua acessivel pra quem ja esta logado (sessionStorage)
-- ate dar logout — limitacao do MVP sem auth real.

alter table users add column if not exists blocked_at timestamptz;

-- Index pra queries de admin filtrarem rapido
create index if not exists idx_users_blocked_at on users (blocked_at)
  where blocked_at is not null;
