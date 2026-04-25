-- Adiciona updated_at em conteudos pra rastrear edições

alter table conteudos
  add column if not exists updated_at timestamptz default now();
