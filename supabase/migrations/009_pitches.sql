-- Pitches salvos: cada um vinculado a uma oferta + ICP

create table if not exists pitches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  oferta_id uuid references ofertas(id) on delete cascade,
  icp_id uuid references icps(id) on delete set null,
  answers jsonb default '[]'::jsonb,
  pitch_text text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table pitches enable row level security;
create policy "allow_all_pitches" on pitches for all using (true) with check (true);
