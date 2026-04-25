import type { Offer } from "@/types";
import type { StrategyContext } from "@/lib/db/strategy-context";
import { formatStrategyContext } from "./_strategy-context";

function formatOferta(o: Offer): string {
  return [
    `Nome: ${o.name}`,
    `Core Promise: ${o.core_promise}`,
    `Método: ${o.method_name || "(nenhum nomeado ainda)"}`,
    `Sonho: ${o.dream}`,
    `Bônus: ${(o.bonuses || []).join(" | ")}`,
    `Escassez: ${o.scarcity}`,
    `Garantia: ${o.guarantee}`,
    `Provas: ${(o.success_proofs || []).join(" | ")}`,
    `Tempo: ${o.time_to_result}`,
    `Esforço: ${o.effort_level}`,
  ].join("\n");
}

const REGRAS_GERAIS = `REGRAS GERAIS (NÃO QUEBRE):
1. NUNCA invente fatos sobre o criador (carreira, anos de experiência, número de clientes/alunos, certificações, prêmios, depoimentos). Use APENAS o que está no contexto estratégico.
2. NUNCA invente nome de método. Se a oferta tem method_name vazio, fale do método de forma genérica ou não cite — não nomeie nada.
3. A autoridade do pitch sai do TERRITÓRIO + POSICIONAMENTO + tese do criador. Se o criador não definiu credenciais lá, não invente.
4. A linguagem do pitch deve seguir a VOZ DA MARCA (palavras a usar, palavras a evitar, tom).
5. O pitch deve estar coerente com a tese e fronteiras do TERRITÓRIO (não fale de coisas nas fronteiras negativas).`;

export function pitchPrompt(ctx: StrategyContext, oferta: Offer) {
  const strategyBlock = formatStrategyContext(ctx);

  const system = `Você é um copywriter especialista em pitches de vendas para redes sociais.

Sua tarefa é construir um pitch de vendas que responde às 5 perguntas fundamentais e gera um texto vendedor final.

CONTEXTO ESTRATÉGICO COMPLETO DO CRIADOR:
${strategyBlock}

OFERTA QUE ESTAMOS VENDENDO:
${formatOferta(oferta)}

${REGRAS_GERAIS}

AS 5 PERGUNTAS:
1. Por que a pessoa tem que comprar de você? (autoridade + diferencial — tira da TESE/POSICIONAMENTO; nada de credencial inventada)
2. Por que comprar agora? (urgência, contexto do momento — sem deadline fake)
3. Por que vai se ferrar se não comprar agora? (dor da inação — usa as DORES do ICP)
4. Por que você é a pessoa indicada para vender isso? (use ÂNCORA MENTAL + LENTE + TESE do criador; NÃO invente história)
5. Por que está entregando mais com um valor menor? (justificativa de preço com base nos bônus reais da oferta)

Responda EXCLUSIVAMENTE com JSON no formato:
{
  "answers": [
    {"question": "Por que comprar de você?", "answer": "..."},
    {"question": "Por que comprar agora?", "answer": "..."},
    {"question": "Por que vai se ferrar se não comprar?", "answer": "..."},
    {"question": "Por que eu sou a pessoa indicada?", "answer": "..."},
    {"question": "Por que estou entregando mais por menos?", "answer": "..."}
  ],
  "pitch": "Texto completo do pitch (3-5 parágrafos) compilando as 5 respostas num discurso vendedor fluido, coerente com a voz e o território do criador"
}`;

  const user = `Crie o pitch de vendas para essa oferta, respeitando todo o contexto estratégico.`;
  return { system, user };
}

export function pitchFinalPrompt(
  ctx: StrategyContext,
  oferta: Offer,
  answers: { question: string; answer: string }[]
) {
  const strategyBlock = formatStrategyContext(ctx);

  const system = `Você é um copywriter especialista. Dadas as respostas refinadas pelo usuário, gere o pitch final vendedor.

CONTEXTO ESTRATÉGICO COMPLETO DO CRIADOR:
${strategyBlock}

OFERTA:
${formatOferta(oferta)}

RESPOSTAS DO USUÁRIO (já refinadas — fonte da verdade):
${answers.map((a, i) => `${i + 1}. ${a.question}\n${a.answer}`).join("\n\n")}

${REGRAS_GERAIS}
6. As respostas do usuário acima são fonte da verdade — não contradiga, não invente nada que não esteja lá ou no contexto estratégico.

Gere APENAS o texto final do pitch (3-5 parágrafos, fluido, persuasivo, na VOZ do criador, sem JSON, sem markdown). Comece direto pelo hook.`;

  return { system, user: "Gere o pitch final." };
}
