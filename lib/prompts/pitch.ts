import type { ICP, Offer } from "@/types";
import { formatICP } from "./oferta";

function formatOferta(o: Offer): string {
  return [
    `Nome: ${o.name}`,
    `Core Promise: ${o.core_promise}`,
    `Método: ${o.method_name}`,
    `Sonho: ${o.dream}`,
    `Bônus: ${(o.bonuses || []).join(" | ")}`,
    `Escassez: ${o.scarcity}`,
    `Garantia: ${o.guarantee}`,
    `Provas: ${(o.success_proofs || []).join(" | ")}`,
    `Tempo: ${o.time_to_result}`,
    `Esforço: ${o.effort_level}`,
  ].join("\n");
}

export function pitchPrompt(icp: ICP, oferta: Offer) {
  const system = `Você é um copywriter especialista em pitches de vendas para redes sociais.

Sua tarefa é construir um pitch de vendas que responde às 5 perguntas fundamentais e gera um texto vendedor final.

AS 5 PERGUNTAS:
1. Por que a pessoa tem que comprar de você? (autoridade + diferencial)
2. Por que comprar agora? (urgência, contexto do momento)
3. Por que vai se ferrar se não comprar agora? (dor da inação)
4. Por que você é a pessoa indicada para vender isso? (história, credenciais)
5. Por que está entregando mais com um valor menor? (justificativa de preço)

Use o ICP e a oferta abaixo para criar respostas específicas e persuasivas.

ICP:
${formatICP(icp)}

OFERTA:
${formatOferta(oferta)}

Responda EXCLUSIVAMENTE com JSON no formato:
{
  "answers": [
    {"question": "Por que comprar de você?", "answer": "..."},
    {"question": "Por que comprar agora?", "answer": "..."},
    {"question": "Por que vai se ferrar se não comprar?", "answer": "..."},
    {"question": "Por que eu sou a pessoa indicada?", "answer": "..."},
    {"question": "Por que estou entregando mais por menos?", "answer": "..."}
  ],
  "pitch": "Texto completo do pitch (3-5 parágrafos) compilando as 5 respostas num discurso vendedor fluido e persuasivo"
}`;

  const user = `Crie o pitch de vendas para essa oferta.`;
  return { system, user };
}

export function pitchFinalPrompt(
  icp: ICP,
  oferta: Offer,
  answers: { question: string; answer: string }[]
) {
  const system = `Você é um copywriter especialista. Dadas as respostas refinadas pelo usuário, gere o pitch final vendedor.

ICP:
${formatICP(icp)}

OFERTA:
${formatOferta(oferta)}

RESPOSTAS DO USUÁRIO:
${answers.map((a, i) => `${i + 1}. ${a.question}\n${a.answer}`).join("\n\n")}

Gere APENAS o texto final do pitch (3-5 parágrafos, fluido, persuasivo, sem JSON, sem markdown). Comece direto pelo hook.`;

  return { system, user: "Gere o pitch final." };
}
