// Roteiros de Milhões — 8 formatos validados de roteiro de video curto + 4 tons.
// 1 ideia → 1 formato → 1 tom → 1 roteiro (sem batch). Mesmo prompt serve
// Reels (Instagram) e TikTok, com modulo de plataforma controlando hook,
// duracao e audio.

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
    descricao: "Promessa forte → tensão → revelação parcial → exemplos → CTA",
    quandoUsar: "Pra temas com 'segredo' ou 'método pouco conhecido'.",
    estrutura: `1. PROMESSA FORTE (hook): afirmação ousada e específica.
2. FALSAS RESPOSTAS: cita 1-2 caminhos óbvios e descarta.
3. TENSÃO: cria expectativa ("a verdade é mais simples / mais incômoda").
4. REVELAÇÃO PARCIAL: entrega o conceito, mas sem entregar o passo-a-passo.
5. EXEMPLOS CONCRETOS: 1-2 exemplos curtos.
6. CTA: convida a comentar/salvar/seguir pra ter o passo-a-passo.`,
  },
  contra_obvio: {
    label: "Contra o Óbvio",
    icon: "⚔️",
    descricao: "Crença popular → discordância → nova tese → exemplo → fechamento",
    quandoUsar: "Pra posicionar autoridade quebrando consenso.",
    estrutura: `1. CRENÇA POPULAR (hook): "Todo mundo diz que X".
2. DISCORDÂNCIA: "Eu discordo, e vou explicar por quê".
3. NOVA TESE: a tese contrária, em 1 frase forte.
4. EXEMPLO: prova concreta da tese.
5. FECHAMENTO PROVOCADOR: deixa o espectador defendendo a sua tese.`,
  },
  padrao_interrompido: {
    label: "Padrão Interrompido",
    icon: "💥",
    descricao: "Frase esperada → quebra inesperada → explicação → exemplo → fechamento",
    quandoUsar: "Pra hooks que param o scroll por surpresa linguística.",
    estrutura: `1. FRASE ESPERADA: começa como qualquer post.
2. QUEBRA: vira uma direção inesperada na MESMA frase ou na próxima.
3. EXPLICAÇÃO CURTA: por que a quebra faz sentido.
4. EXEMPLO: 1 caso concreto.
5. FECHAMENTO MEMORÁVEL: frase que ecoa.`,
  },
  erros_acertos: {
    label: "Erros que Parecem Acertos",
    icon: "🎯",
    descricao: "Lista de erros disfarçados → custo oculto → reenquadramento → CTA",
    quandoUsar: "Pra alta taxa de salvamento. Listicle reverso.",
    estrutura: `1. HOOK: "X erros que parecem inteligência mas estão te matando".
2. LISTA DE 3-5 ERROS: cada um em 1 frase, rápido.
3. CUSTO OCULTO: o que esses erros custam de verdade (tempo, dinheiro, autoridade).
4. REENQUADRAMENTO: o que fazer no lugar.
5. CTA: salva pra não esquecer / comenta qual erro tava cometendo.`,
  },
  sintoma_causa: {
    label: "Sintoma vs Causa",
    icon: "🔬",
    descricao: "Sintoma aparente → causa real → sinais → nova lente → CTA",
    quandoUsar: "Pra mostrar profundidade técnica sem soar arrogante.",
    estrutura: `1. SINTOMA APARENTE (hook): o problema que todo mundo enxerga.
2. CAUSA REAL: o problema de verdade, escondido.
3. SINAIS: 2-3 indicadores que mostram a causa real em ação.
4. NOVA LENTE: como reenxergar o problema agora.
5. CTA: aplica essa lente e me conta o que mudou.`,
  },
  mito_verdade: {
    label: "Mito vs Verdade",
    icon: "🧨",
    descricao: "Mito → verdade → por que importa → exemplo → CTA",
    quandoUsar: "Alta taxa de share. Funciona pra qualquer nicho.",
    estrutura: `1. MITO (hook): "Te disseram que X".
2. VERDADE: a versão real.
3. POR QUE IMPORTA: o que muda na vida/negócio quando você sabe disso.
4. EXEMPLO: prova concreta.
5. CTA: marca quem precisa ouvir isso.`,
  },
  pas: {
    label: "PAS (Problema-Agitação-Solução)",
    icon: "🩹",
    descricao: "Problema → agitação → custo oculto → solução → CTA",
    quandoUsar: "Direct response clássico. Funciona pra vender oferta.",
    estrutura: `1. PROBLEMA (hook): nomeia o problema com precisão cirúrgica.
2. AGITAÇÃO: piora o problema (consequências, exemplos, perdas).
3. CUSTO OCULTO: o que continuar nessa situação custa de verdade.
4. SOLUÇÃO: caminho de saída (mecanismo, método, oferta se houver).
5. CTA: próximo passo concreto.`,
  },
  historia_moral: {
    label: "História Curta com Moral",
    icon: "📖",
    descricao: "Cena → conflito → virada → moral → CTA",
    quandoUsar: "Maior retenção média. Storytelling em primeira pessoa.",
    estrutura: `1. CENA (hook): situação concreta, primeira pessoa, ano/lugar/quem.
2. CONFLITO: o que estava em jogo, por que era difícil.
3. VIRADA: o momento da decisão / insight / descoberta.
4. MORAL ESTRATÉGICA: o que isso ensina sobre o tema (sem moralismo).
5. CTA: pergunta pra quem viveu algo parecido.`,
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
- Evite "talvez", "pode ser", "às vezes". Afirme.
- Use perguntas que cutucam ("até quando vai...?").`,
  },
  elegante: {
    label: "Elegante",
    icon: "🎩",
    descricao: "Autoridade calma. Tom Naval/Huberman.",
    instrucao: `TOM ELEGANTE:
- Calmo, denso, autoridade silenciosa.
- Frases mais longas, com ritmo.
- Sem jargão de marketing. Sem CAPS exagerado.
- Cita exemplos de quem realmente entende.
- CTA suave (refletir, observar, considerar) — não exige ação.`,
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
- CTA: pergunta pra quem viveu algo parecido.`,
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
- CTA imperativo, direto.`,
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
- Hook tem 3 segundos pra pegar.
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
- Hook tem 0.5-1 segundo. Mais agressivo que Reels.
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
  duracaoSegundos?: number; // opcional override
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

  const system = `Você é roteirista de vídeos curtos virais (Reels e TikTok). Seu trabalho é entregar UM roteiro pronto pra gravar, no formato e tom solicitados, calibrado com a estratégia da marca.

${plataforma.instrucao}

DURAÇÃO ALVO: ${duracao}

═══ FORMATO ESCOLHIDO: ${formato.label} ═══
${formato.descricao}

ESTRUTURA OBRIGATÓRIA (siga na ordem):
${formato.estrutura}

═══ TOM ═══
${tom.instrucao}

${stageInstruction}

${strategyBlock}

═══ BRIEFING DO ROTEIRO ═══
TEMA: ${brief.topic}
${brief.hook ? `HOOK SUGERIDO: ${brief.hook}` : ""}
${brief.angle ? `ÂNGULO: ${brief.angle}` : ""}

═══ REGRAS GLOBAIS ═══
- Respeite as fronteiras do território (NUNCA toque em assuntos proibidos).
- Use a voz do criador (palavras usadas, palavras evitadas).
- Cada bloco precisa de fala E sugestão visual.
- Tempos por bloco devem somar próximo da duração alvo.
- Texto na tela é CURTO (3-6 palavras por overlay).
- B-roll é UMA descrição concreta por cena, não lista de opções.
- CTA precisa ser específico e fácil de executar (1 ação só).
- 🚨 PROIBIDO usar markdown (asteriscos, hashtags como título, traços iniciais). Texto puro.

Responda EXCLUSIVAMENTE com JSON válido nesse schema:
{
  "formato": "${brief.formato}",
  "tom": "${brief.tom}",
  "plataforma": "${brief.plataforma}",
  "duracao_estimada_s": 45,
  "titulo_interno": "Título curto pra organizar (não vai pro post)",
  "hook": {
    "fala": "Frase falada nos primeiros segundos",
    "visual": "O que aparece na tela",
    "texto_tela": "Overlay curto",
    "duracao_s": 3
  },
  "blocos": [
    {
      "tipo": "tensao | revelacao | exemplo | causa | sintoma | mito | verdade | conflito | virada | etc — use o nome que faz sentido pro formato",
      "fala": "O que falar",
      "visual": "O que aparece (talking head, b-roll, etc)",
      "texto_tela": "Overlay (curto, opcional)",
      "duracao_s": 8
    }
  ],
  "cta": {
    "fala": "Call-to-action final",
    "visual": "O que aparece no CTA",
    "texto_tela": "Overlay do CTA",
    "duracao_s": 4
  },
  "audio_sugestao": "Tipo de áudio ou trend (1 frase)",
  "legenda_post": "Legenda completa pra publicar (respeitando as regras de cada plataforma)",
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"]
}`;

  return { system, user: "Crie o roteiro completo." };
}
