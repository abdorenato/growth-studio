import type { StrategyContext } from "@/lib/db/strategy-context";
import { formatICP } from "./oferta";
import { formatUserContext } from "./_user-context";

/**
 * Monta o bloco de contexto estratégico completo pra enviar pro LLM.
 * Usado em TODOS os prompts que geram conteúdo (Monoflow, Ideias, etc).
 */
export function formatStrategyContext(ctx: StrategyContext): string {
  const userCtx = formatUserContext(ctx.creator);

  const vozBlock = ctx.mapaVoz
    ? `\nVOZ DA MARCA:
- Energia: ${ctx.mapaVoz.energia_arquetipica}
- Tom: ${ctx.mapaVoz.tom_de_voz}
- Frase de essência: "${ctx.mapaVoz.frase_essencia}"
- Frase de impacto: "${ctx.mapaVoz.frase_impacto}"
- Palavras usadas: ${(ctx.mapaVoz.palavras_usar || []).join(", ")}
- Palavras evitadas: ${(ctx.mapaVoz.palavras_evitar || []).join(", ")}`
    : "";

  const posBlock = ctx.posicionamento?.frase
    ? `\nPOSICIONAMENTO:
- Frase completa: "${ctx.posicionamento.frase}"
- Resultado entregue: ${ctx.posicionamento.resultado || ""}
- Método: ${ctx.posicionamento.mecanismo_nome || ""}
- Diferencial: ${ctx.posicionamento.diferencial_frase || ""}`
    : "";

  const terBlock = ctx.territorio?.dominio || ctx.territorio?.ancora_mental
    ? `\nTERRITÓRIO (universo que o criador domina):
- Domínio (descritivo): ${ctx.territorio?.dominio || ""}
- Âncora mental: "${ctx.territorio?.ancora_mental || ""}"
- Lente: ${ctx.territorio?.lente || ""}
- Tese: "${ctx.territorio?.tese || ctx.territorio?.manifesto || ""}"
${ctx.territorio?.expansao ? `- Expansão: ${ctx.territorio.expansao}` : ""}
- FRONTEIRAS NEGATIVAS (nunca falar sobre): ${(ctx.territorio?.fronteiras || []).join(", ")}
${ctx.territorio?.fronteiras_positivas?.length ? `- FRONTEIRAS POSITIVAS (o que defende): ${ctx.territorio.fronteiras_positivas.join(", ")}` : ""}
${ctx.territorio?.areas_atuacao?.length ? `- ÁREAS DE ATUAÇÃO (onde vira negócio): ${ctx.territorio.areas_atuacao.join(" | ")}` : ""}`
    : "";

  const edBlock = ctx.editoria
    ? `\nEDITORIA (pilar recorrente que essa peça pertence):
- Nome: ${ctx.editoria.nome}
- Objetivo estratégico: ${ctx.editoria.objetivo || ""}
- O que cobre: ${ctx.editoria.descricao || ""}
- Tipo: ${ctx.editoria.tipo_objetivo || ""}`
    : "";

  const ofBlock = ctx.oferta
    ? `\nOFERTA EM FOCO (conteúdo aquece/vende esta oferta):
- Nome: ${ctx.oferta.name || ""}
- Promessa: ${ctx.oferta.core_promise || ""}
- Método: ${ctx.oferta.method_name || ""}
- Transformação: ${ctx.oferta.dream || ""}
${ctx.oferta.bonuses?.length ? `- Bônus: ${ctx.oferta.bonuses.join(" | ")}` : ""}
${ctx.oferta.scarcity ? `- Urgência: ${ctx.oferta.scarcity}` : ""}
${ctx.oferta.guarantee ? `- Garantia: ${ctx.oferta.guarantee}` : ""}

Tom: o conteúdo deve criar curiosidade/autoridade/desejo pela oferta sem ser explicitamente comercial.`
    : `\nMODO LIVRE (conteúdo NÃO está atrelado a oferta):
- Foco em construir autoridade, posicionar e conectar
- Nada de CTA comercial
- CTA (se houver) é pra engajamento: comentar, salvar, compartilhar`;

  return `${userCtx}

ICP:
${formatICP(ctx.icp)}
${vozBlock}${posBlock}${terBlock}${edBlock}${ofBlock}`;
}
