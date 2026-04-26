-- Marca de onde o lead veio: 'platform' (cadastro normal), 'chat' (entrou pelo iAbdo Chat).
-- null = leads anteriores a essa coluna.

alter table users add column if not exists origem text;

-- Indice opcional pra filtrar leads por origem em dashboards
create index if not exists idx_users_origem on users (origem);
