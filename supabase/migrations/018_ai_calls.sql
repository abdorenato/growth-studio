-- Tabela pra rastrear todas as chamadas pra Anthropic API.
-- Logada automaticamente pelo wrapper em lib/claude.ts.
-- Usada pelo dashboard /admin pra metricas de tokens e custo.

create table if not exists ai_calls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  endpoint text,                    -- '/api/voz/generate', '/api/chat/web', etc.
  model text not null,              -- 'claude-haiku-4-5-20251001' etc.
  tokens_in int,
  tokens_out int,
  cost_usd numeric(10, 6),          -- input * $1/M + output * $5/M (Haiku 4.5)
  created_at timestamptz default now()
);

alter table ai_calls enable row level security;
drop policy if exists "allow_all_ai_calls" on ai_calls;
create policy "allow_all_ai_calls" on ai_calls for all using (true) with check (true);

-- Indices pra dashboard ser rapido
create index if not exists idx_ai_calls_created_at on ai_calls (created_at desc);
create index if not exists idx_ai_calls_endpoint on ai_calls (endpoint);
create index if not exists idx_ai_calls_user_id on ai_calls (user_id);
