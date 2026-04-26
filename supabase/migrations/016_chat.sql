-- iAbdo Chat — multi-canal (web, whatsapp, etc)
-- Engine compartilhado, adapters diferentes por canal.

-- 1. SESSOES — 1 sessao por canal+identidade
create table if not exists chat_sessions (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('web', 'whatsapp_twilio', 'whatsapp_cloud', 'telegram')),
  channel_user_id text not null,                 -- web: email; whatsapp: numero E.164
  user_id uuid references users(id) on delete set null,  -- opcional: linka com user da plataforma
  display_name text,
  metadata jsonb default '{}'::jsonb,            -- coisas opcionais por canal (User-Agent, etc.)
  created_at timestamptz default now(),
  last_active_at timestamptz default now(),
  unique (channel, channel_user_id)
);

alter table chat_sessions enable row level security;
create policy "allow_all_chat_sessions" on chat_sessions for all using (true) with check (true);

create index if not exists idx_chat_sessions_channel_user on chat_sessions (channel, channel_user_id);
create index if not exists idx_chat_sessions_last_active on chat_sessions (last_active_at desc);

-- 2. MENSAGENS — historico em ordem cronologica por sessao
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz default now()
);

alter table chat_messages enable row level security;
create policy "allow_all_chat_messages" on chat_messages for all using (true) with check (true);

create index if not exists idx_chat_messages_session_created on chat_messages (session_id, created_at);
