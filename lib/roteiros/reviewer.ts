// Revisor LLM — esqueleto desativado por padrao.
//
// Quando ligar (env ENABLE_SCRIPT_REVIEWER=true), o revisor recebe o roteiro
// gerado e o checklist editorial, e julga se passa ou precisa regerar.
//
// Custo: +1 chamada Claude por roteiro (~$0.005)
// Latencia: +3-5s
//
// Por que existe esqueleto se nao roda: deixa pronto pra ligar com 1 flag
// quando os validators deterministicos provarem nao ser suficientes pra
// resolver problemas SUBJETIVOS de qualidade (hook seco, revelacao abstrata,
// frase memoravel fraca).
//
// Quando ligar: depois de testar 10-20 roteiros com so os validators e
// notar que >30% tem problemas subjetivos que regex nao pega.

import { callClaude } from "@/lib/claude";
import type { Roteiro } from "./types";

export const REVIEWER_ENABLED = process.env.ENABLE_SCRIPT_REVIEWER === "true";

export type ReviewResult = {
  passed: boolean;
  failures: string[]; // ex: ["hook_seco", "revelacao_abstrata"]
  notes: string;
};

const REVIEWER_SYSTEM = `Você é editor crítico de roteiros virais. Sua tarefa é validar se o roteiro abaixo cumpre TODOS os critérios de qualidade. Seja rigoroso — só aprova o que de fato funciona.

CRITÉRIOS (todos devem passar):
1. HOOK abre um loop (não entrega a tese de cara)
2. Tem FALSAS RESPOSTAS antes da revelação (quando o formato pede)
3. Tem frase de TENSÃO antes de revelar
4. REVELAÇÃO é concreta — tese + 2-3 manifestações práticas + consequência clara
5. NÃO inventa estatísticas (sem números fortes sem base)
6. Máximo 1 EXEMPLO concreto detalhado
7. Frases curtas, faladas, quebradas em linhas
8. Tem 1 FRASE MEMORÁVEL antes do CTA (com peso/contraste)
9. CTA é ÚNICO e acionável

Responda APENAS com JSON:
{
  "passed": true|false,
  "failures": ["lista de criterios que falharam, ex: 'hook_seco', 'revelacao_abstrata', 'cta_empilhado'"],
  "notes": "1-2 frases explicando o que precisa melhorar"
}`;

export async function reviewRoteiro(
  roteiro: Roteiro,
  meta: { userId?: string }
): Promise<ReviewResult | null> {
  if (!REVIEWER_ENABLED) return null;

  const userMessage = `Avalie este roteiro:\n\n${JSON.stringify(roteiro, null, 2)}`;

  try {
    const text = await callClaude(REVIEWER_SYSTEM, userMessage, 800, {
      endpoint: "/api/roteiros/generate (reviewer)",
      userId: meta.userId,
    });
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned) as ReviewResult;
  } catch (err) {
    console.error("Reviewer falhou (silencioso):", err);
    return null; // falha silenciosa — nao bloqueia entrega
  }
}
