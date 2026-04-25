-- Pitch artifacts: elevator pitch (~30s) e carta de vendas (base pra email/VSL)
-- Ambos derivados de um pitch existente, salvos junto pra revisao/edicao.

alter table pitches
  add column if not exists elevator_pitch_text text,
  add column if not exists carta_vendas_text text;
