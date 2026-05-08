-- Backfill corretivo da migration 026.
--
-- Cenario: a migration 026 setou access_status='blocked' em todo user
-- com blocked_at != null. Mas leads legacy (waitlist, chat, etc) podem
-- ter ganhado blocked_at por motivos antigos (rotinas removidas) sem
-- que o admin tivesse decidido bloqueia-los de fato.
--
-- Resultado: quando faziam o primeiro login pelo Google, ja caiam em
-- /blocked sem nunca terem entrado na lista de aprovacao.
--
-- FIX 1 (codigo): callback agora reseta access_status pra 'pending' no
-- primeiro login Google de quem esta blocked sem auth_user_id.
--
-- FIX 2 (este SQL): backfill — pra leads que ja existem mas ainda nao
-- fizeram login (auth_user_id IS NULL), volta access_status pra 'pending'
-- e limpa blocked_at, pra entrarem na lista de aprovacao do admin.
--
-- IMPORTANTE: NAO afeta users que ja fizeram login Google (auth_user_id
-- != NULL) — esses estao bloqueados por decisao real do admin e devem
-- continuar bloqueados.

update users
set access_status = 'pending',
    blocked_at = null
where access_status = 'blocked'
  and auth_user_id is null;

-- Verificacao (rode separado):
-- select count(*) as desbloqueados from users
--   where access_status = 'pending' and auth_user_id is null;
