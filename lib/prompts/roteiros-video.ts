// Roteiros de Milhões — 8 formatos validados de roteiro de video curto + 4 tons.
// 1 ideia → 1 formato → 1 tom → 1 roteiro (sem batch). Mesmo prompt serve
// Reels (Instagram) e TikTok, com modulo de plataforma controlando hook,
// duracao e audio.
//
// Regras de escrita unificadas em REGRAS_ESCRITA — aplicadas a todos os
// formatos, com enfase em retencao, suspense e CTA acionavel.

import type { StrategyContext } from "@/lib/db/strategy-context";
import { formatStrategyContext } from "./_strategy-context";
import { ESTAGIOS, type Estagio } from "@/lib/estagios/constants";

export type FormatoKey =
  | "revelacao_retardada"
  | "contra_obvio"
  | "padrao_interrompido"
  | "erros_acertos"
  | "sintoma_causa"
  | "mito_verdade"
  | "pas"
  | "historia_moral";

export type TomKey = "provocadora" | "elegante" | "narrativa" | "agressiva";

export type PlataformaKey = "instagram" | "tiktok";

// ─── REGRAS DE ESCRITA (CRÍTICAS — APLICAM A TODOS OS FORMATOS) ─────────────
// Estas regras sao obrigatorias e tem prioridade sobre qualquer instrucao
// posterior. Foram derivadas de roteiros que de fato performam.

const REGRAS_ESCRITA = `
═══ REGRAS DE ESCRITA (CRÍTICAS — TÊM PRIORIDADE MÁXIMA) ═══

🎣 1. HOOK COM SUSPENSE (não seco)
- ❌ EVITAR hooks que entregam a tese de cara: "Você acha que cresce lento porque precisa vender mais. Errado."
- ✅ PREFERIR hooks que ABREM UM LOOP (deixam o espectador querendo a resposta):
  • "Tem empresário tentando vender mais só pra esconder que está vazando margem todos os dias."
  • "Se sua empresa cresce devagar, talvez o problema não seja vender pouco."
  • "O maior erro dos empresários não é vender pouco. É acelerar antes de enxergar onde está vazando."
- O hook NUNCA fecha a ideia. Ele PROMETE algo e segura a resposta.

🪤 2. FALSAS RESPOSTAS antes da revelação (quando o formato permitir)
- Liste 2-3 causas óbvias que a audiência já considerou e DESCARTE.
- Exemplo: "O empresário acha que é falta de lead. Ou falta de time. Ou falta de mídia. Mas, muitas vezes, não é nada disso."
- Isso aumenta retenção porque cria uma cumplicidade ("ele entende meu pensamento").

⏳ 3. TENSÃO antes da entrega
- Sempre incluir uma frase curta de tensão entre as falsas respostas e a revelação.
- Exemplos:
  • "O problema é pior porque parece rotina."
  • "E tudo que parece rotina, o dono para de questionar."
  • "O perigoso é que isso não aparece como problema. Aparece como normal."

💡 4. REVELAÇÃO CONCRETA, nunca abstrata
- ❌ EVITAR fechamentos genéricos: "O problema é um padrão." / "Tudo se resume à execução."
- ✅ A revelação SEMPRE deve conter:
  • TESE PRINCIPAL em 1 frase forte
  • 2-3 MANIFESTAÇÕES PRÁTICAS no dia a dia (concretas, observáveis)
  • CONSEQUÊNCIA CLARA
- Exemplo: "O problema é um padrão de decisão: adiar conversas, manter estruturas ruins e chamar gargalo de fase. E aí cada mês perdido vira margem que não volta."

🚫 5. SEM ESTATÍSTICAS SEM BASE
- ❌ NUNCA inventar números: "drena 25-40% da margem" / "aumenta 300% as vendas"
- ✅ Se quiser sugerir magnitude, usar linguagem CONDICIONAL:
  • "Pode estar drenando uma parte enorme da sua margem."
  • "Em alguns negócios, esse vazamento pode chegar a comprometer uma parte relevante da margem."
  • "Pode estar comendo margem todos os meses sem aparecer claramente no relatório."

🎯 6. LIMITAR EXEMPLOS (especialmente em roteiros ≤60s)
- Máximo 1 exemplo concreto detalhado por roteiro.
- Depois disso, no máximo 2-3 sinais rápidos (1 frase cada).
- ❌ EVITAR 2-3 exemplos longos no mesmo roteiro — confunde e perde retenção.

🗣️ 7. FRASES FALADAS, NÃO ESCRITAS
- Cada frase tem 1 ideia só. Curta.
- Quebra em linhas, como se fosse falado em voz alta.
- Sem parágrafos longos.
- Use vírgulas e pontos finais como respiros, não conjunções longas.
- TESTE MENTAL: leia em voz alta — se travou, refaz.

💎 8. FRASE MEMORÁVEL antes do CTA
- Sempre incluir UMA frase de impacto, curta, antes do CTA.
- Não é o CTA — é a MORAL do roteiro, condensada.
- Exemplos do nível desejado:
  • "Parecia crescimento. Era vazamento."
  • "Mais venda em cima de gargalo só aumenta o problema."
  • "Fase passa. Padrão se repete."
  • "Você não precisa acelerar antes de enxergar onde está vazando."
- Estrutura: 2 partes contrastantes ou 1 sentença curta com peso.

📣 9. CTA ÚNICO E ACIONÁVEL
- ❌ NUNCA empilhar: "salva, comenta e me chama" / "segue, marca alguém e ativa o sininho"
- ✅ Apenas UMA ação por roteiro. Preferência por palavra-chave concreta:
  • "Comenta GARGALO que eu te mando 3 perguntas pra começar esse diagnóstico."
  • "Comenta QUAL DESSES erros você comete que eu te respondo."
  • "Se isso bateu, me chama no direct."
- O CTA tem que ser ÓBVIO de executar — sem ambiguidade do que fazer.
`;

// ─── METADADOS DOS FORMATOS ─────────────────────────────────────────────────
// Cada formato carrega: label, micro-explicacao pra UI, quando usar e a
// estrutura que vai ser injetada no prompt da IA.

export const FORMATOS: Record<
  FormatoKey,
  {
    label: string;
    icon: string;
    descricao: string;
    quandoUsar: string;
    estrutura: string;
  }
> = {
  revelacao_retardada: {
    label: "Revelação Retardada",
    icon: "🎁",
    descricao: "Hook → falsas respostas → tensão → revelação concreta → exemplo → frase memorável → CTA",
    quandoUsar: "Pra temas com 'segredo' ou 'método pouco conhecido'.",
    estrutura: `1. HOOK COM PROMESSA OU PROVOCAÇÃO (3s, abre loop, não revela ainda):
   ✅ Modelo: "Tem empresário tentando vender mais só pra esconder que está vazando margem todos os dias."
   ✅ Modelo: "Se sua empresa cresce devagar, talvez o problema não seja vender pouco."

2. FALSAS RESPOSTAS (2-3 causas óbvias que a audiência já considerou — descarta cada uma):
   ✅ Modelo: "Acha que é falta de lead. Ou falta de time. Ou falta de mídia. Mas, muitas vezes, não é nada disso."

3. TENSÃO (1-2 frases curtas, cria expectativa antes de revelar):
   ✅ Modelo: "O problema é pior. Porque parece rotina. E tudo que parece rotina, o dono para de questionar."

4. REVELAÇÃO CONCRETA (CRÍTICO — nunca abstrata):
   - Tese principal em 1 frase
   - 2-3 manifestações práticas (concretas, observáveis no dia a dia)
   - Consequência clara
   ✅ Modelo: "Normalmente, o vazamento aparece em três lugares: processo que ninguém documentou, cliente que sai e ninguém entende por quê, e preço que não reflete o valor real da entrega."

5. EXEMPLO ÚNICO OU SINAIS PRÁTICOS (máximo 1 exemplo detalhado):
   - 1 caso concreto com nomes/números específicos OU
   - 2-3 sinais rápidos do dia a dia (1 frase cada)
   ✅ Modelo: "Já vi consultoria cobrando 15 mil quando deveria cobrar 40. O dono achava que precisava vender mais. Mas o gargalo estava no tempo real de entrega, que nunca tinha sido mapeado."

6. FRASE MEMORÁVEL (antes do CTA — moral condensada):
   ✅ Modelo: "Parecia crescimento. Era vazamento."
   ✅ Modelo: "Antes de acelerar, você precisa enxergar onde está vazando."
   ✅ Modelo: "Mais venda em cima de gargalo só aumenta o problema."

7. CTA ÚNICO E ACIONÁVEL (UMA ação só, com palavra-chave de preferência):
   ✅ Modelo: "Comenta GARGALO que eu te mando 3 perguntas pra começar esse diagnóstico."`,
  },
  contra_obvio: {
    label: "Contra o Óbvio",
    icon: "⚔️",
    descricao: "Crença popular → discordância → nova tese → exemplo → frase memorável → CTA",
    quandoUsar: "Pra posicionar autoridade quebrando consenso.",
    estrutura: `1. CRENÇA POPULAR (hook, abre loop): "Todo mundo diz que X" — mas formulada com suspense, não como afirmação plana.
2. DISCORDÂNCIA: "Eu discordo, e vou explicar por quê" — em 1 frase.
3. NOVA TESE CONCRETA: a tese contrária, com 2-3 manifestações práticas (não abstrata).
4. EXEMPLO ÚNICO: 1 caso concreto que prova a tese (nomes/números específicos).
5. FRASE MEMORÁVEL: moral condensada antes do CTA.
6. CTA ÚNICO E ACIONÁVEL.`,
  },
  padrao_interrompido: {
    label: "Padrão Interrompido",
    icon: "💥",
    descricao: "Frase esperada → quebra inesperada → explicação → exemplo → frase memorável → CTA",
    quandoUsar: "Pra hooks que param o scroll por surpresa linguística.",
    estrutura: `1. FRASE ESPERADA (hook, abre loop): começa como qualquer post comum.
2. QUEBRA: vira uma direção inesperada na MESMA frase ou na próxima.
3. EXPLICAÇÃO CURTA: por que a quebra faz sentido — em 2-3 frases.
4. EXEMPLO ÚNICO: 1 caso concreto.
5. FRASE MEMORÁVEL: ecoa a quebra de outro ângulo.
6. CTA ÚNICO E ACIONÁVEL.`,
  },
  erros_acertos: {
    label: "Erros que Parecem Acertos",
    icon: "🎯",
    descricao: "Hook → lista de 3 erros → custo oculto → reenquadramento → frase memorável → CTA",
    quandoUsar: "Pra alta taxa de salvamento. Listicle reverso.",
    estrutura: `1. HOOK COM SUSPENSE: "X erros que parecem inteligência mas estão te matando" — formulado pra abrir loop.
2. LISTA DE 3 ERROS (no máx, em roteiros ≤60s): cada um em 1 frase curta.
3. CUSTO OCULTO: o que esses erros custam de verdade (tempo, dinheiro, autoridade) — concreto, sem números inventados.
4. REENQUADRAMENTO: o que fazer no lugar — 1 frase por erro.
5. FRASE MEMORÁVEL: moral antes do CTA.
6. CTA ÚNICO: "Comenta QUAL DESSES erros você comete que eu te respondo."`,
  },
  sintoma_causa: {
    label: "Sintoma vs Causa",
    icon: "🔬",
    descricao: "Sintoma → falsas causas → tensão → causa real → sinais → frase memorável → CTA",
    quandoUsar: "Pra mostrar profundidade técnica sem soar arrogante.",
    estrutura: `1. SINTOMA APARENTE (hook, abre loop): o problema que todo mundo enxerga.
2. FALSAS CAUSAS (2-3): "Você acha que é X. Ou Y. Ou Z."
3. TENSÃO: 1 frase curta antes de revelar.
4. CAUSA REAL (concreta, com manifestações práticas).
5. SINAIS PRÁTICOS: 2-3 indicadores que mostram a causa real em ação.
6. FRASE MEMORÁVEL: moral condensada.
7. CTA ÚNICO: "Comenta QUAL desses sinais você reconhece que eu te respondo."`,
  },
  mito_verdade: {
    label: "Mito vs Verdade",
    icon: "🧨",
    descricao: "Hook (mito) → tensão → verdade concreta → exemplo → frase memorável → CTA",
    quandoUsar: "Alta taxa de share. Funciona pra qualquer nicho.",
    estrutura: `1. HOOK COM O MITO (abre loop): "Te disseram que X" — formulado com suspense.
2. TENSÃO: 1 frase curta antes da virada.
3. VERDADE CONCRETA: a versão real, com 2-3 manifestações práticas.
4. EXEMPLO ÚNICO: 1 prova concreta.
5. FRASE MEMORÁVEL: contraste mito/verdade em 1 linha.
6. CTA ÚNICO: "Marca quem precisa ouvir isso" OU palavra-chave no comentário.`,
  },
  pas: {
    label: "PAS (Problema-Agitação-Solução)",
    icon: "🩹",
    descricao: "Problema → agitação → custo oculto → solução concreta → frase memorável → CTA",
    quandoUsar: "Direct response clássico. Funciona pra vender oferta.",
    estrutura: `1. PROBLEMA (hook, abre loop): nomeia o problema com precisão cirúrgica.
2. AGITAÇÃO: piora o problema — 2-3 manifestações práticas, não abstratas.
3. CUSTO OCULTO: o que continuar nessa situação custa de verdade — sem números inventados, usar linguagem condicional.
4. SOLUÇÃO CONCRETA: caminho de saída (mecanismo, método, oferta se houver) — com 1-2 passos práticos.
5. FRASE MEMORÁVEL: moral antes do CTA.
6. CTA ÚNICO E ACIONÁVEL.`,
  },
  historia_moral: {
    label: "História Curta com Moral",
    icon: "📖",
    descricao: "Cena → conflito → virada → moral concreta → frase memorável → CTA",
    quandoUsar: "Maior retenção média. Storytelling em primeira pessoa.",
    estrutura: `1. CENA (hook, abre loop): situação concreta, primeira pessoa, ano/lugar/quem específicos.
2. CONFLITO: o que estava em jogo, por que era difícil — 2-3 frases.
3. VIRADA: o momento da decisão / insight / descoberta — concreto, não vago.
4. MORAL ESTRATÉGICA: o que isso ensina sobre o tema (sem moralismo) — com 2-3 manifestações práticas.
5. FRASE MEMORÁVEL: condensa a moral em 1 linha.
6. CTA ÚNICO: pergunta pra quem viveu algo parecido OU palavra-chave no comentário.`,
  },
};

// ─── METADADOS DOS TONS ─────────────────────────────────────────────────────

export const TONS: Record<
  TomKey,
  { label: string; icon: string; descricao: string; instrucao: string }
> = {
  provocadora: {
    label: "Provocadora",
    icon: "🔥",
    descricao: "Direta, polariza, gera comentário.",
    instrucao: `TOM PROVOCADOR:
- Frases curtas, secas. Sem rodeios.
- Use "você" direto, sem floreio.
- Pelo menos 1 afirmação que vai gerar discordância.
- Evite "talvez", "pode ser", "às vezes" no corpo do roteiro. Afirme.
- IMPORTANTE: a regra de "sem números inventados" continua valendo — afirmar não é inventar dado.
- Use perguntas que cutucam ("até quando vai...?").`,
  },
  elegante: {
    label: "Elegante",
    icon: "🎩",
    descricao: "Autoridade calma. Tom Naval/Huberman.",
    instrucao: `TOM ELEGANTE:
- Calmo, denso, autoridade silenciosa.
- Frases mais longas, com ritmo — mas ainda quebradas em linhas (regra de "frases faladas" continua).
- Sem jargão de marketing. Sem CAPS exagerado.
- Cita exemplos de quem realmente entende.
- CTA suave (refletir, observar, considerar) — mas ainda ÚNICO e claro.`,
  },
  narrativa: {
    label: "Narrativa",
    icon: "🎬",
    descricao: "Storytime em primeira pessoa.",
    instrucao: `TOM NARRATIVO:
- Primeira pessoa. "Eu", "comigo".
- Cena concreta: ano, lugar, pessoa específica.
- Verbos no passado pra cena, presente pra moral.
- Detalhes sensoriais (o que via, ouvia, sentia).
- CTA único: pergunta pra quem viveu algo parecido.`,
  },
  agressiva: {
    label: "Agressiva",
    icon: "⚡",
    descricao: "Confronta, polariza forte (estilo Hormozi).",
    instrucao: `TOM AGRESSIVO:
- Confronta o espectador desde o hook.
- Frases curtíssimas. Quase staccato.
- Use "PARA" e imperativos: "Para de fazer X".
- Polariza explicitamente: "Se você não concorda com isso, esse vídeo não é pra você".
- Sem desculpas, sem suavização.
- CTA imperativo, direto — mas ÚNICO (não empilhar ações).`,
  },
};

// ─── METADADOS DAS PLATAFORMAS ──────────────────────────────────────────────

export const PLATAFORMAS: Record<
  PlataformaKey,
  {
    label: string;
    icon: string;
    duracaoPadrao: string;
    instrucao: string;
  }
> = {
  instagram: {
    label: "Instagram Reels",
    icon: "📹",
    duracaoPadrao: "30-60s",
    instrucao: `PLATAFORMA: Instagram Reels
- Hook tem 3 segundos pra pegar — use suspense, abra um loop.
- Duração ideal: 30-60 segundos.
- Texto na tela em quase toda cena (Stories habit).
- B-roll esperado, mas talking head funciona bem.
- Audio: trend ou batida lenta. Cite trend se fizer sentido.
- Legenda do post pode ser longa (até 200 palavras).
- Hashtags: 3-5 estratégicas, não 30 aleatórias.`,
  },
  tiktok: {
    label: "TikTok",
    icon: "🎵",
    duracaoPadrao: "15-45s",
    instrucao: `PLATAFORMA: TikTok
- Hook tem 0.5-1 segundo. Mais agressivo que Reels — mas ainda com suspense, não entregando a tese de cara.
- Duração ideal: 15-45 segundos. Menos é mais.
- Estilo cru/raw. Iluminação natural funciona melhor que produção polida.
- Audio é PROTAGONISTA — sugira trend específica se possível, e indique se a fala acompanha o beat.
- Texto na tela em CAPS curtas, ritmo de zoom/corte.
- Legenda curta (1-2 frases). Hashtags: 3-4 específicas.
- Tom mais informal, gírias OK quando combina com a marca.`,
  },
};

// Bloco de instrução de estágio de consciência (Eugene Schwartz)
function stageBlock(stage: string | null): string {
  if (!stage) return "";
  const info = ESTAGIOS[stage as Estagio];
  if (!info) return "";

  return `\n
ESTÁGIO DE CONSCIÊNCIA DA AUDIÊNCIA: ${info.label} (${info.icon})
- Situação: ${info.desc}
- Tom esperado: ${info.tom}
- Exemplo de hook ideal: "${info.exemploHook}"

CALIBRE TODA A PEÇA pra esse estágio. Hook, profundidade, exemplos e CTA devem assumir que a audiência está nesse momento da jornada — nem antes, nem depois.`;
}

// ─── BUILDER DO PROMPT ──────────────────────────────────────────────────────

export type RoteiroBriefing = {
  topic: string;
  hook?: string;
  angle?: string;
  formato: FormatoKey;
  tom: TomKey;
  plataforma: PlataformaKey;
  duracaoSegundos?: number;
  targetStage?: string | null;
};

export function roteiroPrompt(ctx: StrategyContext, brief: RoteiroBriefing) {
  const formato = FORMATOS[brief.formato];
  const tom = TONS[brief.tom];
  const plataforma = PLATAFORMAS[brief.plataforma];
  const strategyBlock = formatStrategyContext(ctx);
  const stageInstruction = stageBlock(brief.targetStage || null);
  const duracao = brief.duracaoSegundos
    ? `${brief.duracaoSegundos}s`
    : plataforma.duracaoPadrao;

  const system = `Você é roteirista de vídeos curtos virais (Reels e TikTok). Seu trabalho é entregar UM roteiro pronto pra gravar — alta retenção, clareza e payoff — calibrado com a estratégia da marca.

${REGRAS_ESCRITA}

${plataforma.instrucao}

DURAÇÃO ALVO: ${duracao}

═══ FORMATO ESCOLHIDO: ${formato.label} ═══
${formato.descricao}

ESTRUTURA OBRIGATÓRIA (siga na ordem, sem pular passos):
${formato.estrutura}

═══ TOM ═══
${tom.instrucao}

${stageInstruction}

${strategyBlock}

═══ BRIEFING DO ROTEIRO ═══
TEMA: ${brief.topic}
${brief.hook ? `HOOK SUGERIDO (use como referência, mas reformule pra abrir loop conforme a regra 1): ${brief.hook}` : ""}
${brief.angle ? `ÂNGULO: ${brief.angle}` : ""}

═══ REGRAS DE PRODUÇÃO ═══
- Respeite as fronteiras do território (NUNCA toque em assuntos proibidos).
- Use a voz do criador (palavras usadas, palavras evitadas).
- Cada bloco precisa de fala E sugestão visual.
- Tempos por bloco devem somar próximo da duração alvo.
- Texto na tela é CURTO (3-6 palavras por overlay).
- B-roll é UMA descrição concreta por cena, não lista de opções.
- 🚨 PROIBIDO usar markdown (asteriscos, hashtags como título, traços iniciais). Texto puro.

═══ CHECKLIST FINAL (antes de retornar JSON, valide mentalmente) ═══
□ Hook abre um loop, não entrega a tese de cara?
□ Tem falsas respostas/causas (quando o formato pede)?
□ Tem frase de tensão antes da revelação?
□ Revelação é concreta, com 2-3 manifestações práticas + consequência?
□ Sem estatísticas inventadas (usei linguagem condicional quando precisei sugerir magnitude)?
□ Máximo 1 exemplo concreto detalhado?
□ Frases curtas, faladas, quebradas em linhas?
□ Tem 1 frase memorável antes do CTA?
□ CTA é ÚNICO e acionável (não empilhei "salva, comenta e marca")?

Responda EXCLUSIVAMENTE com JSON válido nesse schema:
{
  "formato": "${brief.formato}",
  "tom": "${brief.tom}",
  "plataforma": "${brief.plataforma}",
  "duracao_estimada_s": 45,
  "titulo_interno": "Título curto pra organizar (não vai pro post)",
  "hook": {
    "fala": "Hook que abre um loop (3s)",
    "visual": "O que aparece na tela",
    "texto_tela": "Overlay curto",
    "duracao_s": 3
  },
  "blocos": [
    {
      "tipo": "falsas_respostas | tensao | revelacao | exemplo | sinais | causa | sintoma | mito | verdade | conflito | virada | reenquadramento | etc — use o nome que faz sentido pro formato",
      "fala": "O que falar (curto, falado, quebrado em linhas)",
      "visual": "O que aparece (talking head, b-roll, etc)",
      "texto_tela": "Overlay (curto, opcional)",
      "duracao_s": 8
    }
  ],
  "frase_memoravel": "Frase de impacto antes do CTA (ex: 'Parecia crescimento. Era vazamento.')",
  "cta": {
    "fala": "Call-to-action ÚNICO e acionável (1 ação só, palavra-chave de preferência)",
    "visual": "O que aparece no CTA",
    "texto_tela": "Overlay do CTA",
    "duracao_s": 4
  },
  "audio_sugestao": "Tipo de áudio ou trend (1 frase)",
  "legenda_post": "Legenda completa pra publicar (respeitando as regras de cada plataforma)",
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"]
}`;

  return { system, user: "Crie o roteiro completo seguindo TODAS as regras de escrita." };
}
