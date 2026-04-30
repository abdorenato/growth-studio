-- BUG REPORT: tinhamos 2 sistemas de bloqueio paralelos:
--   1. blocked_at (timestamp legado, do tempo do email login)
--   2. access_status (string, lido pelo middleware do auth Google)
--
-- Endpoints /api/admin/users/[id]/block e /api/admin/users/bulk-block
-- so setavam blocked_at — middleware nao checa essa coluna, entao users
-- bloqueados conseguiam logar.
--
-- FIX:
-- 1. Endpoints atualizados pra setar access_status='blocked' (com blocked_at
--    sincronizado pra retrocompat).
-- 2. Esta migration: backfill pra sincronizar dados existentes — quem ja
--    estava bloqueado via blocked_at vira access_status='blocked' tambem.

update users
set access_status = 'blocked'
where blocked_at is not null
  and access_status != 'blocked';

-- Verificacao (rode separado depois pra conferir):
-- select count(*) as bloqueados from users where access_status = 'blocked';
-- select email, access_status, blocked_at
--   from users
--   where blocked_at is not null or access_status = 'blocked'
--   order by blocked_at desc nulls last;
