-- Usuário pode ter múltiplas ofertas cadastradas mas 1 em foco por vez
-- Alimenta IA em Ideias/Monoflow quando conteúdo é de venda/conversão

alter table users
  add column if not exists oferta_em_foco_id uuid references ofertas(id) on delete set null;
