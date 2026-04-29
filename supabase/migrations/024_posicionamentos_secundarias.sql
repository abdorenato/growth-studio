-- Foco secundario do posicionamento: 1 dor + 1 desejo opcionais que aparecem
-- na FRASE DE APOIO (nao na declaracao principal). Permite enriquecer o
-- contexto sem diluir o angulo central.
--
-- Estrutura final:
--   dor_foco        → declaracao principal  (PRIMARIA)
--   dor_secundaria  → frase de apoio        (SECUNDARIA, opcional)
--   desejo_foco     → declaracao principal  (PRIMARIA)
--   desejo_secundaria → frase de apoio      (SECUNDARIA, opcional)

alter table posicionamentos
  add column if not exists dor_secundaria text,
  add column if not exists desejo_secundaria text;
