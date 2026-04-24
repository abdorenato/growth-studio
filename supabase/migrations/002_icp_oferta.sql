-- Tabelas adicionais: ICP e Oferta (múltiplos por usuário)

create table if not exists icps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  niche text not null,
  demographics jsonb default '{}'::jsonb,
  pain_points jsonb default '[]'::jsonb,
  desires jsonb default '[]'::jsonb,
  objections jsonb default '[]'::jsonb,
  language_style text default '',
  tone_keywords jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists ofertas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  icp_id uuid references icps(id) on delete cascade,
  name text not null,
  dream text default '',
  success_proofs jsonb default '[]'::jsonb,
  time_to_result text default '',
  effort_level text default '',
  core_promise text default '',
  bonuses jsonb default '[]'::jsonb,
  scarcity text default '',
  guarantee text default '',
  method_name text default '',
  summary text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table icps enable row level security;
alter table ofertas enable row level security;

create policy if not exists "allow_all_icps" on icps for all using (true) with check (true);
create policy if not exists "allow_all_ofertas" on ofertas for all using (true) with check (true);
