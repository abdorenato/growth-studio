-- Adiciona atividade profissional do usuário (criador de conteúdo)
-- Serve como contexto pra todos os prompts: ICP, Posicionamento, Oferta, Ideias, etc.

alter table users
  add column if not exists atividade text,
  add column if not exists atividade_descricao text;
