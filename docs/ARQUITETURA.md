# Growth Studio — Relatório de Arquitetura

> Snapshot do sistema em **27/04/2026**. Documento vivo — atualizar conforme evolui.

---

## 1. Visão geral

**Growth Studio** é uma plataforma SaaS de estratégia de marca pessoal assistida por IA. Fornece **3 superfícies de uso paralelas** sobre a mesma base de dados e metodologia:

1. **Plataforma web guiada** (`/dashboard`, `/conteudo/*`, `/produto/*`, `/presenca/*`) — wizards passo-a-passo pelos 11 módulos
2. **Chat conversacional** (`/chat`) — iAbdo via web (e futuramente WhatsApp)
3. **Painel admin** (`/admin`) — métricas operacionais e de produto
4. **Manuais offline** (`docs/MANUAL-PRATICO.md`, `docs/CLAUDE-PROJECT-SETUP.md`) — fallback resiliente

A metodologia tem **9 módulos conceituais em 3 camadas estratégicas** + **2 módulos de presença**:

```
ESTRATÉGIA          CONTEÚDO              PRODUTO            PRESENÇA
├─ Voz da Marca     ├─ Editorias          ├─ Oferta          ├─ Bio (IG/TikTok/LinkedIn)
├─ ICP              ├─ Ideias             └─ Pitch           └─ Destaques de IG
├─ Posicionamento   └─ Monoflow              ├─ + Elevator
└─ Território          (texto-mãe → 6        └─ + Carta de vendas
                        formatos)
```

---

## 2. Stack

| Camada | Tecnologia | Por quê |
|---|---|---|
| Runtime | Next.js 16 (App Router, Turbopack) | RSC, edge-friendly, build rápido |
| Linguagem | TypeScript estrito | Tipagem em todo lugar |
| Hosting | Vercel | Deploy automático por push, preview por branch, env vars |
| Database | Supabase (Postgres 15+) | RLS, realtime potencial, free tier viável pra MVP |
| LLM | Anthropic Claude (Haiku 4.5) | Custo baixo ($1/$5 per Mtok), pt-BR forte |
| State (cliente) | Zustand + sessionStorage | Lightweight, sem boilerplate |
| UI | shadcn/ui + Tailwind 4 | Componentização sem dependência runtime |
| Imagens dinâmicas | `@vercel/og` (Satori) | Carrossel/posts com texto sobreposto, sem canvas |
| Voz (browser) | Web Speech API nativa | Zero custo, ~90% de cobertura mobile |
| CI/CD | GitHub Actions | Cron de keepalive Supabase |
| Notificações | Sonner (toast) | UX leve no cliente |

**Não usamos** (decisão consciente): Auth real, Edge Functions, Storage do Supabase, OpenAI, Redis, monitoring (Sentry/Datadog), testes.

---

## 3. Arquitetura em camadas

```
┌──────────────────────────────────────────────────────────────────┐
│                          PRESENTATION                            │
│  app/                                                            │
│  ├─ page.tsx           (login/register)                          │
│  ├─ (app)/             (módulos com sidebar)                     │
│  ├─ chat/              (chat público sem login)                  │
│  ├─ admin/             (painel admin)                            │
│  └─ icon.tsx           (favicon dinâmico)                        │
└──────────────────────────────────────────────────────────────────┘
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                         API ENDPOINTS                            │
│  app/api/                                                        │
│  ├─ users/             (login, register, oferta-foco)            │
│  ├─ {voz,icp,posicionamento,territorio,editorias,ideias}/        │
│  ├─ monoflow/          (mother-text + generate)                  │
│  ├─ {oferta,pitch,bio,destaques}/                                │
│  ├─ chat/              (session, web, futuramente whatsapp)      │
│  ├─ admin/stats        (dashboard agregado)                      │
│  ├─ health/keepalive   (anti-pause Supabase)                     │
│  └─ posicionamento/render (image generation @vercel/og)          │
└──────────────────────────────────────────────────────────────────┘
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                       DOMAIN / LIB                               │
│  lib/                                                            │
│  ├─ prompts/           (1 arquivo por módulo, prompts puros)     │
│  ├─ chat/              (engine + adapters + memory + knowledge)  │
│  ├─ db/                (helpers por tabela + strategy-context)   │
│  ├─ admin/             (auth helper)                             │
│  ├─ claude.ts          (wrapper Anthropic + token logging)       │
│  ├─ supabase/          (server + client)                         │
│  ├─ {voz,territorio,editorias,estagios}/constants.ts             │
│  └─ nav.ts             (definição da sidebar dinâmica)           │
└──────────────────────────────────────────────────────────────────┘
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                              │
│  Supabase Postgres                                               │
│  ├─ users + (jsonb columns)                                      │
│  ├─ {vozes,icps,posicionamentos,territorios}                     │
│  ├─ {editorias,ideias,conteudos}                                 │
│  ├─ {ofertas,pitches}                                            │
│  ├─ {bios,destaques}                                             │
│  ├─ {chat_sessions,chat_messages}                                │
│  └─ ai_calls           (token tracking)                          │
└──────────────────────────────────────────────────────────────────┘
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                           │
│  ├─ Anthropic API     (Haiku 4.5)                                │
│  └─ Web Speech API    (browser-native, transcrição)              │
└──────────────────────────────────────────────────────────────────┘
```

### Pattern: Strategy Context

Há um helper crítico: **`lib/db/strategy-context.ts`** + **`lib/prompts/_strategy-context.ts`**. Eles centralizam a montagem do contexto estratégico (voz + ICP + posicionamento + território + editorias + oferta) que é injetado nos prompts. Toda geração de IA reaproveita o mesmo contexto, garantindo coerência.

### Pattern: Multi-canal (chat)

O chat foi desenhado em 3 camadas pra suportar futuras entradas (WhatsApp, Telegram) sem mexer no core:

```
ADAPTERS              ENGINE                STORAGE
WhatsApp ──┐
Web ───────┼─→ engine.respond() ─→ chat_sessions / chat_messages
Telegram ──┘                          └─ knowledge (system prompt)
                                      └─ memory (histórico)
                                      └─ strategy-loader (contexto)
```

---

## 4. Modelo de dados

### 4.1 Tabelas principais

| Tabela | Função | Cardinalidade típica |
|---|---|---|
| `users` | Lead + identidade. Email-based. | 1 por pessoa |
| `vozes` | Mapa de voz + arquétipos | 1 por user |
| `icps` | Cliente ideal | N por user (geralmente 1) |
| `posicionamentos` | Declaração + frase de apoio + resultado/método/diferencial | 1 por user |
| `territorios` | Domínio + lente + âncora + tese + fronteiras + áreas | 1 por user |
| `editorias` | Pilares de conteúdo | 5 por user |
| `ideias` | Ideias geradas por editoria | N por editoria |
| `conteudos` | Monoflow outputs (texto-mãe + 6 formatos) | N por user |
| `ofertas` | Ofertas comerciais | N por user |
| `pitches` | Pitch principal + elevator + carta | N por user |
| `bios` | Bio por plataforma (IG/TikTok/LinkedIn) | até 3 por user |
| `destaques` | Destaques sugeridos pra IG | 8-12 por user |
| `chat_sessions` | Sessão de conversa (multi-canal) | 1 por (user × canal) |
| `chat_messages` | Histórico de mensagens | N por sessão |
| `ai_calls` | Log de toda chamada Anthropic | 1 por call |

### 4.2 Relações chave

```
users (1) ─── (N) vozes,icps,posicionamentos,territorios,editorias,ideias,
                   conteudos,ofertas,pitches,bios,destaques,chat_sessions

ofertas (1) ─── (N) pitches  (N) ─── (1..3) elevator/carta_text por pitch
icps (1) ─── (N) ofertas
editorias (1) ─── (N) ideias
chat_sessions (1) ─── (N) chat_messages
```

### 4.3 Identidade & lead capture

- **Sem auth real** — email é a chave primária funcional
- Usuário se "loga" enviando email; se não existe, é criado
- Coluna `users.origem` rastreia: `'platform'` (cadastro tradicional) | `'chat'` (entrou pelo chat) | `null` (anterior)
- Chat e plataforma compartilham a mesma tabela `users` — lead que entra via chat e depois cadastra na plataforma é a mesma pessoa

### 4.4 Migrations

`supabase/migrations/001_init.sql` … `018_ai_calls.sql` — total 18 migrations, idempotentes (`if not exists` + `drop policy if exists`).

---

## 5. Fluxos principais

### 5.1 Geração via plataforma

```
Aluno → /conteudo/voz (página com formulário/wizard)
      → fetch POST /api/voz/generate {answers, userId}
      → callClaude(system, user, maxTokens, {endpoint, userId})
        ├─ chama Anthropic
        └─ logAiCall (fire-and-forget) → ai_calls
      → parseJSON
      → frontend renderiza + permite editar
      → fetch POST /api/voz {user_id, ...result}
      → INSERT em vozes
      → updateProgress("voz", true) no Zustand
```

### 5.2 Chat (web)

```
Aluno → /chat (entrada com email + nome + @)
      → POST /api/chat/session {email, displayName, instagram}
        └─ getOrCreateSession (lib/chat/memory.ts)
           ├─ procura User existente por email (linka via user_id)
           ├─ OU cria User novo com origem='chat' (lead capture)
           └─ cria/recupera chat_sessions
      → renderiza conversa (com histórico se houver)

Cada mensagem:
  → POST /api/chat/web {sessionId, message}
  → engine.respond(sessionId, message)
    ├─ appendMessage user
    ├─ getSession + getRecentMessages(30) + loadAlunoContextForChat()  ← em paralelo
    ├─ /contexto ou /debug? retorna info diagnóstica e sai
    ├─ buildSystemPrompt: IABDO_BASE + (alunoCtx se hasData)
    ├─ Anthropic SDK call
    ├─ logAiCall → ai_calls
    └─ appendMessage assistant
  → frontend atualiza DOM + auto-scroll
```

### 5.3 Modo leitura (chat conhece o aluno)

```
loadAlunoContextForChat(session):
  if !session.user_id → return {hasData: false}
  Promise.all em paralelo:
    SELECT users.* WHERE id = user_id
    SELECT vozes.* WHERE user_id
    SELECT icps.* WHERE user_id ORDER BY created_at LIMIT 1
    SELECT posicionamentos.* WHERE user_id
    SELECT territorios.* WHERE user_id
    SELECT editorias.* WHERE user_id
  + (se user.oferta_em_foco_id) SELECT ofertas.* 

  Constrói bloco de texto (~2-5 KB) com tudo que o aluno tem
  Injetado no TOPO do system prompt com wrapper emfático
  → Claude responde como se conhecesse o aluno
```

### 5.4 Token tracking

```
Toda chamada de IA:
  callClaude() / engine.respond() 
    → após resposta da Anthropic
    → logAiCall({ user_id, endpoint, model, tokens_in, tokens_out, cost_usd })
    → INSERT ai_calls (fire-and-forget, .catch logado)
    
Custo calculado:
  cost = (tokens_in / 1M × $1) + (tokens_out / 1M × $5)   [Haiku 4.5 default]
  Override via env: ANTHROPIC_PRICE_INPUT, ANTHROPIC_PRICE_OUTPUT
```

### 5.5 Admin dashboard

```
Admin → /admin (Client Component)
      → useUserStore para checar email vs DEFAULT_ADMINS
      → fetch GET /api/admin/stats?period=24h|7d|30d|all
        Header: x-admin-email = user.email
        → checkAdminAuth() valida contra ADMIN_EMAILS env + defaults
        → 401 se não autorizado
      → endpoint roda ~30 queries Supabase em paralelo
      → retorna JSON único com tudo (overview, funnel, tokens, leads, chat, growth)
      → frontend renderiza 8 seções (cards, barras, tabelas)
```

---

## 6. Segurança & autenticação

### 6.1 Modelo atual

| Vetor | Status | Comentário |
|---|---|---|
| Senha de usuário | ❌ não existe | Identidade = email apenas |
| Sessão server-side | ❌ não existe | Sem cookie de sessão; Zustand sessionStorage no client |
| RLS Supabase | ⚠️ aberto (`allow_all`) | Padrão herdado, qualquer um com anon key acessa tudo |
| Validação de input | ⚠️ parcial | Validação básica em endpoints, sem schema validation (zod) |
| CORS | ⚠️ default Vercel | Sem restrição explícita |
| Rate limiting | ❌ ausente | Aberto a abuso de quota Anthropic |
| Admin auth | ⚠️ trivial | Header `x-admin-email` validado contra env list. Quem manipula request burla. |
| Twilio webhook signing | ⏳ não implementado ainda | Vai precisar |
| HTTPS | ✅ Vercel | Forçado |
| Secrets | ✅ env vars Vercel | API keys fora do repo |

### 6.2 Realidade prática

A combinação "anon key pública + RLS aberto" significa: **qualquer aluno minimamente curioso com DevTools pode ler/escrever qualquer linha de qualquer tabela**. Inclui mensagens de chat de outros alunos, conteúdos gerados, etc.

Isso é aceitável **enquanto:**
- O produto está em fase MVP / sala de aula com pessoas conhecidas
- Não há dados sensíveis (PII além de email)
- Volume é baixo

**Não é aceitável** quando:
- Abrir pra público amplo
- Cobrar dinheiro
- Receber dados confidenciais (estratégias comerciais, depoimentos privados)

---

## 7. Riscos — por severidade

### 🔴 Alto risco

#### R1. Sem autenticação real (impersonation trivial)
**Impacto:** qualquer um digitando o email de outro usuário acessa todos os dados dele.
**Mitigação imediata:** magic link via email (Supabase Auth ou Resend) — esforço ~1 dia.
**Mitigação ideal:** Supabase Auth completo + RLS por `auth.uid()`.

#### R2. RLS aberto (`allow_all`)
**Impacto:** vazamento de dados entre usuários. Atualizações maliciosas (alguém escrever no `vozes` de outro).
**Mitigação:** policies por user_id. Esforço ~2-3h. **MAS exige R1 antes** (sem auth, RLS depende de quem mandou a request).

#### R3. Rate limiting inexistente
**Impacto:** alguém pode fazer 1000 requests pra `/api/oferta/generate` e estourar quota Anthropic ($$$). Pode ser ataque ou bug.
**Mitigação:** Vercel Edge Middleware com bucket por IP + por userId. Esforço ~3h.

#### R4. Free tier Supabase pausa em 7 dias
**Impacto:** banco fica fora do ar do nada se ninguém usar.
**Mitigação:** ✅ implementado (cron GitHub Actions a cada 3 dias chama `/api/health/keepalive`).
**Status:** baixa probabilidade agora, mas verificar se cron está rodando após primeiro merge.

### 🟡 Médio risco

#### R5. Admin auth bypassável
**Impacto:** alguém que descobre um email admin pode mandar request com header e ver tudo.
**Mitigação:** assinar requests com JWT ou usar Supabase Auth. Esforço ~2h.

#### R6. Anthropic API key revogação
**Impacto:** se a chave vazar (commit acidental, log exposto), conta pode ser drenada antes de detectar.
**Mitigação:** já está em env var. Adicionar: alertas de uso na Anthropic console + fallback se 401.

#### R7. Token tracking fire-and-forget pode perder dados
**Impacto:** se o INSERT em `ai_calls` falhar (rede, timeout), perdemos esse registro. Subestimação de custo.
**Mitigação:** retry com exponential backoff. Esforço ~1h. Ou aceitar (perda < 1% provavelmente).

#### R8. Web Speech API quebra em ambientes ruidosos
**Impacto:** transcrição ruim → frustração do aluno em mobile.
**Mitigação:** já temos UX clara (texto interim, botão stop). Pra produção: oferecer Whisper API como fallback ($0.006/min).

#### R9. Custos Anthropic crescem com uso
**Impacto:** chat pode ficar caro se um aluno tem 100+ trocas. Estimativa: ~$0.10 por aluno engajado/dia no chat.
**Mitigação:** prompt caching da Anthropic (sistema fica cacheado por 5 min, custo cai 90% em chamadas repetidas). Hoje **não estamos usando** — habilitar economiza muito. Esforço ~2h.

#### R10. Knowledge do chat hardcoded
**Impacto:** se metodologia evolui (na plataforma), o chat fica desatualizado até alguém editar `lib/chat/knowledge.ts`.
**Mitigação:** próxima iteração — gerar knowledge programaticamente a partir dos docs.

### 🟢 Baixo risco

#### R11. TypeScript trava localmente (Node 23)
**Impacto:** desenvolvedor não consegue rodar tsc local. Só vê erro no Vercel.
**Mitigação:** trocar pra Node 20 LTS no `.nvmrc`.

#### R12. Single endpoint admin é monolítico
**Impacto:** /api/admin/stats faz 30+ queries serial. Demora 2-5s. Não escala bem.
**Mitigação:** dividir em endpoints menores + cache (Edge Cache 60s).

#### R13. Distribuição manual O(users × módulos)
**Impacto:** com 500+ users, dashboard demora muito.
**Mitigação:** RPC SQL no Supabase agregando em 1 query. Esforço ~1h.

#### R14. Vendor lock-in
**Impacto:** sair de Vercel/Supabase/Anthropic é trabalhoso.
**Mitigação:** aceitar como trade-off pra velocidade. Mover só se houver razão forte (custo, regulação).

#### R15. Sem testes
**Impacto:** regressões silenciosas. Hoje confiamos em smoke tests manuais.
**Mitigação:** Vitest + Playwright. ROI baixo enquanto produto pivota.

#### R16. Sem observability
**Impacto:** quando algo quebra em produção, só vemos via Vercel function logs (efêmeros).
**Mitigação:** Sentry (free tier) ou Logtail. Esforço ~30min.

---

## 8. Dívida técnica catalogada

### Arquitetural
- [ ] Auth real (R1)
- [ ] RLS por user_id (R2)
- [ ] Rate limiting (R3)
- [ ] Prompt caching Anthropic (R9)
- [ ] Knowledge dinâmico do chat (R10)

### Performance
- [ ] Admin dashboard com cache + RPC SQL agregado (R12, R13)
- [ ] Streaming de respostas do Claude no chat (UX)
- [ ] Edge Functions onde fizer sentido

### Qualidade
- [ ] Schema validation (zod) nos endpoints
- [ ] Logging estruturado (substituir console.log scattered)
- [ ] Testes unitários nos prompts e helpers críticos
- [ ] Sentry / observability (R16)

### Operacional
- [ ] Backups Supabase (free tier não tem)
- [ ] Monitoring de quota Anthropic com alerta
- [ ] CI lint + typecheck obrigatório no PR

---

## 9. Operações

### Deploy
- **Push pra `main`** → Vercel rebuilda + deploy automático em produção
- **Push pra branch** → preview URL automático no Vercel
- **Tempo médio:** 1-2 min build + deploy

### Migrations
- Rodadas **manualmente** no Supabase SQL Editor (não há migration runner)
- Padrão: `if not exists` em tudo, `drop policy if exists` antes de `create policy`
- Histórico em `supabase/migrations/`

### Monitoramento atual
- Vercel function logs (efêmeros, ~24h retenção no free)
- Supabase Dashboard (queries, storage)
- GitHub Actions logs (keepalive)
- **/admin** custom (esse painel)

### Recuperação de incidentes
- **Banco indisponível:** Supabase status page + restore manual no dashboard
- **Vercel down:** sem fallback (raro)
- **Anthropic down:** sem fallback (raro). Plataforma fica com módulos não-IA funcionando, IA quebra
- **Chave revogada:** trocar via Anthropic Console + atualizar env var Vercel + redeploy

### Custos estimados (mês, 50 usuários ativos)
- Vercel Hobby: $0
- Supabase Free: $0 (próximo do limite com chat ativo, ~150MB)
- Anthropic: ~$15-30 (depende muito do uso de chat)
- GitHub Actions: $0 (free tier sobra)
- **Total:** ~$15-30/mês

---

## 10. Roadmap implícito (do estado atual)

### Curto prazo (semanas)
- 🟡 **Twilio WhatsApp Sandbox** — adapter já está modelado, falta implementar
- 🟡 **WhatsApp Cloud API** — produção real quando passar pela aula
- 🟢 **Prompt caching** — economia significativa (~90% no system prompt repetido)

### Médio prazo (meses)
- 🔴 **Auth real + RLS endurecido** — pré-requisito pra escalar fora da sala de aula
- 🟡 **Rate limiting** — proteção básica
- 🟡 **Streaming no chat** — UX de "digitando" real-time
- 🟢 **Telegram adapter** — facílimo, ~1h

### Longo prazo (não decidido ainda)
- Tool use no chat (iAbdo grava direto nas tabelas estratégicas)
- Multi-tenant (várias marcas / agência)
- Mobile app nativo (PWA já cobre 80% dos casos)
- Cursos / paywall

---

## 11. Métricas de saúde (o que olhar no /admin)

| Métrica | Sinal verde | Sinal amarelo | Sinal vermelho |
|---|---|---|---|
| Total leads (crescimento) | crescendo | platô | caindo |
| % que completou Voz | > 60% | 30-60% | < 30% |
| Drop-off entre módulos | < 30% por módulo | 30-60% | > 60% (problema de UX) |
| Distribuição de profundidade | mediana ≥ 3 módulos | 1-2 | 0-1 (entram e somem) |
| Custo Anthropic / lead ativo | < $0.50 | $0.50-1.00 | > $1.00 |
| Tempo médio de resposta /api/* | < 2s | 2-5s | > 5s |
| Sessões chat sem mensagens | < 10% | 10-30% | > 30% (gente entra e desiste) |

---

## 12. Como contribuir / evoluir

1. **Branch por feature** (`feat/xyz`) → preview Vercel automático
2. **Commit message** estilo conventional + Co-Authored-By quando IA ajudar
3. **Migration** sempre com nome incremental + idempotente
4. **Prompts** em `lib/prompts/{módulo}.ts` — manter prompts puros, sem efeitos colaterais
5. **Strategy context** — sempre reusar `fetchStrategyContext` em vez de queries paralelas espalhadas
6. **Token tracking** — passar `{endpoint, userId}` no `callClaude()` em qualquer endpoint novo

---

**Última atualização:** 27/04/2026 — após implementação do `/admin` (commit `c3168be`).
