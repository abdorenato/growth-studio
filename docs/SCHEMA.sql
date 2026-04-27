-- ============================================================================
-- Growth Studio — Schema completo (consolidado)
-- ============================================================================
-- Reproduz o estado atual do banco depois de TODAS as migrations (001-018).
-- Idempotente: pode rodar quantas vezes quiser sem efeito colateral.
--
-- Como usar:
--   - Supabase SQL Editor: cola tudo e roda
--   - Postgres local:      psql -f docs/SCHEMA.sql
--
-- Convencoes:
--   - if not exists em tudo
--   - drop policy if exists antes de create policy (Postgres nao tem CREATE
--     POLICY IF NOT EXISTS)
--   - on delete cascade nas FKs de user (apagar user apaga tudo dele)
--   - on delete set null nas FKs opcionais (preserva log/sessoes)
--
-- Ultima atualizacao: 27/04/2026 (apos migration 018_ai_calls)
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

create extension if not exists "pgcrypto"; -- pra gen_random_uuid


-- ============================================================================
-- 1. IDENTIDADE
-- ============================================================================

-- 1.1 USERS — leads/usuarios. Email-based identity (sem auth real).
create table if not exists users (
  id                    uuid primary key default gen_random_uuid(),
  email                 text not null unique,
  name                  text,
  instagram             text,
  atividade             text,                  -- "O que voce faz?" — contexto pra IA
  atividade_descricao   text,                  -- "O que voce resolve?"
  oferta_em_foco_id     uuid,                  -- FK criada depois (forward ref)
  origem                text,                  -- 'platform' | 'chat' | null
  ultima_atividade      timestamptz,
  created_at            timestamptz default now()
);

create index if not exists idx_users_origem on users (origem);

alter table users enable row level security;
drop policy if exists "allow_all_users" on users;
create policy "allow_all_users" on users for all using (true) with check (true);


-- ============================================================================
-- 2. ESTRATEGIA
-- ============================================================================

-- 2.1 VOZES — voz da marca (1 por user)
create table if not exists vozes (
  user_id                uuid primary key references users(id) on delete cascade,
  arquetipo_primario     text,                 -- especialista | protetor | proximo | desbravador
  arquetipo_secundario   text,
  justificativa          text,
  mapa_voz               jsonb default '{}'::jsonb,
  respostas              jsonb default '{}'::jsonb,
  created_at             timestamptz default now(),
  updated_at             timestamptz default now()
);

alter table vozes enable row level security;
drop policy if exists "allow_all_vozes" on vozes;
create policy "allow_all_vozes" on vozes for all using (true) with check (true);


-- 2.2 ICPS — clientes ideais (N por user)
create table if not exists icps (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references users(id) on delete cascade,
  name              text not null,
  niche             text not null,
  demographics      jsonb default '{}'::jsonb,
  pain_points       jsonb default '[]'::jsonb,
  desires           jsonb default '[]'::jsonb,
  objections        jsonb default '[]'::jsonb,
  language_style    text default '',
  tone_keywords     jsonb default '[]'::jsonb,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

alter table icps enable row level security;
drop policy if exists "allow_all_icps" on icps;
create policy "allow_all_icps" on icps for all using (true) with check (true);


-- 2.3 POSICIONAMENTOS — declaracao de posicionamento (1 por user)
create table if not exists posicionamentos (
  user_id                  uuid primary key references users(id) on delete cascade,
  icp_id                   uuid references icps(id) on delete set null,
  frase                    text,                  -- declaracao principal
  frase_apoio              text,                  -- carrega metodo/diferencial separado
  resultado                text,
  mecanismo_nome           text,
  mecanismo_descricao      text,
  diferencial_categoria    text,                  -- metodo | filosofia | origem
  diferencial_frase        text,
  created_at               timestamptz default now(),
  updated_at               timestamptz default now()
);

alter table posicionamentos enable row level security;
drop policy if exists "allow_all_posicionamentos" on posicionamentos;
create policy "allow_all_posicionamentos" on posicionamentos for all using (true) with check (true);


-- 2.4 TERRITORIOS — universo simbolico (1 por user)
create table if not exists territorios (
  user_id                  uuid primary key references users(id) on delete cascade,
  dominio                  text,                  -- descricao tecnica (era "nome")
  ancora_mental            text,                  -- 1-3 palavras emocionais
  lente                    text,                  -- analitica | humana | provocadora | pratica | visionaria
  manifesto                text,                  -- legado, ainda preenchido em alguns casos
  tese                     text,                  -- 1 frase contraintuitiva
  expansao                 text,                  -- 1-2 frases que ampliam a tese
  fronteiras               jsonb default '[]'::jsonb,  -- negativas: o que NAO faz
  fronteiras_positivas     jsonb default '[]'::jsonb,  -- o que defende
  areas_atuacao            jsonb default '[]'::jsonb,  -- onde vira negocio
  created_at               timestamptz default now(),
  updated_at               timestamptz default now()
);

alter table territorios enable row level security;
drop policy if exists "allow_all_territorios" on territorios;
create policy "allow_all_territorios" on territorios for all using (true) with check (true);


-- ============================================================================
-- 3. CONTEUDO
-- ============================================================================

-- 3.1 EDITORIAS — pilares de conteudo (5 por user)
create table if not exists editorias (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references users(id) on delete cascade,
  nome            text not null,
  descricao       text,
  objetivo        text,                       -- objetivo estrategico em 1 frase
  tipo_objetivo   text,                       -- autoridade | conectar | provocar | prova | converter
  created_at      timestamptz default now()
);

alter table editorias enable row level security;
drop policy if exists "allow_all_editorias" on editorias;
create policy "allow_all_editorias" on editorias for all using (true) with check (true);


-- 3.2 IDEIAS — ideias geradas por editoria
create table if not exists ideias (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references users(id) on delete cascade,
  editoria_id      uuid,                      -- soft ref (sem FK formal)
  topic            text not null,
  hook             text,
  angle            text,
  target_emotion   text,
  target_stage     text,                      -- inconsciente | problema | solucao | produto | pronto
  carousel_style   text,                      -- educational | storytelling | listicle | myth_busting | before_after
  created_at       timestamptz default now()
);

alter table ideias enable row level security;
drop policy if exists "allow_all_ideias" on ideias;
create policy "allow_all_ideias" on ideias for all using (true) with check (true);


-- 3.3 CONTEUDOS — outputs do Monoflow (1 por plataforma)
create table if not exists conteudos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references users(id) on delete cascade,
  ideia_id    uuid,                         -- soft ref
  platform    text not null,                -- reels | post | carousel | stories | linkedin | tiktok | mother-text
  data        jsonb not null,               -- estrutura varia por plataforma
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table conteudos enable row level security;
drop policy if exists "allow_all_conteudos" on conteudos;
create policy "allow_all_conteudos" on conteudos for all using (true) with check (true);


-- ============================================================================
-- 4. PRODUTO
-- ============================================================================

-- 4.1 OFERTAS — produtos/servicos (N por user)
create table if not exists ofertas (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references users(id) on delete cascade,
  icp_id          uuid references icps(id) on delete cascade,
  name            text not null,
  dream           text default '',
  success_proofs  jsonb default '[]'::jsonb,
  time_to_result  text default '',
  effort_level    text default '',
  core_promise    text default '',
  bonuses         jsonb default '[]'::jsonb,
  scarcity        text default '',
  guarantee       text default '',
  method_name     text default '',
  summary         text default '',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table ofertas enable row level security;
drop policy if exists "allow_all_ofertas" on ofertas;
create policy "allow_all_ofertas" on ofertas for all using (true) with check (true);

-- Forward FK: users.oferta_em_foco_id -> ofertas.id (criada agora que ofertas existe)
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'users_oferta_em_foco_id_fkey'
      and table_name = 'users'
  ) then
    alter table users
      add constraint users_oferta_em_foco_id_fkey
      foreign key (oferta_em_foco_id)
      references ofertas(id)
      on delete set null;
  end if;
end $$;


-- 4.2 PITCHES — pitches de venda + 2 derivados (elevator + carta)
create table if not exists pitches (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid references users(id) on delete cascade,
  oferta_id             uuid references ofertas(id) on delete cascade,
  icp_id                uuid references icps(id) on delete set null,
  answers               jsonb default '[]'::jsonb,    -- 5 perguntas refinadas
  pitch_text            text,                          -- pitch principal (3-5 paragrafos)
  elevator_pitch_text   text,                          -- versao curta ~30s
  carta_vendas_text     text,                          -- long form 800-1500 palavras
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

alter table pitches enable row level security;
drop policy if exists "allow_all_pitches" on pitches;
create policy "allow_all_pitches" on pitches for all using (true) with check (true);


-- ============================================================================
-- 5. PRESENCA
-- ============================================================================

-- 5.1 BIOS — bio por plataforma (1 por user x platform)
create table if not exists bios (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references users(id) on delete cascade,
  platform    text not null check (platform in ('instagram', 'tiktok', 'linkedin')),
  bio_text    text not null default '',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique (user_id, platform)
);

alter table bios enable row level security;
drop policy if exists "allow_all_bios" on bios;
create policy "allow_all_bios" on bios for all using (true) with check (true);


-- 5.2 DESTAQUES — destaques sugeridos pra Instagram
create table if not exists destaques (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references users(id) on delete cascade,
  nome                text not null,                -- curto, cabe no balao
  descricao           text,
  conteudo_sugerido   text,                         -- stories pra montar (1 por linha)
  capa_sugerida       text,                         -- conceito visual (cor + icone)
  ordem               int default 0,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

alter table destaques enable row level security;
drop policy if exists "allow_all_destaques" on destaques;
create policy "allow_all_destaques" on destaques for all using (true) with check (true);

create index if not exists idx_destaques_user_ordem on destaques (user_id, ordem);


-- ============================================================================
-- 6. CONVERSA (CHAT)
-- ============================================================================

-- 6.1 CHAT_SESSIONS — 1 sessao por canal+identidade
create table if not exists chat_sessions (
  id                 uuid primary key default gen_random_uuid(),
  channel            text not null check (channel in ('web', 'whatsapp_twilio', 'whatsapp_cloud', 'telegram')),
  channel_user_id    text not null,             -- web: email; whatsapp: numero E.164
  user_id            uuid references users(id) on delete set null,
  display_name       text,
  metadata           jsonb default '{}'::jsonb,
  created_at         timestamptz default now(),
  last_active_at     timestamptz default now(),
  unique (channel, channel_user_id)
);

alter table chat_sessions enable row level security;
drop policy if exists "allow_all_chat_sessions" on chat_sessions;
create policy "allow_all_chat_sessions" on chat_sessions for all using (true) with check (true);

create index if not exists idx_chat_sessions_channel_user on chat_sessions (channel, channel_user_id);
create index if not exists idx_chat_sessions_last_active on chat_sessions (last_active_at desc);


-- 6.2 CHAT_MESSAGES — historico em ordem cronologica
create table if not exists chat_messages (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references chat_sessions(id) on delete cascade,
  role        text not null check (role in ('user', 'assistant', 'system')),
  content     text not null,
  created_at  timestamptz default now()
);

alter table chat_messages enable row level security;
drop policy if exists "allow_all_chat_messages" on chat_messages;
create policy "allow_all_chat_messages" on chat_messages for all using (true) with check (true);

create index if not exists idx_chat_messages_session_created on chat_messages (session_id, created_at);


-- ============================================================================
-- 7. OBSERVABILITY (TOKEN TRACKING)
-- ============================================================================

-- 7.1 AI_CALLS — log de toda chamada Anthropic
create table if not exists ai_calls (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references users(id) on delete set null,
  endpoint    text,                          -- '/api/voz/generate', '/api/chat/web', etc.
  model       text not null,                 -- 'claude-haiku-4-5-20251001' etc.
  tokens_in   int,
  tokens_out  int,
  cost_usd    numeric(10, 6),                -- input * $1/M + output * $5/M (Haiku 4.5)
  created_at  timestamptz default now()
);

alter table ai_calls enable row level security;
drop policy if exists "allow_all_ai_calls" on ai_calls;
create policy "allow_all_ai_calls" on ai_calls for all using (true) with check (true);

create index if not exists idx_ai_calls_created_at on ai_calls (created_at desc);
create index if not exists idx_ai_calls_endpoint on ai_calls (endpoint);
create index if not exists idx_ai_calls_user_id on ai_calls (user_id);


-- ============================================================================
-- VERIFICACAO FINAL
-- ============================================================================
-- Lista todas as tabelas criadas (rodar pra confirmar)
-- select table_name from information_schema.tables
--   where table_schema = 'public' order by table_name;
--
-- Esperado (16 tabelas):
--   ai_calls, bios, chat_messages, chat_sessions, conteudos,
--   destaques, editorias, icps, ideias, ofertas, pitches,
--   posicionamentos, territorios, users, vozes
-- ============================================================================
