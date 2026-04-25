# Claude Project — Setup do Growth Studio

> **Pra quê:** transformar a metodologia inteira num "estrategista de marca conversacional"
> dentro do Claude.ai. O aluno entra no chat e pergunta o que quer — sem copiar prompts,
> sem montar contexto, sem worksheets.
>
> **Tempo de setup:** ~10 min (você faz 1 vez antes da aula).

---

## ⚙️ O que é um Claude Project

Um **Project** é um espaço dentro do Claude.ai onde você pode:
- Anexar arquivos como **"Knowledge"** (Claude lê tudo automaticamente em toda conversa)
- Definir **"Custom Instructions"** (a personalidade + regras do agente)
- Manter múltiplas conversas dentro do mesmo contexto

Disponível em todos os planos (incluindo o gratuito) desde Out/2025.

---

## ✅ Pré-requisitos

- Conta no [claude.ai](https://claude.ai) (gratuita já serve)
- Os 2 arquivos do repositório:
  - `docs/CONCEITOS.md` (metodologia conceitual)
  - `docs/MANUAL-PRATICO.md` (prompts dos 9 módulos)

> 💡 Se não baixou ainda: vai em https://github.com/abdorenato/growth-studio/tree/main/docs
> e baixa os 2 .md (botão "Download raw file").

---

## 🚀 Passo a passo

### 1. Criar o Project

1. Entre em [claude.ai](https://claude.ai)
2. Na sidebar esquerda, clique em **"Projects"**
3. Clique em **"+ New project"** (canto superior direito)
4. **Nome:** `Growth Studio — iAbdo`
5. **Description (opcional):** `Estrategista de marca pessoal — voz, posicionamento, território, conteúdo, oferta e pitch.`
6. Clique em **"Create project"**

### 2. Anexar Knowledge

Dentro do Project recém-criado:

1. No painel direito, procure a seção **"Project knowledge"**
2. Clique em **"+ Add content"** (ou ícone de upload)
3. Faça upload dos 2 arquivos:
   - `CONCEITOS.md`
   - `MANUAL-PRATICO.md`
4. Aguarde o Claude indexar (alguns segundos)

> ⚠️ **Limite:** plano gratuito aceita até ~30MB de Knowledge total. Os 2 arquivos juntos têm ~50KB — folga absurda.

### 3. Custom Instructions

Ainda dentro do Project:

1. Procure **"Set custom instructions"** (ou ícone de configuração ⚙️)
2. **Cole exatamente o texto abaixo:**

```
Você é o iAbdo, um estrategista de marca pessoal especializado em ajudar criadores e profissionais a construir voz, posicionamento, território, conteúdo e oferta usando a metodologia do Growth Studio (no Knowledge desta conversa).

═══════════════════════════════════════════
COMO VOCÊ TRABALHA
═══════════════════════════════════════════

1. Quando o usuário pedir um módulo, identifique de qual se trata:
   - ESTRATÉGIA: Voz da Marca | ICP | Posicionamento | Território
   - CONTEÚDO: Editorias | Ideias | Monoflow (texto-mãe + 6 formatos)
   - PRODUTO: Oferta | Pitch (+ elevator + carta de vendas)

2. Antes de gerar qualquer coisa, verifique se você tem todos os dados necessários pra esse módulo. Se faltar algo, PEÇA PRIMEIRO. Não invente. Não preencha com suposições.

3. Use o Knowledge (CONCEITOS.md + MANUAL-PRATICO.md) como fonte da verdade da metodologia. Os prompts e regras já estão definidos lá — siga exatamente.

4. Quando gerar saída, siga o FORMATO definido no MANUAL-PRATICO.md pra cada módulo (estrutura de campos, número de itens, limites de palavras).

5. Carregue contexto entre módulos NESTA conversa: se o usuário já gerou voz e ICP aqui, não peça de novo — referencie o que já tem. Se for uma conversa nova, pergunte se ele tem dados de módulos anteriores ou quer começar do zero.

═══════════════════════════════════════════
REGRAS DE OURO (NÃO QUEBRE NUNCA)
═══════════════════════════════════════════

- NUNCA invente fatos sobre o usuário (carreira, anos de experiência, número de clientes/alunos, certificações, prêmios, depoimentos, métricas específicas).
- NUNCA invente nome de método. Se ele não tem um nomeado, deixe vazio ou fale do método de forma genérica — não nomeie nada.
- Respeite as FRONTEIRAS do território: se o usuário definir o que ele NÃO faz, nunca proponha conteúdo, oferta ou ângulo nessa direção.
- Linguagem: português direto, prático, sem firula. Evite palavras genéricas: "soluções", "transformação", "potencializar", "alavancar", "destravar", "elevar a outro nível".
- Sem emojis no output corrido, a não ser quando o módulo explicitamente pede (ex: emojis em hooks de Stories ou em listas de objetivo de editoria).
- Coerência com a VOZ: depois que a voz for gerada, todos os módulos seguintes devem usar o tom/palavras definidas lá.

═══════════════════════════════════════════
QUANDO O USUÁRIO INICIAR UMA NOVA CONVERSA
═══════════════════════════════════════════

Pergunte logo na primeira resposta:

"Oi, eu sou o iAbdo 👋 Vou te guiar na construção da sua estratégia de marca.

Por onde quer começar?

1. **Fluxo completo** (recomendado pra primeira vez): Voz → ICP → Posicionamento → Território → Editorias → Ideias → 1 Conteúdo → Oferta → Pitch
2. **Direto num módulo** (se você já tem o resto): me diga qual

Pra qualquer caminho, vou te pedir os dados que precisar antes de gerar."

═══════════════════════════════════════════
QUANDO COMPLETAR UM MÓDULO
═══════════════════════════════════════════

Sempre termine com:

1. Resumo do que foi gerado (1 linha)
2. Pergunta: "Quer ajustar alguma coisa?" 
3. Sugestão do próximo módulo do fluxo

═══════════════════════════════════════════
ESTILO DE INTERAÇÃO
═══════════════════════════════════════════

- Faça UMA pergunta por vez quando estiver coletando dados (não sobrecarregue).
- Devolva resultados em formato escaneável: títulos, bullets curtos, espaço em branco.
- Quando gerar listas (5 dores, 5 ideias, etc.), numere.
- Confirme antes de gerar quando tiver dúvida ("Você falou X — confirma que é isso antes de eu gerar?").
- Se o usuário pedir algo fora dos 9 módulos, fale com ele sobre, mas tente trazer pro framework quando fizer sentido.
```

3. Salve

### 4. Testar

Antes de soltar pra turma:

1. Abra uma conversa nova dentro do Project (botão **"+ New chat"** dentro do Project)
2. Mande: `oi`
3. **Esperado:** o iAbdo se apresenta, oferece os 2 caminhos (fluxo completo / direto num módulo)
4. Teste um caminho rápido: `quero gerar minha voz da marca`
5. **Esperado:** ele pede pra você responder as 6 perguntas da Voz (não inventa as respostas, não pula etapas)

Se o teste passar — você está pronto.

---

## 📤 Como compartilhar com a turma (3 opções)

### Opção A — Cada aluno cria o próprio Project (recomendado)

Mais simples e robusto. Funciona pra qualquer plano.

**Pra aluno:** mande esse mesmo `CLAUDE-PROJECT-SETUP.md` por WhatsApp/email com os 2 arquivos de Knowledge anexados. Eles seguem o passo a passo (~10 min) e ficam com o Project deles próprios pra continuar usando depois da aula.

**Vantagens:**
- Cada aluno tem o histórico das próprias conversas
- Funciona pra qualquer plano (free incluído)
- Independente — não depende de você manter nada online

### Opção B — Você compartilha seu Project (Pro/Team only)

Se você tem plano Pro ou Team, pode compartilhar o Project diretamente:

1. Dentro do Project, clique em **"Share"** (canto superior direito)
2. Escolha **"Anyone with the link can view"** (ou similar)
3. Copia o link, manda pra turma

**Limitação:** alunos no plano free podem ver mas talvez não consigam fazer fork/copy. E todos compartilham as mesmas conversas (pode ficar bagunçado em turma grande).

### Opção C — Tela compartilhada (você dirige, aluno acompanha no papel)

Pra aulas curtas onde o foco é a metodologia, não a ferramenta:

1. Você abre o seu Project no projetor
2. Aluno preenche o Worksheet no papel (do `MANUAL-PRATICO.md`)
3. Você roda 1-2 alunos ao vivo como demo
4. Cada aluno depois cria o próprio em casa

---

## 💬 Sample de primeiras mensagens (pra mostrar pra turma)

Pra ajudar o aluno a destravar a primeira interação, sugira:

```
- "Quero começar pelo fluxo completo"
- "Quero gerar minha voz da marca, vou responder as 6 perguntas"
- "Já tenho voz e ICP, quero pular pro território"
- "Me ajuda a refinar meu posicionamento — minha frase atual é: [...]"
- "Tenho 1 ideia de conteúdo, quero gerar texto-mãe + carrossel a partir dela"
- "Quero criar uma oferta. Meu produto é: [...]"
- "Tenho um pitch escrito, gera o elevator e a carta de vendas"
```

---

## 🛠 Troubleshooting

**"O Claude não está usando o Knowledge."**
→ Verifique se os arquivos foram realmente anexados (aparecem listados em "Project knowledge"). Se sim, peça explicitamente: "Use o MANUAL-PRATICO.md no seu Knowledge pra responder."

**"O Claude está inventando coisas sobre mim."**
→ Re-cole as Custom Instructions, especialmente a seção "REGRAS DE OURO". Pode ter sido truncado no copy/paste.

**"Não vejo a opção de Projects."**
→ Você está na URL certa? Tem que ser `claude.ai`, não `console.anthropic.com` (que é a API). Atualize a página, faça logout e login.

**"Limite de Knowledge atingido."**
→ Improvável com só 2 arquivos pequenos. Se acontecer, remova um e mantenha só o `MANUAL-PRATICO.md` (já tem a metodologia condensada na seção "Conceitos rápidos" no topo).

**"O Claude está respondendo em inglês."**
→ Adicione no início da Custom Instructions: "RESPONDA SEMPRE EM PORTUGUÊS BRASILEIRO. Mesmo que o usuário escreva em outra língua, sua resposta é sempre em PT-BR."

**"As respostas estão muito longas/curtas."**
→ As Custom Instructions já incluem regra de "formato escaneável". Se precisar afinar, adicione: "Mantenha respostas em até X palavras a não ser que o usuário peça mais profundidade."

---

## 🎒 Recap da aula

Sequência sugerida pra apresentar isso aos alunos:

1. **5 min:** explica o conceito de Project + por que isso é o "Plano A" pós-aula
2. **10 min:** demo ao vivo — você roda 1 módulo (ex: Voz) com o seu Project no projetor
3. **15 min:** alunos criam o Project deles em paralelo (você ajuda quem trava)
4. **resto da aula:** eles rodam módulos com você apoiando

---

**Pronto.** Esse é o setup mais robusto pra continuidade pós-aula. O aluno sai com uma ferramenta que ele controla, que tem todo o método dentro, e que funciona em qualquer Claude.ai pelo resto da vida.
