# Modelo de Dados — Growth Studio

> Documenta o estado **atual** do banco (Supabase / Postgres 15+).  
> Schema reproduzível em [`docs/SCHEMA.sql`](./SCHEMA.sql).  
> Última atualização: 27/04/2026 (após migration 018).

---

## 1. Visão geral

O banco tem **16 tabelas** organizadas em 4 grupos lógicos:

| Grupo | Tabelas | Propósito |
|---|---|---|
| **Identidade** | `users` | Quem é o aluno (email-based) |
| **Estratégia** | `vozes`, `icps`, `posicionamentos`, `territorios` | Camada conceitual da marca |
| **Conteúdo** | `editorias`, `ideias`, `conteudos` | Pilares + ideias + outputs do Monoflow |
| **Produto** | `ofertas`, `pitches` | O que se vende + como vende |
| **Presença** | `bios`, `destaques` | Como o perfil aparece publicamente |
| **Conversa** | `chat_sessions`, `chat_messages` | iAbdo multi-canal |
| **Observability** | `ai_calls` | Log de toda chamada Anthropic |

**Convenções:**
- Toda tabela tem `id uuid` PK + `created_at timestamptz`
- Tabelas mutáveis têm `updated_at timestamptz`
- Foreign keys de user usam `on delete cascade` (deletar user apaga tudo dele)
- jsonb pra dados estruturados que evoluem (mapas, listas)
- RLS aberto (`allow_all_*`) — ver [ARQUITETURA.md §6](./ARQUITETURA.md) pra discussão de segurança

---

## 2. ER Diagram

```
                           ┌──────────────────────┐
                           │       users          │
                           │ id, email, name,     │
                           │ instagram, atividade │
                           │ origem               │
                           │ oferta_em_foco_id ───┼──┐
                           └──────────┬───────────┘  │
                                      │              │
        ┌─────────────────────────────┼──────────────┼─────────────────────┐
        │                             │              │                     │
        ▼                             ▼              │                     ▼
   ┌─────────┐  ┌──────────┐  ┌────────────────┐    │            ┌──────────────┐
   │  vozes  │  │  icps    │  │ posicionamentos │    │            │ chat_sessions│
   │(1:1 user)│  │ (1:N)    │  │  (1:1 user)     │    │            │ (1:1 channel │
   └─────────┘  └────┬─────┘  └────────┬────────┘    │            │  +channel_   │
                     │                 │             │            │  user_id)    │
                     │                 └─ icp_id ────┤            │  user_id ────┼──↑
                     │                               │            └──────┬───────┘
                     │                               │                   │
                     │      ┌────────────────────────┘                   ▼
                     │      ▼                                     ┌──────────────┐
                     │  ┌─────────┐                               │chat_messages │
                     │  │ ofertas │ ◄── oferta_em_foco_id        │ (N:1 session)│
                     │  └────┬────┘                               └──────────────┘
                     │       │
                     │       └─── icp_id ── (referencia ICP)
                     │
                     │       ┌──────────┐
                     │       │ pitches  │
                     │       │  (N:1 ofertas)
                     │       └──────────┘
                     │
        ┌────────────┴────┬──────────────────┬─────────────────────┐
        ▼                 ▼                  ▼                     ▼
  ┌──────────┐     ┌───────────┐     ┌────────────┐         ┌───────────┐
  │territorios│     │ editorias │     │   bios     │         │ destaques │
  │ (1:1 user)│     │  (N:1)    │     │ (1:platform│         │  (N:1)    │
  └───────────┘     └─────┬─────┘     │  per user) │         └───────────┘
                          │           └────────────┘
                          ▼
                    ┌──────────┐
                    │  ideias  │
                    │  (N:1)   │
                    └──────────┘
                          │
                          ▼
                    ┌──────────┐
                    │ conteudos│   ← Monoflow outputs (1 por platform por ideia)
                    │  (N:1)   │
                    └──────────┘

  ai_calls ── (user_id opcional, log de cada chamada Anthropic)
```

**Cardinalidades-chave:**
- `users` 1:1 com `vozes`, `posicionamentos`, `territorios`
- `users` 1:N com `icps`, `ofertas`, `editorias`, `pitches`, `chat_sessions`, etc.
- `icps` 1:N com `ofertas` (pode ter várias ofertas pro mesmo ICP)
- `ofertas` 1:N com `pitches` (cada pitch é pra uma oferta)
- `editorias` 1:N com `ideias`
- `ideias` 1:N com `conteudos` (do Monoflow vêm 6 formatos por ideia)
- `chat_sessions` 1:N com `chat_messages` + 0:1 com `users` (link opcional)

---

## 3. Tabela por tabela

### 3.1 `users` — identidade do aluno

**Propósito:** lead/usuário. Email é a chave funcional (sem auth real ainda).

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | gen_random_uuid |
| `email` | `text` UNIQUE | normalizado lowercase |
| `name` | `text` | display name |
| `instagram` | `text` | sem @ no inicio (normalizado) |
| `atividade` | `text` | "O que você faz?" — contexto pra IA |
| `atividade_descricao` | `text` | "O que você resolve?" |
| `oferta_em_foco_id` | `uuid` FK → `ofertas.id` | oferta atual do criador (1 por vez) |
| `origem` | `text` | `'platform'` \| `'chat'` \| null |
| `created_at` | `timestamptz` | |
| `ultima_atividade` | `timestamptz` | atualizada em registerLead (não obrigatória) |

**Indexes:**
- `idx_users_origem` em `origem`

**Padrões de uso:**
- Cadastro: `lib/db/users.ts:registerLead()` — preserva campos vazios, não sobrescreve
- Lead capture pelo chat: `lib/chat/memory.ts:getOrCreateSession()` cria User com `origem='chat'`

---

### 3.2 `vozes` — voz da marca

**Propósito:** arquétipo + mapa de voz do criador. 1 por user (upsert).

| Coluna | Tipo | Notas |
|---|---|---|
| `user_id` | `uuid` FK → `users` | unique |
| `arquetipo_primario` | `text` | `'especialista'` \| `'protetor'` \| `'proximo'` \| `'desbravador'` |
| `arquetipo_secundario` | `text` | mesmo set |
| `justificativa` | `text` | 2-3 frases explicando |
| `mapa_voz` | `jsonb` | ver shape abaixo |
| `respostas` | `jsonb` | dict das 6 perguntas de discovery |
| `created_at`, `updated_at` | | |

**`mapa_voz` shape:**
```json
{
  "energia_arquetipica": "string",
  "tom_de_voz": "string",
  "frase_essencia": "string",
  "frase_impacto": "string",
  "palavras_usar": ["..."],
  "palavras_evitar": ["..."]
}
```

**`respostas` shape:**
```json
{
  "origem": "...",
  "virada": "...",
  "impacto": "...",
  "motivo_agora": "...",
  "pessoa_ou_marca": "...",
  "referencia": "..."
}
```

---

### 3.3 `icps` — clientes ideais

**Propósito:** perfil do cliente. Múltiplos por user (1 default na prática).

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK | |
| `name` | `text` | nome interno (ex: "Consultor B2B") |
| `niche` | `text` | nicho/segmento |
| `demographics` | `jsonb` | `{ age_range, gender, location }` |
| `pain_points` | `jsonb` | array de strings |
| `desires` | `jsonb` | array de strings |
| `objections` | `jsonb` | array de strings |
| `language_style` | `text` | descrição da preferência de linguagem |
| `tone_keywords` | `jsonb` | array |
| `created_at`, `updated_at` | | |

---

### 3.4 `posicionamentos` — declaração de posicionamento

**Propósito:** frase pública + dados estruturados (resultado/método/diferencial). 1 por user.

| Coluna | Tipo | Notas |
|---|---|---|
| `user_id` | `uuid` FK | unique |
| `icp_id` | `uuid` FK → `icps` | qual ICP esse posicionamento mira |
| `frase` | `text` | declaração principal (max 2 linhas) |
| `frase_apoio` | `text` | carrega método/autoridade (separado da principal) |
| `resultado` | `text` | resultado entregue |
| `mecanismo_nome` | `text` | nome do método (ex: "Discovery 3D") — pode ser vazio |
| `mecanismo_descricao` | `text` | descrição do método |
| `diferencial_categoria` | `text` | `'metodo'` \| `'filosofia'` \| `'origem'` |
| `diferencial_frase` | `text` | "...e me diferencio porque [X]" |
| `created_at`, `updated_at` | | |

---

### 3.5 `territorios` — universo simbólico do criador

**Propósito:** o "espaço mental" que a marca quer dominar. 1 por user.

| Coluna | Tipo | Notas |
|---|---|---|
| `user_id` | `uuid` FK | unique |
| `dominio` | `text` | descrição técnica (ex: "Vendas Consultivas B2B") — antiga `nome` |
| `ancora_mental` | `text` | 1-3 palavras emocionais (ex: "Vender é leitura") |
| `lente` | `text` | `'analitica'` \| `'humana'` \| `'provocadora'` \| `'pratica'` \| `'visionaria'` |
| `manifesto` | `text` | (legado, ainda preenchido em alguns casos) |
| `tese` | `text` | 1 frase contraintuitiva (max 12 palavras) |
| `expansao` | `text` | 1-2 frases que ampliam a tese |
| `fronteiras` | `jsonb` | array — coisas que NÃO faz |
| `fronteiras_positivas` | `jsonb` | array — coisas que defende |
| `areas_atuacao` | `jsonb` | array — onde vira negócio |
| `created_at`, `updated_at` | | |

---

### 3.6 `editorias` — pilares de conteúdo

**Propósito:** 5 macro-temas recorrentes. N por user (geralmente 5).

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK | |
| `nome` | `text` | nome curto (2-4 palavras) |
| `descricao` | `text` | o que cobre |
| `objetivo` | `text` | objetivo estratégico (1 frase) |
| `tipo_objetivo` | `text` | `'autoridade'` \| `'conectar'` \| `'provocar'` \| `'prova'` \| `'converter'` |
| `created_at` | | |

---

### 3.7 `ideias` — ideias de conteúdo geradas

**Propósito:** ideias de carrosséis/posts dentro de uma editoria.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK | |
| `editoria_id` | `uuid` FK → `editorias` (nullable) | qual editoria essa ideia pertence |
| `topic` | `text` | tema |
| `hook` | `text` | gancho do slide 1 |
| `angle` | `text` | ângulo/abordagem |
| `target_emotion` | `text` | emoção principal |
| `target_stage` | `text` | estágio Schwartz: `inconsciente` \| `problema` \| `solucao` \| `produto` \| `pronto` |
| `carousel_style` | `text` | `'educational'` \| `'storytelling'` \| `'listicle'` \| `'myth_busting'` \| `'before_after'` |
| `created_at` | | |

---

### 3.8 `conteudos` — outputs do Monoflow

**Propósito:** conteúdo final gerado (1 por plataforma a partir de uma ideia).

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK | |
| `ideia_id` | `uuid` (nullable) | ideia que originou |
| `platform` | `text` | `'reels'` \| `'post'` \| `'carousel'` \| `'stories'` \| `'linkedin'` \| `'tiktok'` \| `'mother-text'` |
| `data` | `jsonb` | conteúdo completo (estrutura varia por plataforma) |
| `created_at`, `updated_at` | | |

**`data` shape varia por `platform`:**
- `reels`: `{ title, duration, hook, scenes[], cta, caption, audio_suggestion, trend_tip }`
- `post`: `{ caption, hashtags[], best_time, image_suggestion, image_keywords[], headline_on_image }`
- `carousel`: `{ slides[], caption, hashtags[], image_keywords[] }` (slides com `index, slide_type, headline, body`)
- `stories`: `{ strategy, stories[] }` (cada story com `order, type, text, sticker, visual_tip`)
- `linkedin`: `{ post, hashtags[] }`
- `tiktok`: `{ title, duration, hook, scenes[], cta, caption, sound_suggestion, tiktok_tips }`
- `mother-text`: string única (texto-mãe)

---

### 3.9 `ofertas` — produto/serviço comercial

**Propósito:** estrutura completa de uma oferta (Hormozi-like). N por user.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK | |
| `icp_id` | `uuid` FK → `icps` | pra quem é a oferta |
| `name` | `text` | nome interno |
| `core_promise` | `text` | promessa principal |
| `dream` | `text` | sonho do cliente |
| `success_proofs` | `jsonb` | array de provas |
| `time_to_result` | `text` | em quanto tempo entrega |
| `effort_level` | `text` | esforço do cliente |
| `bonuses` | `jsonb` | array de bônus |
| `scarcity` | `text` | escassez |
| `guarantee` | `text` | garantia |
| `method_name` | `text` | nome do método (vazio se não tem) |
| `summary` | `text` | resumo em 3 bullets |
| `created_at`, `updated_at` | | |

---

### 3.10 `pitches` — pitches de venda

**Propósito:** discurso de venda principal + 2 derivados (elevator + carta).

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK | |
| `oferta_id` | `uuid` FK → `ofertas` | qual oferta esse pitch vende |
| `icp_id` | `uuid` FK → `icps` (nullable) | |
| `answers` | `jsonb` | array das 5 respostas (Q + A) |
| `pitch_text` | `text` | pitch principal completo (3-5 parágrafos) |
| `elevator_pitch_text` | `text` | versão curta ~30s (70-100 palavras) |
| `carta_vendas_text` | `text` | long form 800-1500 palavras |
| `created_at`, `updated_at` | | |

**`answers` shape:**
```json
[
  { "question": "Por que comprar de você?", "answer": "..." },
  { "question": "Por que comprar agora?", "answer": "..." },
  { "question": "Por que vai se ferrar se não comprar?", "answer": "..." },
  { "question": "Por que eu sou a pessoa indicada?", "answer": "..." },
  { "question": "Por que estou entregando mais por menos?", "answer": "..." }
]
```

---

### 3.11 `bios` — bio por plataforma

**Propósito:** bio do criador em cada rede social. 1 por (user × platform).

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK | |
| `platform` | `text` CHECK | `'instagram'` \| `'tiktok'` \| `'linkedin'` |
| `bio_text` | `text` | texto pronto pra colar (respeita limite da plataforma) |
| `created_at`, `updated_at` | | |

**Constraint:** UNIQUE (`user_id`, `platform`)

---

### 3.12 `destaques` — destaques sugeridos pra IG

**Propósito:** estrutura de highlights do perfil. 8-12 por user.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK | |
| `nome` | `text` | nome curto (cabe no balão, ~12 char) |
| `descricao` | `text` | o que vai dentro |
| `conteudo_sugerido` | `text` | stories pra montar (1 por linha) |
| `capa_sugerida` | `text` | conceito visual (cor + ícone) |
| `ordem` | `int` | ordem ideal de exibição |
| `created_at`, `updated_at` | | |

**Indexes:**
- `idx_destaques_user_ordem` em `(user_id, ordem)`

---

### 3.13 `chat_sessions` — sessões de conversa

**Propósito:** sessão por canal + identidade. Compartilhada entre web/WhatsApp/Telegram.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `channel` | `text` CHECK | `'web'` \| `'whatsapp_twilio'` \| `'whatsapp_cloud'` \| `'telegram'` |
| `channel_user_id` | `text` | web: email; whatsapp: número E.164 |
| `user_id` | `uuid` FK → `users` (nullable, on delete set null) | link opcional pra plataforma |
| `display_name` | `text` | nome exibido |
| `metadata` | `jsonb` | dados específicos do canal (User-Agent, etc.) |
| `created_at`, `last_active_at` | `timestamptz` | last_active atualizado a cada msg |

**Constraint:** UNIQUE (`channel`, `channel_user_id`)

**Indexes:**
- `idx_chat_sessions_channel_user` em `(channel, channel_user_id)`
- `idx_chat_sessions_last_active` em `last_active_at desc`

---

### 3.14 `chat_messages` — histórico de mensagens

**Propósito:** mensagens em ordem cronológica por sessão.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `session_id` | `uuid` FK → `chat_sessions` (on delete cascade) | |
| `role` | `text` CHECK | `'user'` \| `'assistant'` \| `'system'` |
| `content` | `text` | conteúdo da mensagem |
| `created_at` | `timestamptz` | |

**Indexes:**
- `idx_chat_messages_session_created` em `(session_id, created_at)`

---

### 3.15 `ai_calls` — log de chamadas Anthropic

**Propósito:** rastrear toda chamada de IA pra calcular custo + identificar gargalos.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK → `users` (nullable, on delete set null) | quem disparou (se conhecido) |
| `endpoint` | `text` | `/api/voz/generate`, `/api/chat/web`, etc. |
| `model` | `text` | `claude-haiku-4-5-20251001`, etc. |
| `tokens_in` | `int` | input tokens |
| `tokens_out` | `int` | output tokens |
| `cost_usd` | `numeric(10,6)` | calculado server-side |
| `created_at` | `timestamptz` | |

**Indexes:**
- `idx_ai_calls_created_at` em `created_at desc`
- `idx_ai_calls_endpoint` em `endpoint`
- `idx_ai_calls_user_id` em `user_id`

**Cálculo de custo (Haiku 4.5):**
```
cost_usd = (tokens_in / 1_000_000) * $1 + (tokens_out / 1_000_000) * $5
```
Override via env: `ANTHROPIC_PRICE_INPUT`, `ANTHROPIC_PRICE_OUTPUT`.

---

## 4. Padrões e convenções

### 4.1 Soft references (não-FK)
- `conteudos.ideia_id` é nullable e sem FK formal — pra permitir conteúdos órfãos se a ideia for apagada
- `ideias.editoria_id` idem

### 4.2 jsonb arrays vs tabelas separadas
**jsonb arrays** quando:
- Lista é parte intrínseca da entidade (pain_points do ICP, palavras_usar da voz)
- Não há query frequente por elemento individual

**Tabelas separadas** quando:
- Itens têm ciclo de vida próprio (editorias, ideias, conteudos)
- Existe ordenação ou filtragem complexa

### 4.3 Upsert vs Insert
- **Upsert** em tabelas 1:1 com user (`vozes`, `posicionamentos`, `territorios`)
- **Insert** em tabelas N por user (`icps`, `ofertas`, `editorias`, `ideias`, `conteudos`, `pitches`, `chat_messages`, `ai_calls`, `destaques`)
- **Upsert por (user_id, platform)** em `bios`

### 4.4 Cascading deletes
- `on delete cascade` em FKs de user → apagar conta apaga tudo
- `on delete set null` em FKs opcionais (`chat_sessions.user_id`, `ai_calls.user_id`) → preserva log/sessão

---

## 5. Migrations history

| # | Arquivo | O que adiciona |
|---|---|---|
| 001 | _(missing)_ | Tabelas iniciais (users, vozes, posicionamentos, territorios, editorias, ideias, conteudos) — criadas via UI |
| 002 | `002_icp_oferta.sql` | Tabelas `icps`, `ofertas` |
| 003 | `003_posicionamento_fields.sql` | Campos estruturados em `posicionamentos` |
| 004 | `004_user_atividade.sql` | `users.atividade`, `users.atividade_descricao` |
| 005 | `005_territorio_fields.sql` | `territorios.lente`, `manifesto`, `fronteiras` |
| 006 | `006_editorias_fields.sql` | `editorias.tipo_objetivo`, `objetivo` |
| 007 | `007_oferta_em_foco.sql` | `users.oferta_em_foco_id` |
| 008 | `008_ideias_target_emotion.sql` | `ideias.target_emotion` |
| 009 | `009_pitches.sql` | Tabela `pitches` |
| 010 | `010_ideias_target_stage.sql` | `ideias.target_stage` (Schwartz) |
| 011 | `011_territorio_refined.sql` | rename `nome→dominio` + `ancora_mental`, `tese`, `expansao`, `fronteiras_positivas`, `areas_atuacao` |
| 012 | `012_posicionamento_frase_apoio.sql` | `posicionamentos.frase_apoio` |
| 013 | `013_conteudos_updated_at.sql` | `conteudos.updated_at` |
| 014 | `014_pitch_artifacts.sql` | `pitches.elevator_pitch_text`, `carta_vendas_text` |
| 015 | `015_presenca.sql` | Tabelas `bios`, `destaques` |
| 016 | `016_chat.sql` | Tabelas `chat_sessions`, `chat_messages` |
| 017 | `017_users_origem.sql` | `users.origem` |
| 018 | `018_ai_calls.sql` | Tabela `ai_calls` |

---

## 6. Como recriar o banco do zero

Use [`docs/SCHEMA.sql`](./SCHEMA.sql) — script único, idempotente, comentado.

```bash
# Em qualquer instância Postgres 14+ (Supabase, RDS, local)
psql -f docs/SCHEMA.sql
```

Ou cola o conteúdo no Supabase SQL Editor.

O script:
- Usa `if not exists` em todas as criações
- Usa `drop policy if exists` antes de `create policy` (Postgres não tem CREATE POLICY IF NOT EXISTS)
- Pode rodar quantas vezes quiser sem efeito colateral
- Ordem de criação respeita foreign keys
