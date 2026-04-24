import type { ICP, User } from "@/types";
import { formatUserContext } from "./_user-context";

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
  icp: ICP,
  product: string,
  differentiator: string,
  priceRange: string,
  creator?: Partial<User> | null
): { system: string; user: string } {
  const userCtx = formatUserContext(creator);
  const system = `Você é um especialista em construção de ofertas irresistíveis para Instagram e digital.

Construa uma oferta completa com base no ICP (público-alvo) e nos dados do produto/serviço.
${userCtx}

COMPONENTES DA OFERTA (todos obrigatórios):
- core_promise: o que entrego (promessa principal, resultado concreto)
- bonuses: lista de 3-5 bônus que atacam objeções específicas
- scarcity: escassez e urgência genuína (vagas, prazo, disponibilidade)
- guarantee: garantia que reverte o risco
- method_name: nome forte pro método (ex: "Método 90/10", "Blueprint 7 Dígitos")
- dream: o sonho do cliente (qual resultado ele quer)
- success_proofs: lista de 3-5 provas/garantias (depoimentos, dados, autoridade)
- time_to_result: em quanto tempo o cliente vê resultado
- effort_level: o que o cliente precisa fazer / sacrificar

PERFIL DO PÚBLICO (ICP):
${formatICP(icp)}

PRODUTO/SERVIÇO: ${product}
DIFERENCIAL: ${differentiator}
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
  "method_name": "...",
  "summary": "Resumo em 3 bullets da oferta completa"
}`;

  const user = `Gere a oferta completa pro ${product}`;

  return { system, user };
}
