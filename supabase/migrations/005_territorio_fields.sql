-- Territorio: adicionar campos da estrutura final (Tema + Lente + Manifesto + Fronteiras)

alter table territorios
  add column if not exists lente text,
  add column if not exists manifesto text,
  add column if not exists fronteiras jsonb default '[]'::jsonb;
