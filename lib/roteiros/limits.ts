// Limites determinísticos por (plataforma, duracao). Usados pelo
// post-processador pra cortar excessos e gerar warnings.
//
// Os valores foram calibrados pra:
// - Reels Instagram: 30-60s padrao (palavras moderadas, audio important)
// - TikTok: 15-45s, mais cru e telegrafico (menos palavras)
// - Ritmo de fala em PT-BR: ~2.3 palavras/segundo (calmo).
//   Roteiros de venda costumam acelerar pra 2.6-2.8 — usamos 2.3 como
//   conservador, dando folga de respiracao.

import type { PlataformaKey } from "@/lib/prompts/roteiros-video";

export type ScriptLimits = {
  /** Maximo de palavras totais no roteiro (hook + blocos + memoravel + cta) */
  totalWordsMax: number;
  /** Maximo de blocos com tipo "exemplo" — limita verbosidade */
  exemplosMax: number;
  /** Maximo de blocos com tipo "sinais"/"sinal" — limita listicle */
  sinaisMax: number;
  /** Maximo de palavras na fala do CTA */
  ctaWordsMax: number;
  /** Duracao alvo (referencia, nao enforcement) */
  duracaoAlvoSegundos: number;
};

export function getScriptLimits(
  plataforma: PlataformaKey,
  duracaoSegundos?: number
): ScriptLimits {
  const dur = duracaoSegundos || (plataforma === "tiktok" ? 30 : 45);

  if (plataforma === "tiktok") {
    if (dur <= 15)
      return {
        totalWordsMax: 40,
        exemplosMax: 0,
        sinaisMax: 2,
        ctaWordsMax: 12,
        duracaoAlvoSegundos: 15,
      };
    if (dur <= 30)
      return {
        totalWordsMax: 75,
        exemplosMax: 1,
        sinaisMax: 2,
        ctaWordsMax: 14,
        duracaoAlvoSegundos: 30,
      };
    return {
      totalWordsMax: 110,
      exemplosMax: 1,
      sinaisMax: 3,
      ctaWordsMax: 14,
      duracaoAlvoSegundos: 45,
    };
  }

  // Instagram Reels
  if (dur <= 30)
    return {
      totalWordsMax: 80,
      exemplosMax: 1,
      sinaisMax: 2,
      ctaWordsMax: 16,
      duracaoAlvoSegundos: 30,
    };
  if (dur <= 60)
    return {
      totalWordsMax: 150,
      exemplosMax: 1,
      sinaisMax: 3,
      ctaWordsMax: 18,
      duracaoAlvoSegundos: 60,
    };
  return {
    totalWordsMax: 220,
    exemplosMax: 1,
    sinaisMax: 3,
    ctaWordsMax: 20,
    duracaoAlvoSegundos: 90,
  };
}

/** Ritmo medio de fala em portugues (palavras/segundo) — usado pra estimar duracao real */
export const PALAVRAS_POR_SEGUNDO_PT = 2.3;
