-- Adiciona coluna target_emotion pra completar dados das ideias
alter table ideias
  add column if not exists target_emotion text;
