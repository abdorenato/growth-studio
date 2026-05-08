-- Adiciona updated_at na tabela users.
--
-- A tabela users foi criada antes do controle de migrations (existia
-- desde o tempo do email-only login) e nunca teve updated_at. Endpoints
-- admin tentavam setar essa coluna no UPDATE e falhavam silenciosamente
-- (50x sem mensagem clara) — bug responsavel por "admin nao consegue
-- aprovar/promover" reportado em 2026-05-08.
--
-- Adiciona a coluna pra rastreio futuro de mudancas. Backfill com
-- created_at pra registros existentes.

alter table users
  add column if not exists updated_at timestamptz default now();

update users set updated_at = created_at where updated_at is null;
