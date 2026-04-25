import type { ICP } from "@/types";
import type { StrategyContext } from "@/lib/db/strategy-context";
import { formatStrategyContext } from "./_strategy-context";

export function formatICP(icp: ICP): string {
  return [
    `Nome: ${icp.name}`,
    `Nicho: ${icp.niche}`,
    `Demografia: ${JSON.stringify(icp.demographics || {})}`,
    `Dores: ${(icp.pain_points || []).join(", ")}`,
    `Desejos: ${(icp.desires || []).join(", ")}`,
    `Objeções: ${(icp.objections || []).join(", ")}`,
    `Estilo de linguagem: ${icp.language_style || ""}`,
    `Tom: ${(icp.tone_keywords || []).join(", ")}`,
  ].join("\n");
}

export function ofertaFullPrompt(
  ctx: StrategyContext,
  product: string,
  differentiator: string,
  priceRange: string
): { system: string; user: string } {
  const strategyBlock = formatStrategyContext(ctx);

  // Se o usuário já tem método cadastrado no posicionamento, usar esse.
  // Nunca inventar nome novo.
  const metodoExistente = ctx.posicionamento?.mecanismo_nome?.trim() || "";
  const metodoDescricao = ctx.posicionamento?.mecanismo_descricao?.trim() || "";

  const metodoBlock = metodoExistente
    ? `MÉTODO JÁ DEFINIDO PELO CRIADOR (use EXATAMENTE este nome — NÃO invente outro):
- method_name: "${metodoExistente}"
${metodoDescricao ? `- descrição: ${metodoDescricao}` : ""}`
    : `MÉTODO: o criador AINDA NÃO tem um método nomeado no posicionamento dele.
- Retorne method_name como string vazia ("").
- NÃO invente nome de método. Deixe pro criador nomear depois.`;

  const system = `Você é um especialista em construção de ofertas irresistíveis para Instagram e digital.

Construa uma oferta completa com base no contexto estratégico do criador (voz, posicionamento, território, ICP) e nos dados do produto/serviço.

CONTEXTO ESTRATÉGICO COMPLETO DO CRIADOR:
${strategyBlock}

${metodoBlock}

REGRAS GERAIS (NÃO QUEBRE):
1. NUNCA invente fatos sobre o criador (carreira, anos de experiência, clientes, número de alunos). Se não estiver no contexto acima, não cite.
2. NUNCA invente nome de método. Use a regra acima.
3. A oferta deve estar alinhada com o POSICIONAMENTO e o TERRITÓRIO do criador (mesma promessa, mesma lente, mesmas fronteiras).
4. A linguagem dos textos (core_promise, dream, summary) deve seguir a VOZ DA MARCA (palavras a usar, palavras a evitar, tom).
5. Se faltar informação concreta, prefira deixar curto e verdadeiro do que inventar.

COMPONENTES DA OFERTA (todos obrigatórios):
- core_promise: o que entrego (promessa principal, resultado concreto — alinhada ao posicionamento)
- bonuses: lista de 3-5 bônus que atacam objeções específicas do ICP
- scarcity: escassez e urgência genuína (vagas, prazo, disponibilidade)
- guarantee: garantia que reverte o risco
- method_name: ver regra acima — use o existente OU string vazia
- dream: o sonho do cliente (qual resultado ele quer)
- success_proofs: lista de 3-5 provas/garantias (apenas se forem genéricas tipo "metodologia testada"; NÃO invente números, depoimentos ou clientes)
- time_to_result: em quanto tempo o cliente vê resultado
- effort_level: o que o cliente precisa fazer / sacrificar

PRODUTO/SERVIÇO: ${product}
DIFERENCIAL DECLARADO PELO CRIADOR: ${differentiator}
FAIXA DE PREÇO: ${priceRange}

Responda EXCLUSIVAMENTE com JSON no formato:
{
  "name": "Nome interno da oferta (curto)",
  "core_promise": "...",
  "dream": "...",
  "success_proofs": ["...", "..."],
  "time_to_result": "...",
  "effort_level": "...",
  "bonuses": ["...", "..."],
  "scarcity": "...",
  "guarantee": "...",
  "method_name": "${metodoExistente}",
  "summary": "Resumo em 3 bullets da oferta completa"
}`;

  const user = `Gere a oferta completa pro ${product}, respeitando todo o contexto estratégico acima.`;

  return { system, user };
}
