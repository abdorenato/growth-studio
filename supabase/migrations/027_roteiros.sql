-- Tabela pra persistir roteiros gerados pelo modulo Roteiros de Milhoes.
-- Mesmo padrao da tabela conteudos: jsonb na coluna `data` pra acomodar
-- o schema flexivel de blocos sem precisar migrar a cada ajuste de prompt.

create table if not exists roteiros (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  ideia_id uuid references ideias(id) on delete set null,

  -- Briefing (pra poder regerar/auditar depois)
  topic text not null,
  hook text,
  angle text,
  formato text not null,        -- revelacao_retardada | contra_obvio | ...
  tom text not null,            -- provocadora | elegante | narrativa | agressiva
  plataforma text not null,     -- instagram | tiktok
  target_stage text,            -- estagio de consciencia (Eugene Schwartz)
  editoria_id uuid references editorias(id) on delete set null,
  atrelar_oferta boolean default false,

  -- Output completo (hook + blocos + frase_memoravel + cta + audio + legenda + hashtags)
  data jsonb not null,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists roteiros_user_id_idx on roteiros(user_id);
create index if not exists roteiros_ideia_id_idx on roteiros(ideia_id);
create index if not exists roteiros_created_at_idx on roteiros(created_at desc);
