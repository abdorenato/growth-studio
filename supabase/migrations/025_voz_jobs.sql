-- Voz por audio: rastreia cada job de transcricao+analise.
--
-- Fluxo:
--   1. user envia audio -> upload pro bucket 'voz-audios' -> INSERT (status='uploaded', audio_path setado)
--   2. backend transcreve (Whisper) -> UPDATE (status='transcribed', transcricao setada)
--   3. backend analisa (Claude) -> UPDATE (status='done', resultado setado)
--   4. audio eh DELETADO do bucket apos done (LGPD)
--
-- Status possiveis:
--   uploaded     → audio salvo, aguardando processamento
--   transcribing → Whisper rodando
--   transcribed  → transcricao pronta, aguardando analise
--   analyzing    → Claude rodando
--   done         → resultado final em 'resultado' jsonb
--   failed       → algo deu erro, ver 'error' text

create table if not exists voz_jobs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  status       text not null default 'uploaded' check (
    status in ('uploaded', 'transcribing', 'transcribed', 'analyzing', 'done', 'failed')
  ),
  audio_path   text,            -- path no bucket (ex: "uuid-x/uuid-y.webm"). Limpo apos done.
  audio_size   int,             -- bytes (pra metricas)
  audio_duration_s numeric,     -- segundos estimados (opcional)
  transcricao  text,            -- output do Whisper (PERSISTE — usado pra reanalise se quiser)
  resultado    jsonb,           -- { extracao_bruta, mapa_voz, insights, ... }
  error        text,            -- mensagem do erro se status='failed'
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table voz_jobs enable row level security;
drop policy if exists "allow_all_voz_jobs" on voz_jobs;
create policy "allow_all_voz_jobs" on voz_jobs for all using (true) with check (true);

-- Indices pro counter de limite por user e por dia
create index if not exists idx_voz_jobs_user_created on voz_jobs (user_id, created_at desc);
create index if not exists idx_voz_jobs_created_at on voz_jobs (created_at desc);
create index if not exists idx_voz_jobs_status on voz_jobs (status);
