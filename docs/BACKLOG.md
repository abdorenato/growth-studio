# Backlog — Growth Studio

> Documento vivo. Atualiza a cada sprint.
> Priorização: RICE simplificado (Reach × Impact ÷ Effort).
> Última atualização: 28/04/2026.

---

## 🎯 Sprint atual

> **Vazio.** Topo do funil definido (waitlist ativa). Próximo: definir o que move a agulha agora.

Sugestão minha pra próximo sprint (3-5 itens, max ~2 semanas): **Fechar ciclo de waitlist + telemetria de drop-off.**

- [ ] **G-01** Email automático ao aprovar lead
- [ ] **G-02** Onboarding na 1ª vez (tour 5 telas)
- [ ] **I-01** Eventos de drop-off por módulo (já temos ai_calls, falta page_views)
- [ ] **S-02** Rate limiting nas APIs de IA

---

## 📋 Critérios de pontuação

| Dimensão | Valores | Como medir |
|---|---|---|
| **Reach** | 1 (poucos) / 2 (médios) / 3 (todos) | Quantos % dos users são impactados |
| **Impact** | 1 (incremental) / 2 (notável) / 3 (game-changer) | Movimenta métrica do funil? |
| **Effort** | S=1, M=2, L=4, XL=8 | Horas de dev |
| **Score** | `(R × I) ÷ E` | Quanto maior, mais prioritário |

Itens com **score ≥ 2** são candidatos a sprint atual. Score < 1 fica em "depois".

---

## 🚀 GROWTH & AQUISIÇÃO

### G-01 · Email automático ao aprovar lead **(P1, score 4.5)**
- **R:** 3 (todo lead aprovado) · **I:** 3 (fecha o ciclo de espera) · **E:** M
- Hoje aluno não sabe quando aprovado. Tem que adivinhar e voltar.
- Stack: Resend ($0 free tier 100 emails/dia) ou Supabase email (limitado).
- Trigger: quando admin clica "Aprovar" → manda email com link direto pro `/login` + 1 frase de boas-vindas.

### G-02 · Onboarding na 1ª vez (tour de 5 telas) **(P1, score 3)**
- **R:** 3 (todo aluno novo) · **I:** 2 · **E:** M
- Hoje aluno entra no `/dashboard` e olha pra sidebar sem saber por onde começar.
- 5 telas curtas (modal step-by-step) explicando: "Aqui você constrói voz → ICP → posicionamento... Comece pelo botão 'Voz da Marca'".
- Salva flag `users.onboarded_at` pra não mostrar de novo.

### G-03 · Email "Você está perto" pra leads inativos **(P2, score 2)**
- **R:** 3 · **I:** 2 · **E:** M
- Cron diário: pega leads aprovados que não logaram em 7d → email lembrando.
- Mesma infra de G-01 (Resend).

### G-04 · Compartilhamento público de output **(P2, score 1.5)**
- **R:** 2 · **I:** 3 · **E:** L
- Aluno gera carrossel → clica "Compartilhar" → gera link público (`/share/abc123`) com preview pra mostrar pro time/cliente.
- **Loop viral:** quem vê o output bom e não tem acesso vai pra waitlist.
- Trade-off: precisa controle de privacidade (link pode vazar).

---

## 💎 PRODUTO / UX

### P-01 · Streaming no chat (texto digitando) **(P1, score 4.5)**
- **R:** 3 (todo user que usa chat) · **I:** 3 (UX percebida muda totalmente) · **E:** M
- Hoje espera 2-5s vendo "● ● ●". Streaming = aparece palavra por palavra.
- Anthropic SDK suporta nativo. Server-Sent Events ou Streaming Response.

### P-02 · Histórico de outputs por aluno **(P1, score 3)**
- **R:** 3 · **I:** 2 · **E:** M
- Já temos as tabelas (`ideias`, `conteudos`, `pitches`). Falta UI: tela "Meu histórico" mostrando tudo que ele gerou cronologicamente.
- Permite: voltar e re-aproveitar, ver evolução.

### P-03 · Templates de oferta/pitch **(P2, score 2)**
- **R:** 2 · **I:** 2 · **E:** M
- Quando aluno chega na Oferta com 0 contexto, dá branco. Templates ("Mentoria 1:1", "Workshop", "Curso autodidata") aceleram.
- Usuário escolhe template → IA preenche com base nos dados dele.

### P-04 · Geração de capa visual pra carrossel **(P2, score 1.5)**
- **R:** 2 · **I:** 3 · **E:** L
- Hoje gera só texto + sugestão de imagem em inglês. Faltou a capa pronta.
- DALL-E ou Replicate (FLUX) pra gerar capa baseada no headline.
- Custo extra: ~$0.04/imagem.

### P-05 · Calendário editorial **(P2, score 1.5)**
- **R:** 2 · **I:** 3 · **E:** L
- Aluno gera 30 ideias mas não sabe quando postar cada uma. Calendário sugere distribuição (ex: 1 autoridade/sem, 1 conexão/sem, etc.).

### P-06 · Edição inline mais fluida (sem "Salvar" explícito) **(P3, score 1)**
- **R:** 2 · **I:** 1 · **E:** M
- Auto-save com debounce (1.5s) em todos os campos editáveis. Tira fricção.

---

## 🔒 SEGURANÇA & CONFIABILIDADE

### S-01 · RLS endurecido (por user_id) **(P1, score 6)**
- **R:** 3 · **I:** 3 · **E:** M
- Hoje `allow_all_*` em tudo. Qualquer um com anon key lê/escreve qualquer linha.
- Trocar por: `auth.uid() = user_id` em todas as policies.
- **Pré-requisito:** auth_user_id linkado em todas as tabelas (já fizemos em users).

### S-02 · Rate limiting nas APIs de IA **(P1, score 6)**
- **R:** 3 · **I:** 3 · **E:** S
- Hoje qualquer user logado pode disparar 1000 requests/min e estourar quota Anthropic ($$$).
- Vercel Edge Middleware com bucket por user_id (ex: 30 calls/min, 500/dia).
- Lib: `@upstash/ratelimit` (free tier).

### S-03 · Prompt caching Anthropic **(P1, score 4)**
- **R:** 3 · **I:** 2 (corte 90% do custo do system prompt repetido) · **E:** S
- System prompts grandes (chat tem ~3KB, monoflow tem ~5KB com strategy context) repetem call após call.
- Marca como `cache_control: { type: "ephemeral" }` → 90% mais barato + faster.
- Anthropic SDK suporta nativo.

### S-04 · Sentry / observability **(P2, score 2)**
- **R:** 3 · **I:** 1 · **E:** S
- Hoje erros caem em logs Vercel (efêmeros, 24h). Sentry: free tier 5k erros/mês, alerts por email.
- 30 min de setup.

### S-05 · Backups Supabase **(P2, score 1)**
- **R:** 3 · **I:** 3 · **E:** S
- Free tier não tem backup automático. Pago ($25/mês) tem.
- Alternativa MVP: cron GitHub Actions semanal que faz `pg_dump` e salva em release no GitHub. Crú mas funciona.

---

## 🛠 OPERAÇÕES & QUALIDADE

### O-01 · Magic link como alternativa ao Google **(P2, score 1.5)**
- **R:** 2 · **I:** 1 · **E:** M
- Quem não quer Google (privacidade, conta separada): recebe email com link de login mágico.
- Supabase Auth suporta nativo.

### O-02 · Botão "Mandar WhatsApp" no /admin **(P2, score 1.5)**
- **R:** 2 · **I:** 2 · **E:** S
- Admin clica → abre `wa.me/55<phone>?text=` com mensagem template ("Oi {nome}, você foi aprovado no Growth Studio. Acessa em growth-studio.vercel.app/login").
- Já temos phone na tabela. 30 min de trabalho.

### O-03 · Fix `middleware.ts → proxy.ts` (Next 16) **(P3, score 0.5)**
- **R:** 0 (interno) · **I:** 0 (warning, não bloqueia) · **E:** S
- Next.js 16 deprecou middleware.ts → proxy.ts. Hoje só warning.
- Trocar antes do Next 17 quebrar.

### O-04 · Migração runner automático **(P3, score 1)**
- **R:** 1 (interno) · **I:** 2 · **E:** M
- Hoje cada migration é colada manualmente no Supabase SQL Editor. Erro humano.
- `supabase migrations` CLI já suporta. Setup local + auto-apply em CI.

### O-05 · Testes mínimos (Vitest + Playwright) **(P3, score 1)**
- **R:** 1 · **I:** 1 (preventivo) · **E:** L
- ROI baixo enquanto produto pivota. Vale começar com smoke tests dos fluxos críticos: login, gerar voz, criar conteúdo.

---

## 📊 INSIGHTS & ADMIN

### I-01 · Tracking de eventos (page views, clicks) **(P1, score 3)**
- **R:** 3 · **I:** 2 · **E:** M
- Hoje só temos: counts de output (vozes, ICPs, conteúdos). Não temos "abriu /voz mas saiu sem gerar".
- Vercel Web Analytics (free) ou self-hosted (PostHog).
- Permite identificar onde o aluno trava (drop-off real).

### I-02 · Funil por cohort (semana de cadastro) **(P2, score 1.5)**
- **R:** 2 · **I:** 2 · **E:** M
- /admin atual mostra funil agregado. Por cohort: "leads que entraram em abril completaram quantos % do fluxo?"
- Saber se a curva tá melhorando ou piorando ao longo do tempo.

### I-03 · Notificação Slack/email de novos leads **(P2, score 1)**
- **R:** 1 (só admin) · **I:** 2 · **E:** S
- Webhook Slack quando alguém entra na waitlist. Real-time pra você.

### I-04 · Custo por aluno ativo (LTV unit economics) **(P3, score 1)**
- **R:** 1 (admin) · **I:** 1 · **E:** S
- Já temos `ai_calls.cost_usd` por user. Falta agregação no /admin: "alunos custam $X/mês cada um".

---

## 🌱 PLATAFORMA / FOUNDATIONAL

### F-01 · WhatsApp Twilio adapter **(P2, score 1.5)**
- **R:** 2 · **I:** 3 · **E:** L
- Engine de chat já tá modelado pra multi-canal. Falta o adapter.
- Setup Twilio + webhook + envio. ~3-4h.

### F-02 · WhatsApp Cloud API (produção, sem sandbox) **(P3, score 1)**
- **R:** 2 · **I:** 3 · **E:** L
- Quando F-01 validar, migrar pra Cloud API (não precisa "join sandbox-xxx").
- Requer conta Meta + verificação de business.

### F-03 · Telegram bot **(P3, score 0.5)**
- **R:** 1 (mercado pequeno BR) · **I:** 1 · **E:** M
- Trivial: BotFather token + adapter ~1h. Mas baixo ROI.

### F-04 · API pública pra integrações **(P3, score 0.5)**
- **R:** 1 · **I:** 2 · **E:** L
- Quando alguém pedir. Hoje ninguém pede.

### F-05 · Multi-tenant (workspaces / agências) **(P3, score 0.5)**
- **R:** 1 · **I:** 3 · **E:** XL
- Pra quando agências quiserem gerenciar múltiplas marcas.
- Schema novo (workspaces table, user_workspaces). Reescrita razoável.
- **Não fazer** até ter sinal claro de demanda.

---

## ✅ DONE (últimas releases)

### Abril 2026
- ✅ Auth Google OAuth + whitelist (pending/approved/blocked)
- ✅ Lista de espera (waitlist) na home
- ✅ /admin com aprovação inline + bloqueio individual e em massa
- ✅ Token tracking + dashboard de custo Anthropic
- ✅ Chat web público (iAbdo) com modo leitura + transcrição de voz
- ✅ Bio (IG/TikTok/LinkedIn) + Destaques de IG
- ✅ Pitch derivados (elevator + carta de vendas)
- ✅ Manuais offline (MANUAL-PRATICO + CLAUDE-PROJECT-SETUP)
- ✅ Anti-pause Supabase (cron GitHub Actions)
- ✅ Schema completo + ER documentado

### Antes (Streamlit → Next.js + módulos básicos)
- Os 9 módulos da plataforma (Voz, ICP, Posicionamento, Território, Editorias, Ideias, Monoflow, Oferta, Pitch)
- Migração de Streamlit pra Next.js 16
- Anthropic Haiku 4.5 integrado

---

## 📌 Princípios

1. **Não construir feature sem hipótese clara** — toda feature responde "qual métrica isso move?"
2. **Não escalar prematuramente** — multi-tenant, API pública, mobile nativo: ESPERA até ter sinal real
3. **Segurança vence feature shiny** — RLS endurecido > geração de imagem bonita
4. **Preferir UX over feature** — streaming no chat (P-01) > calendário editorial (P-05)
5. **Cortar dúvida com 1-2h de protótipo** — quando não souber se vale, faz protótipo simples antes de embarcar em XL

---

## 🔄 Cadência sugerida

- **Sprint = 1-2 semanas** (3-5 itens)
- **Revisão semanal** dos itens entregues + reprioriza backlog
- **Score mínimo 2** pra entrar em sprint (senão fica "alguma hora")
- **Done items** vão pro topo do `## ✅ DONE` com data
