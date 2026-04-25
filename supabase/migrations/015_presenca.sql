-- Modulo Presenca: Bio (Instagram/TikTok/LinkedIn) + Destaques de Instagram

-- 1. BIOS — guarda 1 bio por plataforma por usuario
create table if not exists bios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  platform text not null check (platform in ('instagram', 'tiktok', 'linkedin')),
  bio_text text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, platform)
);

alter table bios enable row level security;
create policy "allow_all_bios" on bios for all using (true) with check (true);

-- 2. DESTAQUES — lista de destaques sugeridos pra Instagram
create table if not exists destaques (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  nome text not null,
  descricao text,
  conteudo_sugerido text,        -- lista de stories sugeridos pra montar esse destaque
  capa_sugerida text,             -- conceito de capa (cor + icone + ideia visual)
  ordem int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table destaques enable row level security;
create policy "allow_all_destaques" on destaques for all using (true) with check (true);

create index if not exists idx_destaques_user_ordem on destaques (user_id, ordem);
