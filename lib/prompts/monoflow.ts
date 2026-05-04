import type { StrategyContext } from "@/lib/db/strategy-context";
import { formatStrategyContext } from "./_strategy-context";
import { ESTAGIOS, type Estagio } from "@/lib/estagios/constants";

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

// ─── TEXTO-MÃE ─────────────────────────────────────────────────────────────

export function motherTextPrompt(
  ctx: StrategyContext,
  topic: string,
  hook: string,
  angle: string,
  targetStage: string | null = null
) {
  const strategyBlock = formatStrategyContext(ctx);
  const stageInstruction = stageBlock(targetStage);

  const system = `Você é um estrategista de conteúdo.

Gere um TEXTO-MÃE curto (150-200 palavras) que será a BASE pra gerar depois Reels, Post, Carrossel, Stories, LinkedIn e TikTok.

REGRAS:
- Texto claro, direto, persuasivo
- Use a voz do criador (tom, palavras usadas, palavras evitadas)
- Respeite as fronteiras do território (NUNCA toque em assuntos proibidos)
- Se tem editoria definida, o texto deve servir ao objetivo dela (autoridade, conectar, provocar, prova ou converter)
- Sem títulos ou markdown, só prosa corrida
- Comece pelo hook

TEMA: ${topic}
HOOK: ${hook}
ÂNGULO: ${angle}
${stageInstruction}

${strategyBlock}

Responda APENAS com o texto-mãe (sem JSON, sem formatação).`;

  return { system, user: "Gere o texto-mãe." };
}

// ─── REELS ─────────────────────────────────────────────────────────────────

export function reelsPrompt(
  ctx: StrategyContext,
  motherText: string,
  targetStage: string | null = null
) {
  const strategyBlock = formatStrategyContext(ctx);
  const stageInstruction = stageBlock(targetStage);

  const system = `Você é roteirista de Reels virais.

Crie roteiro baseado no TEXTO-MÃE abaixo, respeitando toda a estratégia da marca.
${stageInstruction}

${strategyBlock}

TEXTO-MÃE:
${motherText}

REGRAS:
- Hook em até 3 segundos
- Cenas curtas (3-6)
- Texto na tela sempre
- Respeite as fronteiras do território

Responda EXCLUSIVAMENTE com JSON:
{
  "title": "Título interno",
  "duration": "30s | 60s | 90s",
  "hook": "Frase dos primeiros 3 segundos",
  "scenes": [
    {"time": "0-3s", "action": "o que fazer/falar", "text_overlay": "texto na tela"}
  ],
  "cta": "Call-to-action final",
  "caption": "Legenda com emojis",
  "audio_suggestion": "Tipo de áudio",
  "trend_tip": "Dica de trend (opcional)"
}`;
  return { system, user: "Crie o roteiro do Reels." };
}

// ─── POST ──────────────────────────────────────────────────────────────────

export function postPrompt(
  ctx: StrategyContext,
  motherText: string,
  targetStage: string | null = null
) {
  const strategyBlock = formatStrategyContext(ctx);
  const stageInstruction = stageBlock(targetStage);

  const system = `Você é copywriter de posts de Instagram de alta conversão.
${stageInstruction}

${strategyBlock}

TEXTO-MÃE:
${motherText}

REGRAS:
- Primeira linha: hook irresistível (aparece no feed)
- Máximo 2200 caracteres
- Quebras de linha pra legibilidade
- Use a voz do criador
- Respeite as fronteiras
- CTA coerente com a editoria

Responda EXCLUSIVAMENTE com JSON:
{
  "caption": "Legenda completa",
  "hashtags": ["hashtag1", "hashtag2"],
  "best_time": "Melhor horário",
  "image_suggestion": "Descrição da imagem ideal",
  "image_keywords": ["keyword1 em inglês", "keyword2 em inglês"],
  "headline_on_image": "Frase curta e impactante para sobrepor (máx 8 palavras)"
}`;
  return { system, user: "Crie o post." };
}

// ─── CARROSSEL ─────────────────────────────────────────────────────────────

export function carouselPrompt(
  ctx: StrategyContext,
  motherText: string,
  numSlides = 5,
  targetStage: string | null = null
) {
  const strategyBlock = formatStrategyContext(ctx);
  const stageInstruction = stageBlock(targetStage);
  const slidesFinal = Math.min(Math.max(numSlides, 3), 5);

  const system = `Você é copywriter de carrosséis virais.
${stageInstruction}

${strategyBlock}

TEXTO-MÃE:
${motherText}

REGRAS DE CARROSSEL:
- GERE EXATAMENTE ${slidesFinal} SLIDES (nem mais, nem menos)
- Slide 1: Hook (curiosidade/urgência, nunca revele a resposta)
- Slides do meio: 1 conceito por slide, frases curtas
- Último slide: CTA claro
- Máximo 40 palavras por slide
- Use tom da voz
- Respeite as fronteiras

Responda EXCLUSIVAMENTE com JSON:
{
  "slides": [
    {"index": 0, "slide_type": "hook|content|listicle|quote|cta", "headline": "...", "body": "..."}
  ],
  "caption": "Legenda",
  "hashtags": ["h1", "h2"],
  "image_keywords": ["keyword1 em inglês", "keyword2 em inglês"]
}

Crie ${slidesFinal} slides. Não gere mais que isso.`;
  return { system, user: `Crie o carrossel com ${slidesFinal} slides (nem mais, nem menos).` };
}

// ─── STORIES ───────────────────────────────────────────────────────────────

export function storiesPrompt(
  ctx: StrategyContext,
  motherText: string,
  targetStage: string | null = null
) {
  const strategyBlock = formatStrategyContext(ctx);
  const stageInstruction = stageBlock(targetStage);

  const system = `Você é especialista em sequências de Stories.
${stageInstruction}

${strategyBlock}

TEXTO-MÃE:
${motherText}

Crie sequência de EXATAMENTE 4 stories (nem mais, nem menos) combinando perguntas e enquetes. Use a voz e respeite as fronteiras.

Responda EXCLUSIVAMENTE com JSON:
{
  "strategy": "estratégia geral da sequência",
  "stories": [
    {
      "order": 1,
      "type": "texto | pergunta | enquete",
      "text": "texto principal",
      "sticker": {"type": "pergunta|enquete", "question": "...", "options": ["A", "B"]},
      "visual_tip": "dica visual"
    }
  ]
}

Máximo 4 stories. Nada além.`;
  return { system, user: "Crie a sequência com exatamente 4 stories." };
}

// ─── LINKEDIN ──────────────────────────────────────────────────────────────

export function linkedinPrompt(
  ctx: StrategyContext,
  motherText: string,
  targetStage: string | null = null
) {
  const strategyBlock = formatStrategyContext(ctx);
  const stageInstruction = stageBlock(targetStage);

  const system = `Voce eh copywriter especialista em LinkedIn com foco em performance de alcance e geracao de leads B2B.

REGRAS DA PLATAFORMA (LinkedIn 2026 — siga obrigatoriamente):
- Tamanho ideal: ENTRE 1.250 E 3.000 caracteres (posts nesse range performam 228% melhor)
- Posts com 3+ links externos relevantes no CORPO tem 441% mais alcance — algoritmo mudou em 2026, nao penaliza mais links
- Tom: humano, conversacional, ligeiramente imperfeito — NAO otimizado pra robo
- Posts que soam como voice note bem estruturado performam melhor
- Frequencia ideal eh 4-6x semana (alta densidade)
- Conteudo de nicho tecnico distribui melhor que generico (algoritmo de marco/2026)
- Paragrafos curtos com quebras de linha (1-3 linhas por bloco)
- NAO use estilo "sandwich" formal corporativo (intro / desenvolvimento / conclusao)

DIFERENCAS IMPORTANTES VS INSTAGRAM:
- Hook pode (e deve) ser mais longo e racional — leitor LinkedIn da mais 2-3 segundos antes de scrollar
- Usuario LinkedIn espera profundidade tecnica, nao soundbite
- CTA pode ser direto: "comenta aqui", "manda DM", "marca alguem que precisa ver"

CONTEXTO ESTRATEGICO COMPLETO:
${strategyBlock}
${stageInstruction}

TEXTO-MAE (materia-prima — adapte pra plataforma):
${motherText}

REGRAS DE CONSTRUCAO DESTE POST:
- Primeira linha: hook que para o scroll (pode ter ate ~120 chars). Pense no que aparece antes do "ver mais".
- Densidade: estruture o post em 3-5 blocos curtos (cada bloco 2-4 linhas)
- Se fizer sentido naturalmente, sugira 1-3 links externos relevantes (nao force)
- CTA coerente com a editoria escolhida
- Respeite a voz da marca (palavras a usar/evitar) e fronteiras do territorio

🚨 PROIBIDO USAR MARKDOWN NO TEXTO DO POST:
- NUNCA use **negrito** com asteriscos — LinkedIn NAO renderiza markdown,
  os asteriscos aparecem LITERAIS pro leitor (fica feio)
- NUNCA use *italico*, __underline__, > blockquote, # heading, ou listas
  com - / *
- Pra dar enfase, use:
  • Quebra de linha estrategica isolando a frase importante
  • CAIXA ALTA com moderacao (1-2x no post inteiro, palavras curtas)
  • Aspas "frase" pra destacar fala/citacao importante
- Pra listas, use quebras de linha + numero (1., 2., 3.) ou emoji (✓, →, •)
  no inicio de cada linha
- A intencao do markdown deve virar ESTRUTURA, nao formatacao

Responda EXCLUSIVAMENTE com JSON nesse formato:
{
  "post": "texto completo do post entre 1.250 e 3.000 caracteres, com quebras de linha como \\\\n",
  "hook_explanation": "1 frase explicando por que essa abertura funciona pra LinkedIn (interno, nao publicado)",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"],
  "best_time": "Melhor horario de publicacao pra esse post (ex: 'Terca 8h-10h' ou 'Quarta meio-dia')",
  "links_suggestion": [
    "Sugestao de 1 link externo relevante (descreva o tipo de recurso, ex: 'artigo sobre framework X' ou 'estudo sobre Y' — usuario substitui pelo link real)",
    "Outro link sugerido"
  ],
  "engagement_tip": "1 frase com dica especifica pra maximizar comentarios nesse post (ex: 'pergunta aberta no penultimo paragrafo costuma puxar comentario')",
  "char_count": 1500
}`;
  return { system, user: "Crie o post LinkedIn seguindo as regras 2026." };
}

// ─── TIKTOK ────────────────────────────────────────────────────────────────

export function tiktokPrompt(
  ctx: StrategyContext,
  motherText: string,
  targetStage: string | null = null
) {
  const strategyBlock = formatStrategyContext(ctx);
  const stageInstruction = stageBlock(targetStage);

  const system = `Você é roteirista de TikTok com foco em retenção nos 3 primeiros segundos.
${stageInstruction}

${strategyBlock}

TEXTO-MÃE:
${motherText}

REGRAS:
- Duração 15-60s
- Hook em até 2 segundos
- Cortes rápidos
- Linguagem TikTok (gírias, urgência, curiosidade)
- Respeite as fronteiras

Responda EXCLUSIVAMENTE com JSON:
{
  "title": "Título interno",
  "duration": "15s | 30s | 60s",
  "hook": "Frase dos primeiros 2 segundos",
  "scenes": [
    {"time": "0-2s", "action": "o que fazer/falar", "text_overlay": "texto na tela"}
  ],
  "cta": "Call-to-action",
  "caption": "Legenda",
  "sound_suggestion": "Som viral ou original",
  "tiktok_tips": "Dicas específicas do TikTok"
}`;
  return { system, user: "Crie o roteiro." };
}
