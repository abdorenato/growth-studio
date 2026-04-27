-- Telefone celular (captado na lista de espera + futuras integracoes WhatsApp).
-- Nullable: usuarios atuais nao tem.

alter table users add column if not exists phone text;

-- Indice opcional pra lookup
create index if not exists idx_users_phone on users (phone) where phone is not null;
