# 🚀 Growth Studio — Briefing

> Documento de bolso pra colar em conversas com mentor, peers ou IA quando
> precisar discutir o produto. Mantém atualizado.
> Última versão: 28/04/2026.

---

## TL;DR (1 frase)

**Growth Studio é uma plataforma + chat com IA que estrutura a estratégia de marca pessoal e conteúdo de um profissional numa tarde — voz, posicionamento, território, ideias, conteúdo (em 6 formatos), oferta e pitch — guiado por frameworks reais (Schwartz, Ries/Trout, Hormozi).**

---

## O problema

Profissional/consultor/criador sabe que precisa "estar nas redes" mas:

- **Não sabe o que postar.** Posta aleatório, sem fio condutor.
- **Tudo soa igual.** Não tem voz própria — copia tom de gurus, vira mais um.
- **Já leu 10 livros e fez 5 cursos**, mas continua sem aplicar. Falta método ativável.
- **Tem expertise real**, mas não consegue traduzir em posicionamento + oferta clara.
- **Pra montar isso "do zero"** custa 3-6 meses de tentativa-erro ou R$ 5-15k em consultoria.

Resultado: ou desiste, ou vai produzindo conteúdo medíocre que não converte, ou paga caro e ainda não vê resultado.

---

## A solução

Uma jornada guiada de ~1-2 horas que entrega 9 peças coerentes entre si:

```
ESTRATÉGIA       CONTEÚDO            PRODUTO          PRESENÇA
├─ Voz da marca  ├─ 5 editorias      ├─ Oferta        ├─ Bio (IG/TikTok/LI)
├─ ICP           ├─ Ideias por       └─ Pitch         └─ Destaques de IG
├─ Posiciona-    │   editoria          ├─ Elevator
│   mento        └─ Monoflow            (~30s)
└─ Território        (1 ideia →         └─ Carta de
                      6 formatos)          vendas
```

A coerência é o diferencial: voz definida no módulo 1 alimenta todos os outputs nos próximos. Posicionamento define ICP, ICP define editorias, editorias definem ideias, ideias viram conteúdo. Sem repetição, sem contradição.

**2 formas de entrar:**
1. **Plataforma web** (formulário guiado) — pra quem prefere estrutura
2. **Chat com iAbdo** (conversacional) — pra quem prefere conversar e ir descobrindo

Ambos compartilham o mesmo banco de dados — começa no chat, termina na plataforma, ou vice-versa.

---

## ICP (quem usa)

**Primário:**
- Consultores B2B (vendas, growth, marketing)
- Profissionais técnicos virando creators (devs, advogados, médicos, arquitetos)
- Pequenos empresários começando presença pessoal pra atrair clientes

**Características comuns:**
- Tem expertise real (10+ anos, ou nicho fechado)
- Não é creator full-time — produz conteúdo no tempo que sobra
- Já tentou postar e desistiu (ou nunca começou direito)
- Quer atrair leads/clientes, não fama

**Não é pra:**
- Influencer já estabelecido (já tem voz)
- Quem quer growth de produto SaaS/e-commerce (foco aqui é marca pessoal)
- Adolescente fazendo TikTok pelo TikTok

---

## O que diferencia

1. **Frameworks reais, não autoajuda.** Eugene Schwartz (estágios de consciência), Ries/Trout (posicionamento), Hormozi ($100M Offers), Carl Pearson (arquétipos). A IA aplica método, não vibe.

2. **Coerência cross-módulo.** Voz definida no módulo 1 vai pra todos os outputs subsequentes. Não tem "carrossel com 1 tom + LinkedIn com outro".

3. **1 ideia → 6 formatos automaticamente.** Reels, Post, Carrossel, Stories, LinkedIn, TikTok — partindo do mesmo "texto-mãe", com adaptação por plataforma. Multiplica produção sem criar trabalho extra.

4. **Anti-alucinação contextual.** A IA é instruída explicitamente a NÃO inventar fatos sobre o criador (anos de experiência, número de alunos, certificações). Se não tiver dado, não preenche.

5. **Dois canais paralelos:** plataforma estruturada + chat conversacional. Aluno escolhe o caminho.

---

## Como funciona (jornada típica)

```
1. Acessa /login
   └─ Login Google OAuth (acesso por convite + whitelist)
   └─ Ou entra na waitlist (nome + email + celular)

2. Aprovado → /dashboard
   └─ Sidebar mostra os 9 módulos em ordem
   └─ Locked progressivo: Voz → ICP → Posicionamento → Território → ...

3. Faz Voz (10-15 min)
   └─ Responde 6 perguntas
   └─ IA identifica arquétipo primário + secundário
   └─ Saída: mapa de voz (tom, palavras, frases)

4. Faz ICP (10 min)
   └─ Nome, nicho, demografia
   └─ IA gera dores, desejos, objeções específicas

5. Posicionamento + Território + Editorias + Ideias (40 min)
   └─ Cada módulo se ancora nos anteriores
   └─ Saída: declaração + tese + 5 pilares + 5 ideias por pilar

6. Monoflow (15 min por ideia)
   └─ Escolhe 1 ideia
   └─ IA gera texto-mãe + 6 formatos

7. Oferta + Pitch (30 min)
   └─ Estrutura comercial completa
   └─ Pitch tem 3 derivados: principal, elevator, carta de vendas

8. Bio + Destaques (10 min)
   └─ 1 bio por plataforma com constraints reais (IG 150c, TikTok 80c, LI 220c)
   └─ 8-12 destaques sugeridos pra Instagram
```

Total: ~2h de uso ativo pra sair com tudo. Aluno volta pra refinar/regerar conforme produz.

---

## Estado atual (28/04/2026)

**Acesso:**
- Fechado por convite (whitelist com `pending` / `approved` / `blocked`)
- Lista de espera ativa em `/login`
- Admin (Renato) aprova manualmente

**Métricas (refletindo dashboard `/admin`):**
- Leads totais: [confirmar no /admin]
- Distribuição origem: chat / plataforma / waitlist
- Custo Anthropic acumulado: [confirmar no /admin → tokens]
- Conteúdos gerados: [confirmar]

**Modelo de negócio:**
- Hoje: gratuito por convite (validação product-market-fit)
- Futuro: indefinido — opções na mesa: pay-per-use ($X por geração de oferta/pitch), assinatura mensal ($Y/mês), modelo "Notion" (free + pago pra recursos avançados)

**Stack:**
- Frontend/backend: Next.js 16 (App Router) + TypeScript + Tailwind 4
- Banco: Supabase Postgres
- Auth: Supabase Auth + Google OAuth
- IA: Anthropic Claude Haiku 4.5 ($1/M input, $5/M output)
- Hosting: Vercel
- Imagens: @vercel/og (Satori)
- Voz (transcrição mobile): Web Speech API nativa

---

## Top 5 features na fila

(Do `BACKLOG.md`, ordenado por score RICE)

1. **RLS endurecido** — fechar leitura/escrita por user_id (segurança crítica antes de escalar)
2. **Rate limiting nas APIs IA** — proteção contra abuso da quota Anthropic
3. **Email automático ao aprovar lead** — fechar o ciclo da waitlist
4. **Streaming no chat** — UX percebida muda totalmente (palavra por palavra vs esperar 5s)
5. **Prompt caching Anthropic** — corte de ~90% no custo do system prompt repetido

---

## Dores que assumimos (hipóteses, ainda não validadas com survey)

- 🎯 "Não sei o que postar" — falta de pilar/editoria
- 🎯 "Tudo que escrevo soa igual ao concorrente" — falta de voz própria
- 🎯 "Demoro 2 horas por post" — falta de estrutura/template
- 🎯 "Tenho expertise mas não sei traduzir em conteúdo" — falta de bridge técnica → narrativa
- 🎯 "Posto e ninguém engaja" — desalinhamento entre tema e ICP
- 🎯 "Tenho serviço/produto mas não sei vender ele" — falta de oferta estruturada
- 🎯 "Já paguei R$5k+ em curso/consultoria e não saí do lugar" — falta de execução guiada

**A validar:** rodar survey com 20-30 da waitlist perguntando dor primária + tempo gasto hoje + budget atual.

---

## Limitações conhecidas (honestidade)

- ❗ **Acesso fechado** — waitlist limita aquisição. Decisão consciente pra refinar com early users.
- ❗ **RLS aberto** (em correção). Hoje qualquer um com anon key + DevTools acessa qualquer linha. Endurecimento é P1 do sprint.
- ❗ **Sem mobile app nativo** — PWA cobre 80%, mas instalação no iOS é não-óbvia.
- ❗ **Web Speech API ~90% dos browsers** — Firefox não tem (raro em mobile, mas existe).
- ❗ **Sem pagamento** — preciso decidir modelo antes de abrir.
- ❗ **Sem testes automatizados** — conta com testes manuais. ROI baixo enquanto produto pivota.
- ❗ **Knowledge do chat hardcoded** — quando metodologia evolui, precisa editar arquivo manualmente.
- ❗ **Custos crescem com uso** — sem prompt caching ainda, cada chamada paga full price (corrige no S-03).

---

## Linhas de inovação possíveis

(Brainstorm — não comprometido)

- **Estado conversacional persistente.** iAbdo lembra do aluno (já fizemos: modo leitura). Próximo: adicionar "tool use" pro iAbdo SALVAR diretamente nas tabelas (hoje só conversa, não persiste).
- **Análise de feed atual.** Aluno conecta IG → IA analisa últimos 30 posts e diagnostica voz/posicionamento real (vs declarado).
- **Calendário automático.** Não é só listar ideias — distribui por dia, plataforma e estágio do funil considerando frequência ideal.
- **Comunidade de aprovados.** Espaço onde aprovados podem ver outputs uns dos outros (anonimizado) e aprender com casos reais.
- **Editor visual de carrossel.** Hoje gera texto + sugestão de keyword pra imagem. Próximo: capa pronta visual (DALL-E/FLUX) + Canva-like editor.
- **Diagnóstico antes da estratégia.** Aluno descreve onde está hoje e a IA recomenda por qual módulo começar (não impor sequência rígida).
- **Versão para times.** Empresa pequena (5 pessoas) compartilha território/voz e cada membro tem ICP próprio.

---

## Como conversar sobre isso

- **Pra mentor de produto:** foca em ICP + diferencial + métricas de ativação (% que termina o fluxo)
- **Pra investor (futuro):** foca em modelo de negócio + LTV/CAC potencial + total addressable market
- **Pra peer/dev:** foca em stack + arquitetura + decisões técnicas (RLS, modo leitura, multi-canal)
- **Pra aluno potencial:** foca em problema + o que sai da plataforma + tempo de uso
- **Pra IA externa (Claude.ai/ChatGPT) brainstormando:** cola este briefing inteiro + pergunta específica

---

## Documentos relacionados (no repo)

- `docs/ARQUITETURA.md` — visão técnica completa, riscos, roadmap
- `docs/CONCEITOS.md` — metodologia conceitual (frameworks)
- `docs/MODELO-DADOS.md` — schema do banco, ER diagram
- `docs/BACKLOG.md` — features priorizadas (RICE)
- `docs/SQL-OPERACIONAL.md` — queries de admin (investigar/bloquear users)
- `docs/MANUAL-PRATICO.md` — fallback offline (prompts copiáveis)
- `docs/CLAUDE-PROJECT-SETUP.md` — setup pra rodar metodologia em Claude Project
