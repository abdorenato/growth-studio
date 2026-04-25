-- Estágio de Consciência (Eugene Schwartz) por ideia individual
-- Valores: inconsciente | problema | solucao | produto | pronto

alter table ideias
  add column if not exists target_stage text;
