import type { User } from "@/types";

/**
 * Formata o contexto do usuário (criador) pra injetar em prompts.
 * Se não tem dados suficientes, retorna string vazia.
 */
export function formatUserContext(
  user: Partial<User> | null | undefined
): string {
  if (!user?.atividade && !user?.atividade_descricao) return "";
  const atividade = user.atividade || "";
  const desc = user.atividade_descricao || "";
  return `
PERFIL DO CRIADOR (quem está produzindo o conteúdo):
- Atividade: ${atividade}
- O que resolve: ${desc}

Importante: toda a análise deve ser feita SOB A LENTE dessa atividade.
Dores, desejos e objeções devem estar relacionados ao problema que esse criador resolve.`;
}
