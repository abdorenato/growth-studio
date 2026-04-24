import type { StrategyContext } from "@/lib/db/strategy-context";
import { formatStrategyContext } from "./_strategy-context";

// ─── TEXTO-MÃE ─────────────────────────────────────────────────────────────

export function motherTextPrompt(
  ctx: StrategyContext,
  topic: string,
  hook: string,
  angle: string
) {
  const strategyBlock = formatStrategyContext(ctx);

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

${strategyBlock}

Responda APENAS com o texto-mãe (sem JSON, sem formatação).`;

  return { system, user: "Gere o texto-mãe." };
}

// ─── REELS ─────────────────────────────────────────────────────────────────

export function reelsPrompt(ctx: StrategyContext, motherText: string) {
  const strategyBlock = formatStrategyContext(ctx);

  const system = `Você é roteirista de Reels virais.

Crie roteiro baseado no TEXTO-MÃE abaixo, respeitando toda a estratégia da marca.

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

export function postPrompt(ctx: StrategyContext, motherText: string) {
  const strategyBlock = formatStrategyContext(ctx);

  const system = `Você é copywriter de posts de Instagram de alta conversão.

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
  numSlides = 5
) {
  const strategyBlock = formatStrategyContext(ctx);
  const slidesFinal = Math.min(Math.max(numSlides, 3), 5);

  const system = `Você é copywriter de carrosséis virais.

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

export function storiesPrompt(ctx: StrategyContext, motherText: string) {
  const strategyBlock = formatStrategyContext(ctx);

  const system = `Você é especialista em sequências de Stories.

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

export function linkedinPrompt(ctx: StrategyContext, motherText: string) {
  const strategyBlock = formatStrategyContext(ctx);

  const system = `Você é copywriter de LinkedIn.

${strategyBlock}

TEXTO-MÃE:
${motherText}

REGRAS:
- Primeira linha: hook no feed do LinkedIn
- Tom profissional mas humano
- Quebras de linha pra legibilidade
- Storytelling quando couber
- CTA coerente com a editoria
- Respeite as fronteiras

Responda EXCLUSIVAMENTE com JSON:
{
  "post": "texto completo do post",
  "hashtags": ["hashtag1", "hashtag2"]
}`;
  return { system, user: "Crie o post." };
}

// ─── TIKTOK ────────────────────────────────────────────────────────────────

export function tiktokPrompt(ctx: StrategyContext, motherText: string) {
  const strategyBlock = formatStrategyContext(ctx);

  const system = `Você é roteirista de TikTok com foco em retenção nos 3 primeiros segundos.

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
