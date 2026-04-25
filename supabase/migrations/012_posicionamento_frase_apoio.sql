-- Frase de apoio do posicionamento (diferencial/autoridade separado da declaração principal)

alter table posicionamentos
  add column if not exists frase_apoio text;
