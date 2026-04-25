-- Refinamento do conceito de Território (alinhamento com framework conceitual)
-- - "nome" descritivo vira "dominio" (técnico, contexto interno pra IA)
-- - Adiciona "ancora_mental" (1-3 palavras emocionais que comunicam o território)
-- - Manifesto separado em "tese" + "expansao"
-- - Fronteiras ganham contraparte positiva
-- - Áreas de atuação: onde o território vira negócio (processos, sistemas, serviços)

alter table territorios rename column nome to dominio;

alter table territorios
  add column if not exists ancora_mental text,
  add column if not exists tese text,
  add column if not exists expansao text,
  add column if not exists fronteiras_positivas jsonb default '[]'::jsonb,
  add column if not exists areas_atuacao jsonb default '[]'::jsonb;
