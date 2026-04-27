# SQL operacional — investigação e bloqueio de usuários

Queries prontas pra colar no **Supabase SQL Editor**.

---

## 🔍 1. Investigar 1 usuário específico

### 1A. Visão geral (1 linha)

Substitui `'EMAIL_AQUI'` pelo email do aluno.

```sql
with target as (
  select id, email, name, instagram, atividade, atividade_descricao,
         origem, blocked_at, created_at
  from users
  where email = 'EMAIL_AQUI'
  limit 1
)
select
  t.email,
  t.name,
  t.instagram,
  t.atividade,
  coalesce(t.origem, '—')                                    as origem,
  case when t.blocked_at is not null then 'SIM' else 'não' end as bloqueado,
  to_char(t.created_at, 'DD/MM/YY HH24:MI')                   as entrou_em,

  -- Estado de cada módulo (booleano)
  exists(select 1 from vozes           where user_id = t.id)    as voz,
  exists(select 1 from icps            where user_id = t.id)    as icp,
  exists(select 1 from posicionamentos where user_id = t.id)    as posicionamento,
  exists(select 1 from territorios     where user_id = t.id)    as territorio,

  -- Counts dos módulos N por user
  (select count(*)::int from editorias where user_id = t.id)   as n_editorias,
  (select count(*)::int from ideias    where user_id = t.id)   as n_ideias,
  (select count(*)::int from conteudos where user_id = t.id)   as n_conteudos,
  (select count(*)::int from ofertas   where user_id = t.id)   as n_ofertas,
  (select count(*)::int from pitches   where user_id = t.id)   as n_pitches,
  (select count(*)::int from bios      where user_id = t.id)   as n_bios,
  (select count(*)::int from destaques where user_id = t.id)   as n_destaques,

  -- Atividade no chat
  (select count(*)::int from chat_sessions  where user_id = t.id)                              as n_sessoes_chat,
  (select count(*)::int from chat_messages cm
     join chat_sessions cs on cs.id = cm.session_id
     where cs.user_id = t.id and cm.role = 'user')                                              as n_msgs_chat_enviadas,
  (select max(last_active_at) from chat_sessions where user_id = t.id)                          as ultima_atividade_chat,

  -- Custo de IA acumulado
  (select coalesce(sum(tokens_in), 0)::int  from ai_calls where user_id = t.id)                 as tokens_in_total,
  (select coalesce(sum(tokens_out), 0)::int from ai_calls where user_id = t.id)                 as tokens_out_total,
  (select coalesce(sum(cost_usd), 0)::numeric(10,4) from ai_calls where user_id = t.id)         as custo_usd_total,
  (select count(*)::int from ai_calls where user_id = t.id)                                     as n_ai_calls
from target t;
```

Resultado: 1 linha com email, perfil, status de cada módulo, counts e custo.

---

### 1B. Histórico de mensagens no chat

```sql
select
  cm.role,
  to_char(cm.created_at, 'DD/MM HH24:MI') as quando,
  left(cm.content, 200)                    as preview
from chat_messages cm
join chat_sessions cs on cs.id = cm.session_id
join users u          on u.id  = cs.user_id
where u.email = 'EMAIL_AQUI'
order by cm.created_at desc
limit 100;
```

---

### 1C. Chamadas de IA dele (todas)

```sql
select
  to_char(c.created_at, 'DD/MM HH24:MI') as quando,
  c.endpoint,
  c.tokens_in,
  c.tokens_out,
  to_char(c.cost_usd, 'FM$0.000000')      as custo
from ai_calls c
join users u on u.id = c.user_id
where u.email = 'EMAIL_AQUI'
order by c.created_at desc
limit 200;
```

---

### 1D. Custo agrupado por endpoint (descobre o que ele mais usa)

```sql
select
  c.endpoint,
  count(*)::int                              as chamadas,
  sum(c.tokens_in)::int                       as tokens_in,
  sum(c.tokens_out)::int                      as tokens_out,
  to_char(sum(c.cost_usd), 'FM$0.0000')       as custo_total
from ai_calls c
join users u on u.id = c.user_id
where u.email = 'EMAIL_AQUI'
group by c.endpoint
order by sum(c.cost_usd) desc;
```

---

## 🚫 2. Bloquear 1 usuário (provisório)

### 2A. Bloquear

```sql
update users
set blocked_at = now()
where email = 'EMAIL_AQUI'
returning id, email, name, blocked_at;
```

**O que acontece:**
- ✅ Próximo login retorna **403** com mensagem "Sua conta está temporariamente bloqueada."
- ✅ Próxima entrada no `/chat` retorna **403** idem.
- ⚠️ **Sessões já abertas continuam funcionando** até o user dar logout (sessionStorage no browser não é invalidado server-side).
- ✅ Os dados dele **continuam intactos** (não apaga nada, só impede novos logins).

### 2B. Desbloquear

```sql
update users
set blocked_at = null
where email = 'EMAIL_AQUI'
returning id, email, name;
```

### 2C. Listar todos os usuários atualmente bloqueados

```sql
select
  email,
  name,
  to_char(blocked_at, 'DD/MM/YY HH24:MI') as bloqueado_desde
from users
where blocked_at is not null
order by blocked_at desc;
```

### 2D. Forçar logout (se quiser invalidar sessão imediatamente)

Não temos auth real, então não dá pra invalidar JWT. **A sessão dele só acaba quando:**
1. Ele fecha o browser (sessionStorage limpa)
2. Ele clica em "Sair"
3. Ele dá refresh forçado E o navegador limpa storage por algum motivo

**Workaround se for urgente:** apagar o usuário inteiro (destrutivo) ou trocar o email dele:

```sql
-- Opção drástica: troca o email pra invalidar acesso
-- (assim mesmo se ele tiver o "lembrar email" no localStorage, login via
-- email antigo retorna 404, e ele não tem o novo email)
update users
set email = email || '.bloqueado-' || extract(epoch from now())::bigint
where email = 'EMAIL_AQUI';
```

**Risco:** se desbloquear depois precisa reverter o nome do email manualmente.

---

## 🚧 3. Bloquear vários usuários de uma vez

### 3A. Bloquear TODOS

```sql
update users
set blocked_at = now()
where blocked_at is null;
```

> ⚠️ **Atenção:** isso te bloqueia também (inclusive admins). Use a versão 3B se quiser preservar acesso ao `/admin`.

> O `blocked_at is null` no WHERE preserva o timestamp original de quem já estava bloqueado (não "re-bloqueia").

### 3B. Bloquear todos EXCETO admins (mantém você acessando /admin)

Ajuste a lista de emails que devem continuar liberados:

```sql
update users
set blocked_at = now()
where blocked_at is null
  and email not in (
    'renatocamarotta@gmail.com'
    -- adicione outros admins aqui:
    -- , 'outro@admin.com'
  );
```

### 3C. Bloquear só leads vindos do chat (preservar quem cadastrou via plataforma)

```sql
update users
set blocked_at = now()
where blocked_at is null
  and origem = 'chat';
```

### 3D. Bloquear leads inativos (entraram, nunca usaram)

Bloqueia quem entrou há mais de 7 dias e não tem nenhum módulo gerado:

```sql
update users
set blocked_at = now()
where blocked_at is null
  and created_at < now() - interval '7 days'
  and id not in (select user_id from vozes where user_id is not null)
  and id not in (select user_id from icps where user_id is not null);
```

### 3E. Desbloquear TODOS

```sql
update users set blocked_at = null;
```

### 3F. Desbloquear seletivamente

```sql
update users
set blocked_at = null
where email in (
  'a@x.com',
  'b@y.com'
);
```

---

### Diferença entre `REGISTRATION_CLOSED` e bloqueio em massa

| | `REGISTRATION_CLOSED=true` (env var) | `update users set blocked_at = now()` |
|---|---|---|
| **Bloqueia** | Cadastros NOVOS | Usuários EXISTENTES |
| **Onde** | Vercel env var + redeploy | SQL no Supabase |
| **Quem entra** | Quem já tem conta passa | Ninguém passa (até desbloquear) |
| **Reverter** | Remove env var + redeploy | UPDATE …blocked_at = null |
| **Use quando** | Quer pausar inscrições | Quer pausar PLATAFORMA |

**Combinar os 2:** `REGISTRATION_CLOSED=true` + `update users set blocked_at = now()` → sistema 100% fechado. Pra liberar alguém: `update users set blocked_at = null where email = 'X'` (não precisa remover a env var).

---

## 🚨 3. Cenários comuns

### Aluno sumiu — quero ver o que ele fez antes de ir embora
Usa **1A** + **1B** + **1D**. Em 30s entende todo o uso dele.

### Achei um aluno com uso suspeito (custo absurdo)
1. Roda **1D** com o email → vê qual endpoint puxou mais
2. Roda **1C** pra ver as chamadas individuais com timestamps (talvez seja loop bug)
3. Se confirmar abuso, **2A** pra bloquear
4. Investiga, corrige a causa
5. **2B** pra desbloquear depois

### Reembolso / desistente
- **2A** bloqueia novos acessos
- Dados ficam preservados (caso queira reverter)
- Pra apagar de vez (LGPD): `DELETE FROM users WHERE email = '...'` — cascade limpa tudo

### Auditoria de custo
- Roda **1A** sem WHERE pra todos os usuários (remove a CTE e replica os subqueries pra cada user) — ou usa o `/admin` que já mostra top users
