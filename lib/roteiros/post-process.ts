// Pipeline de post-processamento deterministico (codigo TS puro, sem IA).
// Aplicado APOS o callClaude do endpoint /api/roteiros/generate.
//
// Filosofia: validators determinísticos sao a "ultima linha de defesa".
// Se uma regra pode ser codigo, vira codigo. So usamos LLM (revisor) pra
// julgamento subjetivo — e nem isso por enquanto.
//
// Cada funcao recebe e retorna o roteiro (imutavel — nao muta input).

import type { Bloco, Briefing, Roteiro, RoteiroValidated } from "./types";
import {
  PALAVRAS_POR_SEGUNDO_PT,
  type ScriptLimits,
} from "./limits";

// ─── Helpers ────────────────────────────────────────────────────────────────

function countWordsInText(s: string | undefined | null): number {
  if (!s) return 0;
  return s
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

function blocoToText(b?: Bloco): string {
  return b?.fala || "";
}

/** Concatena todas as falas (hook + blocos + memoravel + cta) — ignora visual/overlay */
function concatAllSpokenText(r: Roteiro): string {
  const parts: string[] = [];
  if (r.hook) parts.push(blocoToText(r.hook));
  if (Array.isArray(r.blocos)) {
    for (const b of r.blocos) parts.push(blocoToText(b));
  }
  if (r.frase_memoravel) parts.push(r.frase_memoravel);
  if (r.cta) parts.push(blocoToText(r.cta));
  return parts.filter(Boolean).join(" ");
}

// ─── 1. SANITIZE CLAIMS ─────────────────────────────────────────────────────
// Regra: se a IA inventou numeros/percentuais/multiplicadores que NAO estavam
// no input do usuario, troca por linguagem condicional.
//
// Padroes detectados (perigosos):
//   - 25%, 30.5%        → "uma parte enorme"
//   - 10x, 3x          → "muito mais"
//   - R$ 1000, R$ 5 mil → "uma grana relevante"
//   - 3 milhoes/mil reais → "muito dinheiro"
//
// Padroes IGNORADOS (legitimos):
//   - Idades ("30 anos")           → contexto de "anos"
//   - Datas ("2024", "anos 90")    → 4 digitos isolados ou seguidos de "anos"
//   - Tempo ("30 segundos", "60s") → contexto de tempo
//   - Listas ("3 sinais", "5 erros") → numero seguido de substantivo plural sem unidade
//
// EXCECAO IMPORTANTE: se o numero aparece no input do usuario (topic/hook/angle),
// considera autorizado e NAO substitui.

const SUBSTITUICOES_PERCENTUAL = [
  "uma parte enorme",
  "uma fatia relevante",
  "uma parcela significativa",
];

const SUBSTITUICOES_MULTIPLICADOR = [
  "muito mais",
  "várias vezes mais",
  "uma diferença enorme",
];

const SUBSTITUICOES_VALOR = [
  "muito dinheiro",
  "uma grana relevante",
  "um valor que pesa",
];

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function authorizedNumbers(briefing: Briefing): Set<string> {
  const text = `${briefing.topic || ""} ${briefing.hook || ""} ${briefing.angle || ""}`;
  // Captura qualquer sequencia de digitos (com possivel decimal)
  const matches = text.match(/\d+(?:[.,]\d+)?/g) || [];
  return new Set(matches);
}

function sanitizeText(text: string, authorized: Set<string>, seedRef: { n: number }): { text: string; touched: boolean } {
  if (!text) return { text, touched: false };
  let touched = false;
  let out = text;

  // 1. PORCENTAGENS: "25%", "30.5%", "40 %"
  out = out.replace(/(\d+(?:[.,]\d+)?)\s*%/g, (m, num) => {
    if (authorized.has(num)) return m;
    touched = true;
    seedRef.n++;
    return pick(SUBSTITUICOES_PERCENTUAL, seedRef.n);
  });

  // 2. MULTIPLICADORES: "10x", "3 x" (com ou sem espaco antes do x)
  out = out.replace(/(\d+(?:[.,]\d+)?)\s*x\b/gi, (m, num) => {
    if (authorized.has(num)) return m;
    touched = true;
    seedRef.n++;
    return pick(SUBSTITUICOES_MULTIPLICADOR, seedRef.n);
  });

  // 3. VALORES MONETARIOS: "R$ 1000", "R$5 mil", "R$ 3 milhões"
  out = out.replace(
    /R\$\s*\d+(?:[.,]\d+)?(?:\s*(?:mil|milhão|milhões|bilhão|bilhões))?/gi,
    (m) => {
      // Tenta extrair o numero base
      const num = (m.match(/\d+(?:[.,]\d+)?/) || [""])[0];
      if (num && authorized.has(num)) return m;
      touched = true;
      seedRef.n++;
      return pick(SUBSTITUICOES_VALOR, seedRef.n);
    }
  );

  // 4. "3 milhoes", "5 mil reais", "10 mil dolares" (sem R$)
  out = out.replace(
    /\b(\d+(?:[.,]\d+)?)\s*(mil|milhão|milhões|bilhão|bilhões)\s*(reais|dólares|de reais|de dólares|euros)\b/gi,
    (m, num) => {
      if (authorized.has(num)) return m;
      touched = true;
      seedRef.n++;
      return pick(SUBSTITUICOES_VALOR, seedRef.n);
    }
  );

  return { text: out, touched };
}

function sanitizeBloco(b: Bloco | undefined, authorized: Set<string>, seedRef: { n: number }): { bloco?: Bloco; touched: boolean } {
  if (!b) return { bloco: b, touched: false };
  const fala = sanitizeText(b.fala || "", authorized, seedRef);
  const texto_tela = sanitizeText(b.texto_tela || "", authorized, seedRef);
  return {
    bloco: { ...b, fala: fala.text, texto_tela: texto_tela.text || b.texto_tela },
    touched: fala.touched || texto_tela.touched,
  };
}

export function sanitizeClaims(roteiro: Roteiro, briefing: Briefing): { roteiro: Roteiro; touched: boolean } {
  const authorized = authorizedNumbers(briefing);
  const seedRef = { n: 0 };
  let touched = false;

  const hookOut = sanitizeBloco(roteiro.hook, authorized, seedRef);
  if (hookOut.touched) touched = true;

  const blocosOut = (roteiro.blocos || []).map((b) => sanitizeBloco(b, authorized, seedRef));
  if (blocosOut.some((b) => b.touched)) touched = true;

  const ctaOut = sanitizeBloco(roteiro.cta, authorized, seedRef);
  if (ctaOut.touched) touched = true;

  let memoravel = roteiro.frase_memoravel;
  if (memoravel) {
    const m = sanitizeText(memoravel, authorized, seedRef);
    memoravel = m.text;
    if (m.touched) touched = true;
  }

  let legenda = roteiro.legenda_post;
  if (legenda) {
    const l = sanitizeText(legenda, authorized, seedRef);
    legenda = l.text;
    if (l.touched) touched = true;
  }

  return {
    roteiro: {
      ...roteiro,
      hook: hookOut.bloco,
      blocos: blocosOut.map((b) => b.bloco!).filter(Boolean),
      cta: ctaOut.bloco,
      frase_memoravel: memoravel,
      legenda_post: legenda,
    },
    touched,
  };
}

// ─── 2. ENFORCE SINGLE CTA ──────────────────────────────────────────────────
// Detecta CTAs empilhados ("salva, comenta e me chama") e mantem so o primeiro.
// Estrategia: contar quantos verbos imperativos comuns de CTA aparecem na fala
// do CTA. Se 2+, divide em "acoes" e mantem a primeira.

const VERBOS_CTA = [
  "salva",
  "comenta",
  "marca",
  "segue",
  "ativa",
  "compartilha",
  "manda",
  "envia",
  "responde",
  "curte",
  "clica",
  "acessa",
  "baixa",
  "inscreve",
];

export function enforceSingleCTA(roteiro: Roteiro): { roteiro: Roteiro; touched: boolean } {
  if (!roteiro.cta?.fala) return { roteiro, touched: false };

  const fala = roteiro.cta.fala;
  const lower = fala.toLowerCase();

  // Conta quantos verbos de CTA distintos aparecem
  const matched = VERBOS_CTA.filter((v) => {
    const re = new RegExp(`\\b${v}\\b`, "i");
    return re.test(lower);
  });

  if (matched.length < 2) return { roteiro, touched: false };

  // Encontra a primeira ocorrencia de qualquer verbo de CTA — mantem a sentenca
  // que contem ele, descarta o resto.
  const sentences = fala.split(/(?<=[.!?])\s+/);

  // Acha primeira sentenca com verbo CTA
  let primeira = sentences[0];
  for (const s of sentences) {
    if (VERBOS_CTA.some((v) => new RegExp(`\\b${v}\\b`, "i").test(s.toLowerCase()))) {
      primeira = s;
      break;
    }
  }

  return {
    roteiro: {
      ...roteiro,
      cta: { ...roteiro.cta, fala: primeira.trim() },
    },
    touched: true,
  };
}

// ─── 3. ENFORCE SCRIPT LIMITS ───────────────────────────────────────────────
// Aplica limites de duracao/palavras/exemplos. Estrategia conservadora:
// - Nao trunca prosa no meio (ficaria horrivel).
// - Para CTA, trunca por palavra (CTA geralmente eh frase curta — OK).
// - Para excessos de blocos exemplos/sinais, gera WARNING (nao corta).
// - Para palavras totais, gera WARNING.
//
// Razao: prefiro o usuario ver um warning e regerar do que receber um
// roteiro mutilado.

export function enforceScriptLimits(
  roteiro: Roteiro,
  limits: ScriptLimits
): { roteiro: Roteiro; warnings: string[] } {
  const warnings: string[] = [];
  let next = roteiro;

  // 1. CTA: trunca palavras se passar
  if (next.cta?.fala) {
    const ctaWords = countWordsInText(next.cta.fala);
    if (ctaWords > limits.ctaWordsMax) {
      const truncated = next.cta.fala
        .split(/\s+/)
        .slice(0, limits.ctaWordsMax)
        .join(" ")
        .replace(/[,;]$/, "")
        .trim();
      // Garante que termina com ponto/exclamacao
      const finalCta = /[.!?]$/.test(truncated) ? truncated : truncated + ".";
      next = { ...next, cta: { ...next.cta, fala: finalCta } };
      warnings.push(
        `CTA tinha ${ctaWords} palavras (limite ${limits.ctaWordsMax}). Truncado.`
      );
    }
  }

  // 2. Blocos do tipo "exemplo"
  const blocos = next.blocos || [];
  const exemplos = blocos.filter((b) => /exemplo/i.test(b.tipo || ""));
  if (exemplos.length > limits.exemplosMax) {
    warnings.push(
      `Roteiro tem ${exemplos.length} exemplos (recomendado: ${limits.exemplosMax}). Considere regerar.`
    );
  }

  // 3. Blocos do tipo "sinais"
  const sinais = blocos.filter((b) => /sinais|sinal/i.test(b.tipo || ""));
  if (sinais.length > limits.sinaisMax) {
    warnings.push(
      `Roteiro tem ${sinais.length} blocos de sinais (recomendado: ${limits.sinaisMax}).`
    );
  }

  // 4. Palavras totais
  const total = countWordsInText(concatAllSpokenText(next));
  if (total > limits.totalWordsMax) {
    const excesso = total - limits.totalWordsMax;
    const segundos = Math.round(total / PALAVRAS_POR_SEGUNDO_PT);
    warnings.push(
      `Roteiro tem ${total} palavras (~${segundos}s falados). ` +
        `Limite recomendado pra essa duração: ${limits.totalWordsMax} palavras. ` +
        `Considere regerar pra cortar ${excesso}.`
    );
  }

  return { roteiro: next, warnings };
}

// ─── 4. METRICAS ────────────────────────────────────────────────────────────

export function countWords(roteiro: Roteiro): number {
  return countWordsInText(concatAllSpokenText(roteiro));
}

export function estimateDuration(roteiro: Roteiro): number {
  const words = countWords(roteiro);
  return Math.round(words / PALAVRAS_POR_SEGUNDO_PT);
}

// ─── PIPELINE COMPLETA ──────────────────────────────────────────────────────

export type PostProcessOptions = {
  briefing: Briefing;
  limits: ScriptLimits;
};

export function postProcessRoteiro(
  roteiro: Roteiro,
  opts: PostProcessOptions
): RoteiroValidated {
  const warnings: string[] = [];

  // 1. Sanitize claims
  const s = sanitizeClaims(roteiro, opts.briefing);
  if (s.touched) {
    warnings.push("Números potencialmente inventados foram substituídos por linguagem condicional.");
  }

  // 2. Single CTA
  const c = enforceSingleCTA(s.roteiro);
  if (c.touched) {
    warnings.push("CTA tinha múltiplas ações empilhadas — mantive apenas a primeira.");
  }

  // 3. Script limits
  const l = enforceScriptLimits(c.roteiro, opts.limits);
  warnings.push(...l.warnings);

  // 4. Metricas
  const finalRoteiro = l.roteiro;
  return {
    ...finalRoteiro,
    word_count: countWords(finalRoteiro),
    duracao_calculada_s: estimateDuration(finalRoteiro),
    warnings,
  };
}
