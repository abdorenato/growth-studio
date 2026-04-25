# Manual Prático — Growth Studio (Plano B)

> **Pra quê:** rodar a metodologia do Growth Studio sem depender da plataforma.
> Cada bloco abaixo é um prompt pronto pra colar no Claude.ai (ou ChatGPT/Gemini).
> Substitua os `{{CAMPOS}}` pelos seus dados antes de colar.

---

## ⚠️ Como usar

1. **Preencha primeiro a seção "Worksheet"** abaixo (5 min num bloco de notas).
2. **Para cada módulo**, copie o bloco em código (` ``` `), substitua `{{...}}` pelos seus dados, e cole no Claude.ai.
3. **Salve a saída** em algum lugar (Notion, Google Docs, mesmo um .txt) — você vai colar pedaços dela nos prompts seguintes.
4. **Ordem importa.** Cada módulo usa as saídas dos anteriores como contexto.

> 💡 **Dica:** abra um chat novo no Claude.ai pra cada módulo — assim a IA não confunde os contextos.
> Se quiser MAIS robusto: crie um Claude Project, cole a seção "Conceitos rápidos" como Knowledge,
> e converse direto sem precisar repetir contexto.

---

## 📋 Worksheet — preencha antes de começar

Anote em qualquer lugar (papel mesmo serve). Você vai usar esses dados em **todos** os prompts.

```
NOME: ___________________________________________
ATIVIDADE (em 1 frase): _________________________
O QUE VOCÊ RESOLVE PROS CLIENTES (1-2 frases): __

— Sobre o seu cliente ideal (ICP) —
NOME INTERNO DO ICP (ex: "Consultor B2B"): ______
NICHO/SEGMENTO: _________________________________
FAIXA ETÁRIA: ___________________________________
GÊNERO PREDOMINANTE: ____________________________
LOCALIZAÇÃO: ____________________________________
```

---

## 🧠 Conceitos rápidos (cola, se for usar Claude Project)

A metodologia tem 9 módulos em 3 camadas:

- **Estratégia:** Voz da Marca → ICP → Posicionamento → Território
- **Conteúdo:** Editorias → Ideias → Monoflow (texto-mãe → 6 formatos)
- **Produto:** Oferta → Pitch (+ elevator + carta de vendas)

**Frameworks aplicados:**
- 4 arquétipos de marca: Especialista, Protetor, Próximo, Desbravador
- 5 estágios de consciência (Eugene Schwartz): inconsciente → problema → solução → produto → pronto
- Posicionamento Ries/Trout: resultado + diferencial + método
- Oferta tipo Hormozi: promessa + bônus + escassez + garantia
- Carta de vendas Halbert/Schwartz: hook → problema → reposicionamento → método → mecanismo → bônus → escassez → CTA

---

# Módulo 1 — Voz da Marca

**Objetivo:** identificar seu arquétipo primário + secundário, e gerar um mapa de voz (tom, palavras a usar/evitar).

**Antes de gerar, responda essas 6 perguntas** num bloco de texto:

1. O que te moveu a começar o que você faz hoje?
2. Qual foi o ponto de virada — quando algo te quebrou, te virou ou te fez mudar o jogo?
3. O que está em jogo hoje — o que você quer que o mundo sinta quando te ouve ou te vê?
4. Por que você quer começar (ou fortalecer) a criação de conteúdo agora?
5. Você fala mais como marca (empresa) ou como pessoa (profissional)?
6. Se pudesse escolher um personagem fictício ou pessoa pública com quem mais se identifica no estilo ou energia, quem seria?

**Prompt:**

````text
Você é um especialista em branding pessoal e análise de arquétipos de marca.

Sua tarefa é analisar minhas respostas e identificar meu ARQUÉTIPO PRIMÁRIO e SECUNDÁRIO entre os 4 arquétipos do sistema (não use outros arquétipos fora dessa lista).

OS 4 ARQUÉTIPOS:

1. ESPECIALISTA (Autoridade Intelectual)
   - Profundidade, lógica e domínio técnico
   - Energia: analítica, didática, orientada a resultado
   - Palavras-chave: método, estratégia, padrão, leitura, execução, diagnóstico

2. PROTETOR (Autoridade de Cuidado)
   - Estrutura, segurança e empatia
   - Energia: acolhedora, estruturada, orientada a cuidado
   - Palavras-chave: segurança, guia, estrutura, apoio, caminho, cuidado

3. PRÓXIMO (Autoridade de Conexão)
   - Autenticidade, vulnerabilidade e presença humana
   - Energia: humana, vulnerável, orientada a vínculo
   - Palavras-chave: verdade, humano, real, juntos, história, conexão

4. DESBRAVADOR (Autoridade de Ruptura)
   - Velocidade, coragem e impacto
   - Energia: ousada, contrária, orientada a transformação
   - Palavras-chave: ruptura, coragem, quebrar, impacto, contrário, desbravar

MINHAS RESPOSTAS:

1. O que te moveu a começar o que você faz hoje?
{{RESPOSTA_1}}

2. Qual foi o ponto de virada?
{{RESPOSTA_2}}

3. O que você quer que o mundo sinta quando te vê?
{{RESPOSTA_3}}

4. Por que quer fortalecer conteúdo agora?
{{RESPOSTA_4}}

5. Fala mais como marca ou como pessoa?
{{RESPOSTA_5}}

6. Personagem/pessoa pública com quem se identifica:
{{RESPOSTA_6}}

RESPONDA com:
- arquetipo_primario (um dos 4)
- arquetipo_secundario (um dos 4)
- justificativa (2-3 frases)
- mapa_voz:
  - energia_arquetipica (1 frase combinando os 2 arquétipos)
  - tom_de_voz (3-5 adjetivos)
  - frase_essencia (manifesto pessoal em 1ª pessoa, curta e poderosa)
  - frase_impacto (bandeira pública, direta e memorável)
  - palavras_usar (5 palavras)
  - palavras_evitar (3 palavras)
````

**Salve a saída** — você vai usar `arquetipo_primario`, `tom_de_voz`, `palavras_usar`, `palavras_evitar` nos próximos prompts.

---

# Módulo 2 — ICP (Cliente Ideal)

**Objetivo:** ter dores, desejos e objeções específicas pra alimentar todos os prompts seguintes.

````text
Você é especialista em análise de público-alvo e copywriting.

Dado o perfil de cliente abaixo, sugira dados específicos e acionáveis (não genéricos).

QUEM EU SOU:
- Atividade: {{ATIVIDADE}}
- O que resolvo: {{O_QUE_RESOLVO}}

PERFIL DO CLIENTE IDEAL:
- Nome interno: {{NOME_ICP}}
- Nicho: {{NICHO}}
- Faixa etária: {{IDADE}}
- Gênero: {{GENERO}}
- Localização: {{LOCAL}}

GERE:
1. Dores (5-7 itens) — dores reais e específicas que esse público vive. Evite genéricos como "falta de tempo".
2. Desejos (5-7 itens) — concretos, com resultado + prazo/métrica quando couber. Não abstrato "ser feliz".
3. Objeções (4-5 itens) — objeções típicas antes de comprar soluções desse nicho.
4. Estilo de linguagem (1-2 frases) — como esse público gosta de receber conteúdo (formal/informal, dados/histórias, educativo/provocativo).
5. Palavras-chave de tom (4-6 palavras).

REGRAS:
- 1 frase curta cada
- Use a linguagem do nicho (não jargão de copywriting)
- Específico, não "conteúdo envolvente"

Responda em formato lista limpa.
````

**Salve a saída.** Vai virar a "régua" dos próximos módulos.

---

# Módulo 3 — Território

**Objetivo:** definir o universo simbólico que você domina. São **5 sub-passos.**

## 3.1 Domínio (descritivo técnico)

````text
Você é especialista em estratégia de marca.

Sugira 3 opções de DOMÍNIO TEMÁTICO (descritivo, técnico) que eu posso dominar.

REGRAS DE UM BOM DOMÍNIO:
- 2-5 palavras
- Descritivo, técnico — descreve o nicho/segmento de atuação
- Amplo o bastante pra ter o que dizer por anos
- Estreito o bastante pra virar autoridade
- Coerente com a atividade real do criador

Exemplos bons: "Vendas Consultivas B2B" | "Branding Pessoal pra Profissionais Técnicos" | "Finanças Pessoais pra Casais"
Exemplos ruins: "Sucesso" (genérico demais) | "Anúncios de FB pra lojas no Paraná" (nicho demais)

QUEM EU SOU:
- Atividade: {{ATIVIDADE}}
- O que resolvo: {{O_QUE_RESOLVO}}

ICP:
{{COLE_AQUI_RESUMO_DO_ICP_DO_MÓDULO_2}}

VOZ:
- Arquétipos: {{ARQ_PRIMÁRIO}} + {{ARQ_SECUNDÁRIO}}
- Tom: {{TOM_DE_VOZ}}

Devolva 3 opções com "domínio" + "por que".
````

→ **Escolha 1 domínio.** Anote.

## 3.2 Lente (como você enxerga o domínio)

Escolha UMA das 5 lentes — define o "ângulo" do território:

| Lente | Quando usar |
|---|---|
| 🧠 **Analítica** | Dados, método, padrão, diagnóstico. Lê a realidade antes de agir. |
| ❤️ **Humana** | História, empatia, vulnerabilidade. Conecta pelo que é real. |
| ⚡ **Provocadora** | Contra o status quo, rupturas. Desafia o óbvio. |
| 🎯 **Prática** | Execução, mão na massa, resultado concreto. Sem firula. |
| 🔮 **Visionária** | Princípios, visão de mundo amplo. Pensa grande antes do tático. |

→ **Anote a lente escolhida.**

## 3.3 Âncora Mental (1-3 palavras emocional)

````text
Você é especialista em branding e naming estratégico.

Sugira 5 opções de ÂNCORA MENTAL pro território abaixo.

O QUE É UMA ÂNCORA MENTAL:
- 1 a 3 palavras
- Emocional, intrigante OU provocativa
- NÃO descreve o que a marca faz — comunica o ESPAÇO MENTAL que ela quer dominar
- Compreendida em até 3 segundos
- Funciona como bandeira, vira frase de bio, abre conversa

DOMÍNIO TÉCNICO: {{DOMÍNIO}}
LENTE: {{LENTE_ESCOLHIDA}}

EXEMPLOS DE TRANSFORMAÇÃO:
- Domínio "Vendas Consultivas" → Âncora "Vender é leitura"
- Domínio "Marketing pra Arquitetos" → Âncora "A arte de cobrar"
- Domínio "Finanças pra Casais" → Âncora "Casal sem segredo"
- Domínio "Personal pra Mulheres 40+" → Âncora "Corpo é casa"
- Domínio "Branding Pessoal" → Âncora "Marca é verbo"

REGRAS RÍGIDAS:
- Máximo 4 palavras
- Sem termos técnicos do nicho
- Sem palavras óbvias do domínio
- Use verbos, metáforas, oposições, paradoxos

ICP: {{COLE_RESUMO_ICP}}
VOZ — Tom: {{TOM_DE_VOZ}}

Devolva 5 opções: "âncora" + "por que" (efeito mental).
````

→ **Escolha 1 âncora.** Anote.

## 3.4 Manifesto (Tese + Expansão)

````text
Você é especialista em estratégia de marca.

Gere 3 opções de MANIFESTO completo (TESE + EXPANSÃO) pro território abaixo.

ESTRUTURA:
- TESE (1 frase, máx 12 palavras): direta, forte, idealmente CONTRAINTUITIVA. É a bandeira pública.
- EXPANSÃO (1-2 frases): explica a tese, conecta com problema real, sem jargões.

DOMÍNIO: {{DOMÍNIO}}
ÂNCORA MENTAL: "{{ÂNCORA}}"
LENTE: {{LENTE}}

REGRAS:
- A tese deve soar como a lente escolhida (analítica/humana/provocadora/prática/visionária)
- Expansão amplia a tese sem repetir as mesmas palavras
- Zero motivacional vazio ("seja a melhor versão de você")

EXEMPLOS DE BOA TESE + EXPANSÃO:
- Tese: "Vender não é sorte. É leitura."
  Expansão: "Quem fecha consistentemente lê padrões antes de pitch. O resto improvisa e perde."
- Tese: "Não existe vendedor nato."
  Expansão: "Existe vendedor com método. Talento sem sistema é loteria. Sistema sem talento ainda fecha."

ICP: {{COLE_RESUMO_ICP}}
VOZ: tom {{TOM_DE_VOZ}}, palavras a usar: {{PALAVRAS_USAR}}

Devolva 3 opções: "tese" + "expansao" + "por_que".
````

→ **Escolha 1 tese + expansão.** Anote.

## 3.5 Fronteiras (negativas + positivas)

````text
Você é especialista em posicionamento estratégico.

Sugira FRONTEIRAS pro território abaixo, em DUAS LISTAS PARALELAS:

🚫 FRONTEIRAS NEGATIVAS (4 itens) — o que NÃO faço/recuso
✅ FRONTEIRAS POSITIVAS (4 itens) — o que FAÇO/defendo

REGRAS:
- Frases curtas (3-7 palavras cada)
- Escaneáveis
- PARALELAS: cada negativa idealmente tem uma positiva correspondente
- Específicas do mercado, não genéricas

EXEMPLOS BONS:
🚫 Prospecção em massa  ↔  ✅ Diagnóstico antes de pitch
🚫 Gatilhos mentais  ↔  ✅ Conversa franca
🚫 Scripts decorados  ↔  ✅ Reunião improvisada com método

DOMÍNIO: {{DOMÍNIO}}
ÂNCORA: "{{ÂNCORA}}"
TESE: "{{TESE}}"
LENTE: {{LENTE}}

ICP: {{COLE_RESUMO_ICP}}

Devolva 2 listas: negativas (4 itens) + positivas (4 itens).
````

## 3.6 Áreas de Atuação (onde vira negócio)

````text
Você é estrategista de negócio.

Sugira 5 ÁREAS DE ATUAÇÃO concretas pro território abaixo.

O QUE SÃO ÁREAS DE ATUAÇÃO:
- Onde o território vira NEGÓCIO REAL
- Aplicações práticas: processos, sistemas, abordagens, serviços, frameworks
- NÃO são temas de conteúdo, NÃO são editorias
- SÃO o que o criador entrega/cobra

EXEMPLOS — Território "Vender é leitura":
- Diagnóstico de Maturidade de Compra
- Treinamento de Discovery em 3 Camadas
- Auditoria de CRM e Pipeline
- Mentoria de Vendas Consultivas
- Implementação de Framework de Proposta

REGRAS:
- 2-6 palavras por item
- Cada item é uma OFERTA POTENCIAL
- Coerente com a atividade do criador
- Específico (não "consultoria geral")

DOMÍNIO: {{DOMÍNIO}}
ÂNCORA: "{{ÂNCORA}}"
TESE: "{{TESE}}"

QUEM EU SOU:
- Atividade: {{ATIVIDADE}}

Devolva 5 áreas.
````

**Anote o pacote de TERRITÓRIO completo:** domínio, lente, âncora, tese, expansão, fronteiras (negativas + positivas), áreas de atuação. Vai pra todos os módulos seguintes.

---

# Módulo 4 — Posicionamento

**Objetivo:** uma declaração curta, forte, repetível em voz alta.

## 4.1 Resultado que entrega

````text
Você é especialista em posicionamento e copywriting.

Sugira 5 opções de RESULTADO que eu posso entregar pro ICP abaixo.

REGRAS:
- Cada resultado: máx 15 palavras
- Linguagem direta: verbo no infinitivo + métrica/situação concreta
- Use os desejos e dores do ICP como base
- Específicos, não genéricos
- Coerentes com a minha atividade

Exemplos bons: "dobrar o faturamento em 12 meses sem virar infoprodutor"
Exemplos ruins: "ajudar a ter mais sucesso"

ATIVIDADE: {{ATIVIDADE}}

ICP: {{COLE_RESUMO_ICP}}

Devolva 5 opções de "resultado" + "por que".
````

→ **Escolha 1 resultado.** Anote.

## 4.2 Diferencial (escolha 1 das 3 categorias)

| Categoria | O que é |
|---|---|
| 🔧 **Método/Sistema** | O COMO técnico que só você faz |
| 💭 **Filosofia/Crença** | Uma visão contrária ao mercado |
| 📖 **Origem/História** | Uma credencial pessoal única |

````text
Você é especialista em posicionamento estratégico.

Sugira 3 opções de DIFERENCIAL pra mim, no formato "e me diferencio porque {DIFERENCIAL}".

CATEGORIA ESCOLHIDA: {{CATEGORIA}} ({{método|filosofia|origem}})

ATIVIDADE: {{ATIVIDADE}}
ICP NICHO: {{NICHO}}
VOZ — Tom: {{TOM_DE_VOZ}}

Exemplos do estilo certo (categoria método):
- "Uso 3 camadas de diagnóstico que ninguém faz"
- "Vendo pela lente de dados, não de intuição"

REGRAS:
- Máximo 20 palavras cada
- Específico, não genérico
- Use as palavras da minha voz quando couber
- Soa natural no final da frase "...e me diferencio porque {frase}"

Devolva 3 opções: "diferencial" + "por que".
````

→ **Escolha 1 diferencial.** Anote.

## 4.3 Método/Mecanismo (opcional, se você tem um)

Se você TEM um método nomeado próprio, descreva ele em 2-3 frases. Se não tem, pula esse passo (e na declaração final, deixa em branco — nunca invente método).

````text
Você é especialista em naming de métodos.

Dado o método descrito abaixo, sugira 3 NOMES fortes, curtos e memoráveis.

REGRAS:
- Máximo 3 palavras
- Evoque a essência do método
- Evite clichês ("método infalível", "sistema X")
- Pode usar sigla/acrônimo se fizer sentido
- Use o tom da minha voz: {{TOM_DE_VOZ}}

ICP NICHO: {{NICHO}}

DESCRIÇÃO DO MÉTODO:
{{DESCREVA_O_MÉTODO_EM_2_OU_3_FRASES}}

Devolva 3 nomes + "por que".
````

→ **Escolha 1 nome.** Anote (ou deixe vazio).

## 4.4 Declaração de posicionamento (final)

````text
Você é especialista em copywriting de posicionamento.

Gere uma DECLARAÇÃO DE POSICIONAMENTO clara, curta e forte.

REGRAS OBRIGATÓRIAS:
- Frase com no máximo 2 linhas
- Deve conter, de forma natural:
  • Quem eu ajudo (ICP claro)
  • Qual problema resolvo (dor específica)
  • Qual resultado gero (transformação concreta ou mensurável)
- Linguagem simples, direta, sem jargões
- NÃO usar frases longas com múltiplos "e" encadeados
- NÃO misturar método, história pessoal ou diferencial na frase principal
  (esses elementos vão SEPARADOS, na frase de apoio)
- EVITAR palavras genéricas: "soluções", "transformação", "potencializar", "alavancar", "destravar"
- Deve soar fácil de repetir em voz alta — em palestra, no elevador, em DM

EXEMPLOS BONS:
- "Ajudo consultores B2B a fechar 3x mais reuniões qualificadas em 90 dias."
- "Ensino mulheres 40+ a recuperar a força sem academia lotada."

EXEMPLO RUIM:
- "Ajudo profissionais a alcançar transformação e potencializar seu negócio através de soluções estratégicas e meu método único de 7 etapas e atendimento personalizado." (longa, genérica, mistura tudo)

QUEM EU SOU: {{ATIVIDADE}}

ICP: {{COLE_RESUMO_ICP}}

RESULTADO QUE ENTREGO: {{RESULTADO_DO_4.1}}

MÉTODO/MECANISMO (NÃO usar na declaração principal — só na frase de apoio):
- Nome: {{NOME_DO_MÉTODO_OU_VAZIO}}
- Descrição: {{DESCRIÇÃO_OU_VAZIO}}

DIFERENCIAL (NÃO usar na declaração principal — só na frase de apoio):
{{DIFERENCIAL_DO_4.2}}

Devolva:
- 1 declaração principal
- 2 variações alternativas (mesmas regras, formulações diferentes)
- 1 frase de apoio (carrega diferencial/método/autoridade — usada DEPOIS da declaração principal)
````

**Anote o POSICIONAMENTO completo:** principal + 2 variações + frase de apoio + (resultado, mecanismo, diferencial).

---

# Módulo 5 — Editorias (5 pilares de conteúdo)

**Objetivo:** os 5 pilares recorrentes que sustentam todo o calendário.

Cada editoria cobre 1 dos 5 objetivos:

| Objetivo | Função |
|---|---|
| 🎓 **Autoridade** | Ensinar, provar domínio técnico |
| ❤️ **Conectar** | Humanizar, mostrar bastidores |
| ⚡ **Provocar** | Quebrar crença, virar discussão |
| 🏆 **Prova** | Cases, resultados, depoimentos |
| 💰 **Converter** | Apresentar oferta, CTA direto |

````text
Você é estrategista editorial de marca pessoal.

Gere 5 EDITORIAS (pilares de conteúdo recorrentes). Cada uma cobre um dos 5 objetivos estratégicos:

1. autoridade (Autoridade): Ensinar, provar domínio técnico. Gera confiança. Exemplos: Diagnóstico, Método, Fundamentos, Framework
2. conectar (Conectar): Humanizar, mostrar bastidores, história. Aproxima. Exemplos: Bastidores, Diário, Jornada, Histórias reais
3. provocar (Provocar): Quebrar crença, virar discussão. Engaja. Exemplos: Verdades Duras, Contra-mão, Mitos, Polêmico
4. prova (Prova): Cases, resultados, depoimentos. Vende sem vender. Exemplos: Cases Reais, Transformações, Antes/Depois, Clientes
5. converter (Converter): Apresentar oferta, CTA direto. Fecha o ciclo. Exemplos: Trabalho Comigo, Vaga Aberta, Oferta, Convite

REGRAS:
- Exatamente 5 editorias, 1 de cada tipo
- Cada editoria tem: nome (2-4 palavras, identitário, puxa do território), tipo_objetivo, objetivo (1 frase do que faz estrategicamente), descricao (1-2 frases sobre o QUE cobre)
- Nomes específicos do território, NÃO genéricos
- Respeite as fronteiras (não proponha editoria que fala do que recuso)
- A editoria "Converter" deve ser CHAMADA — não "Vendas" (muito cru)

QUEM EU SOU: {{ATIVIDADE}}

ICP: {{COLE_RESUMO_ICP}}

VOZ:
- Energia: {{ENERGIA_ARQUETIPICA}}
- Tom: {{TOM_DE_VOZ}}

POSICIONAMENTO: "{{DECLARAÇÃO_PRINCIPAL}}"

TERRITÓRIO:
- Domínio: {{DOMÍNIO}}
- Lente: {{LENTE}}
- Tese: "{{TESE}}"
- Fronteiras (NÃO falo sobre): {{FRONTEIRAS_NEGATIVAS}}

Devolva as 5 editorias na ordem: autoridade, conectar, provocar, prova, converter.
````

**Anote as 5 editorias.**

---

# Módulo 6 — Ideias (de carrossel/conteúdo)

**Objetivo:** transformar 1 editoria em 5 ideias prontas pra produzir, cada uma calibrada pra um estágio de consciência.

**5 estágios (Eugene Schwartz):**

| Estágio | Quem | Tom |
|---|---|---|
| 🌫️ **Inconsciente** | Não sabe que tem o problema | Provoca, abre os olhos |
| ⚠️ **Problema** | Sente a dor mas acha que é normal | Educa sobre a causa, valida |
| 🔍 **Solução** | Busca soluções, não te conhece | Compara abordagens |
| 📋 **Produto** | Conhece você, não decidiu | Diferencia, ataca objeções |
| 🛒 **Pronto** | Só falta gatilho | Urgência, escassez, CTA direto |

````text
Você é estrategista de conteúdo para Instagram especializado em carrosséis virais.

Gere 5 IDEIAS de carrosséis DENTRO DA EDITORIA abaixo. Todas as ideias precisam:
- Pertencer ao objetivo estratégico da editoria (não misturar)
- Usar o território como pano de fundo
- Respeitar as fronteiras
- Ter gancho forte (curiosidade, urgência, contraintuição)
- Ser acionáveis — não conceituais demais

ESTÁGIO DE CONSCIÊNCIA: cada ideia mira UM estágio dominante:
- "inconsciente": pessoa não sabe que tem o problema. Hook provocativo.
- "problema": sente a dor mas não busca solução. Hook valida e explora.
- "solucao": busca soluções, não te conhece. Hook compara abordagens.
- "produto": conhece você, não decidiu. Hook diferencia/prova.
- "pronto": só falta gatilho. Hook tem urgência/escassez.

DISTRIBUIÇÃO RECOMENDADA:
- Editorias de "Provocar" tendem a "inconsciente/problema"
- Editorias de "Converter" tendem a "produto/pronto"
- Maioria nos estágios do meio (problema/solucao/produto)

EDITORIA (essa é a âncora — todas as ideias devem pertencer a ela):
- Nome: {{NOME_EDITORIA}}
- Objetivo estratégico: {{OBJETIVO_EDITORIA}}
- O que cobre: {{DESCRICAO_EDITORIA}}
- Tipo: {{TIPO_OBJETIVO}}

QUEM EU SOU: {{ATIVIDADE}}

ICP: {{COLE_RESUMO_ICP}}

VOZ: tom {{TOM_DE_VOZ}}, energia {{ENERGIA_ARQUETIPICA}}

TERRITÓRIO:
- Tese: "{{TESE}}"
- Fronteiras (NUNCA fale sobre): {{FRONTEIRAS_NEGATIVAS}}

Devolva 5 ideias, cada uma com:
- topic (tema específico do carrossel)
- hook (frase do slide 1, curiosidade/urgência)
- angle (ângulo/abordagem)
- target_emotion (emoção principal)
- target_stage (inconsciente|problema|solucao|produto|pronto)
- carousel_style (educational|storytelling|listicle|myth_busting|before_after)
````

→ **Escolha 1 ideia** pra desenvolver no Monoflow.

---

# Módulo 7 — Monoflow (1 ideia → 6 formatos)

**Objetivo:** pegar 1 ideia e gerar texto-mãe + Reels + Post + Carrossel + Stories + LinkedIn + TikTok.

**Fluxo:** primeiro gera o **texto-mãe** (150-200 palavras). Depois usa esse texto como base pra cada formato.

## 7.1 Texto-mãe (gera primeiro)

````text
Você é um estrategista de conteúdo.

Gere um TEXTO-MÃE curto (150-200 palavras) que será a BASE pra gerar depois Reels, Post, Carrossel, Stories, LinkedIn e TikTok.

REGRAS:
- Texto claro, direto, persuasivo
- Use a voz: tom {{TOM_DE_VOZ}}, palavras a usar: {{PALAVRAS_USAR}}, palavras a evitar: {{PALAVRAS_EVITAR}}
- Respeite as fronteiras (NUNCA toque em assuntos proibidos): {{FRONTEIRAS_NEGATIVAS}}
- Sirva ao objetivo da editoria: {{TIPO_OBJETIVO}} ({{OBJETIVO_EDITORIA}})
- Sem títulos ou markdown, só prosa corrida
- Comece pelo hook

TEMA: {{TOPIC_DA_IDEIA}}
HOOK: {{HOOK_DA_IDEIA}}
ÂNGULO: {{ANGLE_DA_IDEIA}}
ESTÁGIO DE CONSCIÊNCIA DA AUDIÊNCIA: {{TARGET_STAGE}} (calibre a peça inteira pra esse estágio)

CONTEXTO COMPLETO:
- Atividade: {{ATIVIDADE}}
- Posicionamento: "{{DECLARAÇÃO_PRINCIPAL}}"
- Território — Tese: "{{TESE}}", Âncora: "{{ÂNCORA}}"
- Editoria: {{NOME_EDITORIA}} (objetivo: {{TIPO_OBJETIVO}})
- ICP — Dores principais: {{TOP_3_DORES}}; Desejos: {{TOP_3_DESEJOS}}

Responda APENAS com o texto-mãe (sem JSON, sem formatação).
````

→ **Salve o texto-mãe.** Vai virar base de todos os formatos.

## 7.2 Carrossel (5 slides)

````text
Você é copywriter de carrosséis virais.

CONTEXTO ESTRATÉGICO:
- Voz: tom {{TOM_DE_VOZ}}, palavras a usar {{PALAVRAS_USAR}}
- Posicionamento: "{{DECLARAÇÃO_PRINCIPAL}}"
- Tese do território: "{{TESE}}"
- Fronteiras (não tocar): {{FRONTEIRAS_NEGATIVAS}}
- Estágio da audiência: {{TARGET_STAGE}}

TEXTO-MÃE:
{{COLE_O_TEXTO_MÃE}}

REGRAS DE CARROSSEL:
- GERE EXATAMENTE 5 SLIDES (nem mais, nem menos)
- Slide 1: Hook (curiosidade/urgência, NUNCA revele a resposta)
- Slides do meio: 1 conceito por slide, frases curtas
- Último slide: CTA claro
- Máximo 40 palavras por slide

Devolva:
- 5 slides com (índice, tipo: hook|content|listicle|quote|cta, headline, body)
- caption (legenda do post)
- 5 hashtags
- 3 keywords em INGLÊS pra buscar imagem (Unsplash/Freepik)
````

## 7.3 Reels

````text
Você é roteirista de Reels virais.

CONTEXTO ESTRATÉGICO:
- Voz: tom {{TOM_DE_VOZ}}
- Tese: "{{TESE}}"
- Fronteiras: {{FRONTEIRAS_NEGATIVAS}}
- Estágio: {{TARGET_STAGE}}

TEXTO-MÃE:
{{COLE_O_TEXTO_MÃE}}

REGRAS:
- Hook em até 3 segundos
- Cenas curtas (3-6)
- Texto na tela sempre
- Duração 30s/60s/90s

Devolva:
- title, duration, hook (frase dos primeiros 3s)
- scenes (lista com tempo, action, text_overlay)
- cta, caption (com emojis), audio_suggestion, trend_tip
````

## 7.4 Post (feed Instagram)

````text
Você é copywriter de posts de Instagram de alta conversão.

CONTEXTO:
- Voz: tom {{TOM_DE_VOZ}}
- Editoria/CTA: {{TIPO_OBJETIVO}}
- Fronteiras: {{FRONTEIRAS_NEGATIVAS}}
- Estágio: {{TARGET_STAGE}}

TEXTO-MÃE:
{{COLE_O_TEXTO_MÃE}}

REGRAS:
- Primeira linha: hook irresistível (aparece no feed)
- Máximo 2200 caracteres
- Quebras de linha pra legibilidade
- CTA coerente com a editoria

Devolva:
- caption (legenda completa)
- hashtags (5)
- best_time (melhor horário)
- image_suggestion (descrição da imagem ideal)
- image_keywords (3 em inglês)
- headline_on_image (frase curta pra sobrepor, máx 8 palavras)
````

## 7.5 Stories (sequência de 4)

````text
Você é especialista em sequências de Stories.

CONTEXTO:
- Voz: tom {{TOM_DE_VOZ}}
- Fronteiras: {{FRONTEIRAS_NEGATIVAS}}
- Estágio: {{TARGET_STAGE}}

TEXTO-MÃE:
{{COLE_O_TEXTO_MÃE}}

Crie sequência de EXATAMENTE 4 stories (nem mais, nem menos) combinando perguntas e enquetes.

Devolva:
- strategy (estratégia geral)
- stories (4 itens, cada um com: order, type [texto|pergunta|enquete], text, sticker {type, question, options}, visual_tip)
````

## 7.6 LinkedIn

````text
Você é copywriter de LinkedIn.

CONTEXTO:
- Voz: tom {{TOM_DE_VOZ}}
- Editoria: {{TIPO_OBJETIVO}}
- Fronteiras: {{FRONTEIRAS_NEGATIVAS}}
- Estágio: {{TARGET_STAGE}}

TEXTO-MÃE:
{{COLE_O_TEXTO_MÃE}}

REGRAS:
- Primeira linha: hook no feed do LinkedIn
- Tom profissional mas humano
- Quebras de linha pra legibilidade
- Storytelling quando couber
- CTA coerente com a editoria

Devolva: post (texto completo) + 5 hashtags
````

## 7.7 TikTok

````text
Você é roteirista de TikTok com foco em retenção nos 3 primeiros segundos.

CONTEXTO:
- Voz: tom {{TOM_DE_VOZ}}
- Fronteiras: {{FRONTEIRAS_NEGATIVAS}}
- Estágio: {{TARGET_STAGE}}

TEXTO-MÃE:
{{COLE_O_TEXTO_MÃE}}

REGRAS:
- Duração 15-60s
- Hook em até 2 segundos
- Cortes rápidos
- Linguagem TikTok (gírias, urgência, curiosidade)

Devolva:
- title, duration, hook (frase dos primeiros 2s)
- scenes (tempo, action, text_overlay)
- cta, caption, sound_suggestion, tiktok_tips
````

---

# Módulo 8 — Oferta

**Objetivo:** uma oferta irresistível com promessa, bônus, escassez, garantia.

````text
Você é especialista em construção de ofertas irresistíveis para Instagram e digital.

REGRAS GERAIS (NÃO QUEBRE):
1. NUNCA invente fatos sobre mim (carreira, anos de experiência, clientes, número de alunos). Use só o que está no contexto.
2. NUNCA invente nome de método. Se eu já tenho um (no posicionamento), use EXATAMENTE esse. Se não tenho, deixe method_name como string vazia.
3. A oferta deve estar alinhada com meu POSICIONAMENTO e TERRITÓRIO (mesma promessa, mesma lente, mesmas fronteiras).
4. A linguagem deve seguir minha VOZ DA MARCA.
5. Se faltar informação concreta, prefira deixar curto e verdadeiro do que inventar.

CONTEXTO ESTRATÉGICO:
- Atividade: {{ATIVIDADE}}
- O que resolvo: {{O_QUE_RESOLVO}}

ICP: {{COLE_RESUMO_ICP}}

VOZ:
- Energia: {{ENERGIA_ARQUETIPICA}}
- Tom: {{TOM_DE_VOZ}}
- Palavras a usar: {{PALAVRAS_USAR}}
- Palavras a evitar: {{PALAVRAS_EVITAR}}

POSICIONAMENTO: "{{DECLARAÇÃO_PRINCIPAL}}"
- Resultado que entrego: {{RESULTADO}}
- Método (se tem): {{NOME_DO_MÉTODO_OU_VAZIO}} — {{DESCRIÇÃO_OU_VAZIO}}
- Diferencial: {{DIFERENCIAL}}

TERRITÓRIO:
- Domínio: {{DOMÍNIO}}
- Tese: "{{TESE}}"
- Fronteiras negativas: {{FRONTEIRAS_NEGATIVAS}}

PRODUTO/SERVIÇO QUE QUERO VENDER: {{PRODUTO}}
DIFERENCIAL DESSE PRODUTO: {{DIFERENCIAL_DO_PRODUTO}}
FAIXA DE PREÇO: {{FAIXA_PREÇO}}

COMPONENTES DA OFERTA (todos obrigatórios):
- name: nome interno da oferta (curto)
- core_promise: o que entrego (promessa principal, resultado concreto, alinhada ao posicionamento)
- dream: o sonho do cliente (qual resultado ele quer)
- success_proofs: 3-5 provas (apenas se forem genéricas tipo "metodologia testada"; NÃO invente números, depoimentos ou clientes)
- time_to_result: em quanto tempo o cliente vê resultado
- effort_level: o que o cliente precisa fazer / sacrificar
- bonuses: 3-5 bônus que atacam objeções específicas do ICP
- scarcity: escassez e urgência genuína (vagas, prazo, disponibilidade)
- guarantee: garantia que reverte o risco
- method_name: USE EXATAMENTE o método do posicionamento, OU deixe vazio se não existir
- summary: resumo em 3 bullets da oferta completa

Devolva tudo em formato lista limpa.
````

**Anote a oferta completa.**

---

# Módulo 9 — Pitch (5 perguntas + texto vendedor)

**Objetivo:** discurso de venda baseado na oferta, respondendo 5 perguntas-chave.

## 9.1 Pitch principal

````text
Você é copywriter especialista em pitches de vendas para redes sociais.

REGRAS GERAIS (NÃO QUEBRE):
1. NUNCA invente fatos sobre mim (carreira, anos de experiência, número de clientes/alunos, certificações, prêmios, depoimentos).
2. NUNCA invente nome de método. Se a oferta tem method_name vazio, fale do método de forma genérica ou não cite — não nomeie nada.
3. A autoridade do pitch sai do TERRITÓRIO + POSICIONAMENTO + tese. Se eu não defini credenciais lá, não invente.
4. A linguagem deve seguir minha VOZ DA MARCA.
5. O pitch deve estar coerente com a tese e fronteiras do TERRITÓRIO.

CONTEXTO ESTRATÉGICO:
{{COLE_O_BLOCO_DO_PROMPT_DE_OFERTA_ATÉ_OS_DADOS_DO_PRODUTO}}

OFERTA QUE ESTAMOS VENDENDO:
{{COLE_A_OFERTA_COMPLETA_DO_MÓDULO_8}}

AS 5 PERGUNTAS:
1. Por que a pessoa tem que comprar de você? (autoridade + diferencial — tira da TESE/POSICIONAMENTO; nada de credencial inventada)
2. Por que comprar agora? (urgência, contexto do momento — sem deadline fake)
3. Por que vai se ferrar se não comprar agora? (dor da inação — usa as DORES do ICP)
4. Por que você é a pessoa indicada para vender isso? (use ÂNCORA MENTAL + LENTE + TESE; NÃO invente história)
5. Por que está entregando mais com um valor menor? (justificativa de preço com base nos bônus reais da oferta)

Devolva:
- answers: 5 itens (question + answer)
- pitch: texto completo (3-5 parágrafos) compilando as 5 respostas num discurso vendedor fluido, coerente com a voz e o território
````

→ **Edite as respostas** se quiser refinar. Depois rode o próximo prompt pra gerar o pitch final refinado:

## 9.2 Pitch final (com suas edições)

````text
Você é copywriter especialista. Dadas as respostas refinadas abaixo, gere o pitch final vendedor.

CONTEXTO ESTRATÉGICO:
{{COLE_NOVAMENTE_O_BLOCO_DE_CONTEXTO_DO_9.1}}

OFERTA:
{{COLE_A_OFERTA}}

RESPOSTAS REFINADAS (fonte da verdade — não contradiga):
1. {{PERGUNTA_1}}
{{RESPOSTA_REFINADA_1}}

2. {{PERGUNTA_2}}
{{RESPOSTA_REFINADA_2}}

(... e assim por diante até 5)

Gere APENAS o texto final do pitch (3-5 parágrafos, fluido, persuasivo, na MINHA voz, sem JSON, sem markdown). Comece direto pelo hook.
````

## 9.3 Elevator pitch (~30s)

````text
Você é copywriter especialista em comunicação de alto impacto.

Comprima o pitch completo abaixo num ELEVATOR PITCH — texto curto pra falar em voz alta em 30 segundos (70-100 palavras).

CONTEXTO ESTRATÉGICO:
{{COLE_BLOCO_DE_CONTEXTO}}

OFERTA:
{{COLE_OFERTA}}

PITCH COMPLETO (fonte da verdade — o elevator é uma compressão dele, não algo novo):
{{COLE_PITCH_FINAL}}

REGRAS:
- NÃO invente nada que não esteja no pitch acima ou no contexto.
- NÃO seja genérico ("ajudo pessoas a alcançarem seus objetivos"). Seja específico ao território.
- Peso máximo na ÂNCORA MENTAL e na TESE — é o que cola na cabeça.

ESTRUTURA DO ELEVATOR (siga essa ordem mental, não use labels):
1. Quem eu sou (1 frase, ancorada no posicionamento)
2. O que resolvo / pra quem (1 frase, ancorada na dor do ICP)
3. O que me torna diferente (1 frase, ancorada na tese/lente do território)
4. Convite pra próximo passo (1 frase, leve — não vendedor agressivo)

LIMITES:
- 70 a 100 palavras. NÃO ultrapasse.
- Texto corrido (sem bullets, sem markdown, sem emojis).
- Comece direto, sem "Olá, eu sou..." (parece script).
- Termine com um convite/abertura — não com call-to-action de venda.

Responda APENAS com o texto do elevator pitch.
````

## 9.4 Carta de vendas (long form, base pra email longo ou VSL)

````text
Você é copywriter direct response especialista em cartas de vendas longas (estilo Gary Halbert / Eugene Schwartz aplicado ao digital).

Expanda o pitch abaixo numa CARTA DE VENDAS longa, base pra:
- Email longo de vendas
- Roteiro de VSL (Video Sales Letter)
- Página de vendas long-form

CONTEXTO ESTRATÉGICO:
{{COLE_BLOCO_DE_CONTEXTO}}

OFERTA:
{{COLE_OFERTA}}

PITCH BASE (a carta deve manter EXATAMENTE a mesma promessa, ângulo e voz — só expande):
{{COLE_PITCH_FINAL}}

REGRAS:
- NÃO invente história pessoal, métricas, depoimentos, números de alunos/clientes, certificações ou prêmios. Use só o que está no contexto.
- Se faltar prova concreta, prefira mecanismo lógico (ex: "porque quando você faz X, Y acontece") em vez de inventar prova social.
- Coerente com a TESE e ÂNCORA MENTAL — a carta é a versão expandida do mesmo argumento.

ESTRUTURA OBRIGATÓRIA (use os blocos abaixo, sem cabeçalhos visíveis — texto fluido):

1. HOOK / Lead (1-2 parágrafos): abre com a dor do ICP ou um insight contraintuitivo da tese. Faz o leitor pensar "isso é comigo".
2. Problema amplificado (2-3 parágrafos): mostra que o leitor já tentou as soluções óbvias e por que não funcionaram. Usa as DORES e OBJEÇÕES do ICP.
3. Reposicionamento (1-2 parágrafos): apresenta a NOVA forma de ver o problema (a tese do território). É o "aha moment".
4. Apresentação do método/oferta (2-3 parágrafos): usa o nome do método EXATAMENTE como está em method_name (se vazio, fala do método sem nomear). Conecta com o core_promise.
5. Mecanismo / por que funciona (2 parágrafos): explica logicamente — peso na lógica, não em prova social inventada.
6. Bônus + Garantia (1-2 parágrafos): lista os bônus reais + garantia. Reverte risco.
7. Escassez / urgência (1 parágrafo): usa a escassez real da oferta (vagas, prazo). Sem deadline fake.
8. Fechamento + CTA (1-2 parágrafos): resume a transformação. Convida pra próxima ação.

LIMITES:
- 800 a 1500 palavras (suficiente pra VSL de 8-12 minutos).
- Texto corrido em parágrafos. Pode usar quebras de linha entre blocos pra respiração.
- SEM markdown, SEM bullets visíveis, SEM cabeçalhos numerados.
- Linguagem na VOZ DA MARCA.
- Tom de carta pessoal — escrita pra UMA pessoa do ICP, não pra "vocês".

Responda APENAS com o texto da carta de vendas.
````

---

# 🎒 Apêndice — sequência ideal numa aula prática

Se você só tem 90 min com a turma:

| Tempo | Módulo | O que fazer |
|---|---|---|
| 10 min | Worksheet | Aluno preenche os campos básicos no papel |
| 10 min | Voz | Aluno responde 6 perguntas, cola no Claude → arquétipo + mapa de voz |
| 10 min | ICP | Cola o prompt → recebe dores/desejos/objeções |
| 15 min | Território | Roda os 6 sub-prompts em sequência (domínio → âncora → tese → fronteiras → áreas) |
| 10 min | Posicionamento | Resultado + diferencial + declaração final |
| 10 min | Editorias | 5 pilares prontos |
| 15 min | 1 conteúdo | 1 ideia → texto-mãe → 1 formato (carrossel ou reels) |
| 10 min | Pitch curto | Pula direto pro elevator pitch (sem oferta detalhada) |

**Variação rápida pra "pitch sem ter feito tudo":** se faltar tempo de fazer Oferta + Pitch completos, pula direto pro elevator pitch usando como base o **Posicionamento + Território**. O resultado é mais fraco, mas é apresentável.

---

# 🛟 Recurso de fallback — Claude Project

Se quiser eliminar o atrito de copiar/colar contexto a cada prompt:

1. Vá em [claude.ai](https://claude.ai) e crie um **Project**.
2. Em **"Project Knowledge"**, cole esse manual inteiro + o `CONCEITOS.md` (se tiver).
3. Em **"Custom Instructions"**, cole:
   > "Você é meu estrategista de marca. Use a metodologia do Growth Studio (no Knowledge). Quando eu pedir um módulo, identifique qual é, peça os dados que faltam, e gere a saída no formato definido. Nunca invente fatos sobre mim."
4. Inicie uma conversa normal: "Quero gerar minha voz da marca."

A IA já sabe a metodologia — você só conversa.

---

**Pronto.** Esse manual roda sem app, sem internet (se você baixar o Claude Desktop), sem Supabase, sem Vercel. Single point of failure: a IA. Se ela cair, é uma folha de papel + caneta.
