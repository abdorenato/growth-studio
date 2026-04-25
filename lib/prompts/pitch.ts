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

// ─────────────────────────────────────────────────────────────────────────────
// ELEVATOR PITCH — versao curta, ~30s falados (70-100 palavras)
// ─────────────────────────────────────────────────────────────────────────────
export function elevatorPitchPrompt(
  ctx: StrategyContext,
  oferta: Offer,
  pitchText: string
) {
  const strategyBlock = formatStrategyContext(ctx);

  const system = `Você é um copywriter especialista em comunicação de alto impacto.

Sua tarefa: comprimir o pitch completo abaixo num ELEVATOR PITCH — texto curto pra falar em voz alta em 30 segundos (70-100 palavras), suficiente pra alguém entender quem é o criador, o que ele resolve, pra quem, e por que vale ouvir.

CONTEXTO ESTRATÉGICO COMPLETO DO CRIADOR:
${strategyBlock}

OFERTA:
${formatOferta(oferta)}

PITCH COMPLETO (fonte da verdade — o elevator é uma compressão dele, não algo novo):
"""
${pitchText}
"""

${REGRAS_GERAIS}
6. NÃO invente nada que não esteja no pitch acima ou no contexto estratégico.
7. NÃO seja genérico ("ajudo pessoas a alcançarem seus objetivos"). Seja específico ao território/posicionamento.
8. Peso máximo na ÂNCORA MENTAL e na TESE — é o que cola na cabeça.

ESTRUTURA DO ELEVATOR (siga essa ordem mental, não use labels):
1. Quem é o criador (1 frase, ancorada no posicionamento)
2. O que ele resolve / pra quem (1 frase, ancorada na dor do ICP)
3. O que torna ele diferente (1 frase, ancorada na tese/lente do território)
4. Convite pra próximo passo (1 frase, leve — não vendedor agressivo)

LIMITES:
- 70 a 100 palavras. NÃO ultrapasse.
- Texto corrido (sem bullets, sem markdown, sem emojis).
- Comece direto, sem "Olá, eu sou..." (parece script).
- Termine com um convite/abertura — não com call-to-action de venda.

Responda APENAS com o texto do elevator pitch. Nada antes, nada depois.`;

  return { system, user: "Gere o elevator pitch." };
}

// ─────────────────────────────────────────────────────────────────────────────
// CARTA DE VENDAS — long form, base pra email longo ou roteiro de VSL
// ─────────────────────────────────────────────────────────────────────────────
export function cartaVendasPrompt(
  ctx: StrategyContext,
  oferta: Offer,
  pitchText: string
) {
  const strategyBlock = formatStrategyContext(ctx);

  const system = `Você é um copywriter direct response especialista em cartas de vendas longas (estilo Gary Halbert / Gary Bencivenga / Eugene Schwartz aplicado ao digital).

Sua tarefa: expandir o pitch abaixo numa CARTA DE VENDAS longa, que serve como base pra:
- Email longo de vendas
- Roteiro de VSL (Video Sales Letter)
- Página de vendas long-form

CONTEXTO ESTRATÉGICO COMPLETO DO CRIADOR:
${strategyBlock}

OFERTA:
${formatOferta(oferta)}

PITCH BASE (a carta deve manter EXATAMENTE a mesma promessa, ângulo e voz — só expande):
"""
${pitchText}
"""

${REGRAS_GERAIS}
6. NÃO invente história pessoal, métricas, depoimentos, números de alunos/clientes, certificações ou prêmios. Use só o que está no contexto.
7. Se faltar prova concreta, prefira mecanismo lógico (ex: "porque quando você faz X, Y acontece") em vez de inventar prova social.
8. Coerente com a TESE e ÂNCORA MENTAL do território — a carta é a versão expandida do mesmo argumento.

ESTRUTURA OBRIGATÓRIA (use os blocos abaixo, sem cabeçalhos visíveis — texto fluido):

1. **HOOK / Lead** (1-2 parágrafos):
   Abre com a dor do ICP ou um insight contraintuitivo da tese do território. Faz o leitor pensar "isso é comigo".

2. **Problema amplificado** (2-3 parágrafos):
   Mostra que o leitor já tentou as soluções óbvias e por que não funcionaram. Usa as DORES e OBJEÇÕES do ICP.

3. **Reposicionamento** (1-2 parágrafos):
   Apresenta a NOVA forma de ver o problema (a tese do território). É o "aha moment" — o leitor enxerga diferente.

4. **Apresentação do método/oferta** (2-3 parágrafos):
   Usa o nome do método EXATAMENTE como está em method_name (se vazio, fala do método sem nomear). Explica como ele resolve o que as soluções óbvias não resolvem. Conecta com o core_promise.

5. **Mecanismo / por que funciona** (2 parágrafos):
   Explica logicamente por que o método funciona — peso na lógica do mecanismo, não em prova social inventada.

6. **Bônus + Garantia** (1-2 parágrafos):
   Lista os bônus reais da oferta + garantia. Reverte risco.

7. **Escassez / urgência** (1 parágrafo):
   Usa a escassez real da oferta (vagas, prazo). Sem deadline fake.

8. **Fechamento + CTA** (1-2 parágrafos):
   Resume a transformação prometida. Convida pra próxima ação. Sem clichês ("não perca essa oportunidade única").

LIMITES:
- 800 a 1500 palavras (suficiente pra VSL de 8-12 minutos).
- Texto corrido em parágrafos. Pode usar quebras de linha entre blocos pra respiração.
- SEM markdown, SEM bullets visíveis no texto final, SEM cabeçalhos numerados.
- Linguagem na VOZ DA MARCA (palavras a usar, palavras a evitar).
- Tom de carta pessoal — escrita pra UMA pessoa do ICP, não pra "vocês".

Responda APENAS com o texto da carta de vendas. Nada antes, nada depois.`;

  return { system, user: "Gere a carta de vendas." };
}
