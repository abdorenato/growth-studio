-- Editorias: adicionar campos de objetivo estratégico
-- tipo_objetivo: autoridade | conectar | provocar | prova | converter
-- objetivo: texto descritivo do objetivo específico da editoria

alter table editorias
  add column if not exists tipo_objetivo text,
  add column if not exists objetivo text;
