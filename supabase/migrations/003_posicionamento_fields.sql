-- Posicionamento: adicionar campos do formato estruturado
-- (Eu ajudo [ICP] a [RESULTADO] através de [MECANISMO] e me diferencio porque [DIFERENCIAL])

alter table posicionamentos
  add column if not exists icp_id uuid references icps(id) on delete set null,
  add column if not exists resultado text,
  add column if not exists mecanismo_descricao text,
  add column if not exists mecanismo_nome text,
  add column if not exists diferencial_categoria text, -- metodo | filosofia | origem
  add column if not exists diferencial_frase text;
