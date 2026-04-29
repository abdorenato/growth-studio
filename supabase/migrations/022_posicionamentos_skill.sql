-- Skill (estilo) usado pra gerar a declaracao de posicionamento.
-- 5 opcoes: ries_trout (default), ogilvy, miller, godin, dunford.
-- Permite ao usuario regerar a declaracao em outro estilo sem perder
-- os outros campos (resultado, mecanismo, diferencial).

alter table posicionamentos
  add column if not exists skill text default 'ries_trout';
