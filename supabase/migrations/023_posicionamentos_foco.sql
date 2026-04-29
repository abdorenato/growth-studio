-- Foco da declaracao de posicionamento: 1 dor primaria + 1 desejo primario
-- escolhidos pelo usuario antes de gerar (forca a exclusao — principio
-- central de Ries/Trout/Moore/Dunford).
--
-- Salvos pra hidratar a UI quando o usuario voltar e regerar.

alter table posicionamentos
  add column if not exists dor_foco text,
  add column if not exists desejo_foco text;
