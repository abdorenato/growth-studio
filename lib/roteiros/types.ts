// Tipos compartilhados do modulo Roteiros de Milhoes.
// Mantidos aqui (em vez de inline na page.tsx) pra reuso entre endpoint,
// post-processadores e UI.

import type {
  FormatoKey,
  TomKey,
  PlataformaKey,
} from "@/lib/prompts/roteiros-video";

export type Bloco = {
  tipo?: string;
  fala?: string;
  visual?: string;
  texto_tela?: string;
  duracao_s?: number;
};

export type Roteiro = {
  formato?: FormatoKey;
  tom?: TomKey;
  plataforma?: PlataformaKey;
  duracao_estimada_s?: number;
  titulo_interno?: string;
  hook?: Bloco;
  blocos?: Bloco[];
  frase_memoravel?: string;
  cta?: Bloco;
  audio_sugestao?: string;
  legenda_post?: string;
  hashtags?: string[];
};

// Briefing usado pelos validators (pra detectar se um numero foi de fato
// fornecido pelo usuario, ou inventado pela IA).
export type Briefing = {
  topic?: string;
  hook?: string;
  angle?: string;
};

// Output enriquecido apos post-processamento. Inclui metricas calculadas
// (wordCount, duracao real estimada) e warnings que a UI pode mostrar.
export type RoteiroValidated = Roteiro & {
  word_count: number;
  duracao_calculada_s: number;
  warnings: string[];
};
