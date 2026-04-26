// Carrega TUDO que o aluno ja tem na plataforma e formata pra injetar
// no system prompt do iAbdo. Usado no engine antes de chamar Claude.

import { createClient } from "@/lib/supabase/server";
import { fetchStrategyContext } from "@/lib/db/strategy-context";
import type { ChatSession } from "./types";

type AlunoContext = {
  resumo: string; // bloco pronto pra colar no system prompt
  hasData: boolean;
};

/**
 * Carrega o que o aluno ja tem na plataforma e formata pra system prompt.
 * Retorna string vazia (e hasData=false) se aluno nao tem nada salvo OU
 * se a sessao nao tem user_id linkado.
 */
export async function loadAlunoContextForChat(
  session: ChatSession
): Promise<AlunoContext> {
  if (!session.user_id) {
    return { resumo: "", hasData: false };
  }

  try {
    const supabase = await createClient();

    // Pega primeiro ICP do user (se tiver multiplos, usa o mais antigo)
    const { data: icpRow } = await supabase
      .from("icps")
      .select("id")
      .eq("user_id", session.user_id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!icpRow) {
      // Sem ICP, ainda assim tenta carregar info basica do User
      const { data: userRow } = await supabase
        .from("users")
        .select("name, atividade, atividade_descricao, instagram")
        .eq("id", session.user_id)
        .maybeSingle();

      if (!userRow) return { resumo: "", hasData: false };

      const lines = [
        `\n═══════════════════════════════════════════`,
        `DADOS QUE VOCE JA TEM SOBRE ESSE ALUNO`,
        `═══════════════════════════════════════════`,
        `Nome: ${userRow.name || "—"}`,
        userRow.instagram ? `Instagram: @${userRow.instagram}` : "",
        userRow.atividade ? `Atividade: ${userRow.atividade}` : "",
        userRow.atividade_descricao
          ? `O que resolve: ${userRow.atividade_descricao}`
          : "",
        `\nESTE ALUNO AINDA NAO TEM DADOS ESTRATEGICOS NA PLATAFORMA.`,
        `Use o nome dele e ajude do zero.`,
      ].filter(Boolean);

      return { resumo: lines.join("\n"), hasData: true };
    }

    // Tem ICP — carrega contexto completo + editorias
    const ctx = await fetchStrategyContext(session.user_id, icpRow.id, {
      atrelarOferta: true,
    });
    if (!ctx) return { resumo: "", hasData: false };

    // Carrega TODAS editorias do user (fetchStrategyContext so pega 1 por id)
    const { data: edsData } = await supabase
      .from("editorias")
      .select("nome, tipo_objetivo, objetivo, descricao")
      .eq("user_id", session.user_id);

    return {
      resumo: formatAlunoContextForPrompt(ctx, edsData || []),
      hasData: true,
    };
  } catch (err) {
    console.error("loadAlunoContextForChat erro:", err);
    return { resumo: "", hasData: false };
  }
}

// Formato amigavel pro system prompt — diferente do formatStrategyContext
// que é pros prompts dos modulos (esses sao formularios). Aqui é pra leitura
// conversacional do iAbdo.
function formatAlunoContextForPrompt(
  ctx: NonNullable<Awaited<ReturnType<typeof fetchStrategyContext>>>,
  editorias: Array<{
    nome: string;
    tipo_objetivo?: string;
    objetivo?: string;
    descricao?: string;
  }>
): string {
  const blocks: string[] = [
    `\n═══════════════════════════════════════════`,
    `DADOS QUE VOCE JA TEM SOBRE ESSE ALUNO`,
    `(use isso pra contextualizar — NAO peca de novo o que ja sabe)`,
    `═══════════════════════════════════════════`,
  ];

  // Quem é
  const c = ctx.creator;
  if (c) {
    blocks.push(`\nQUEM É:`);
    if (c.name) blocks.push(`- Nome: ${c.name}`);
    if (c.instagram) blocks.push(`- @: @${c.instagram}`);
    if (c.atividade) blocks.push(`- Atividade: ${c.atividade}`);
    if (c.atividade_descricao)
      blocks.push(`- O que resolve: ${c.atividade_descricao}`);
  }

  // ICP
  blocks.push(`\nICP (cliente ideal):`);
  blocks.push(`- Nome: ${ctx.icp.name}`);
  blocks.push(`- Nicho: ${ctx.icp.niche}`);
  if (ctx.icp.pain_points?.length)
    blocks.push(`- Top dores: ${ctx.icp.pain_points.slice(0, 3).join(" | ")}`);
  if (ctx.icp.desires?.length)
    blocks.push(`- Top desejos: ${ctx.icp.desires.slice(0, 3).join(" | ")}`);

  // Voz
  if (ctx.mapaVoz) {
    blocks.push(`\nVOZ DA MARCA (já gerada):`);
    blocks.push(`- Energia: ${ctx.mapaVoz.energia_arquetipica}`);
    blocks.push(`- Tom: ${ctx.mapaVoz.tom_de_voz}`);
    blocks.push(`- Frase essência: "${ctx.mapaVoz.frase_essencia}"`);
    if (ctx.mapaVoz.palavras_usar?.length)
      blocks.push(`- Palavras a usar: ${ctx.mapaVoz.palavras_usar.join(", ")}`);
    if (ctx.mapaVoz.palavras_evitar?.length)
      blocks.push(`- Palavras a evitar: ${ctx.mapaVoz.palavras_evitar.join(", ")}`);
  }

  // Posicionamento
  if (ctx.posicionamento?.frase) {
    blocks.push(`\nPOSICIONAMENTO (já gerado):`);
    blocks.push(`- Declaração: "${ctx.posicionamento.frase}"`);
    if (ctx.posicionamento.resultado)
      blocks.push(`- Resultado: ${ctx.posicionamento.resultado}`);
    if (ctx.posicionamento.mecanismo_nome)
      blocks.push(`- Método: ${ctx.posicionamento.mecanismo_nome}`);
    if (ctx.posicionamento.diferencial_frase)
      blocks.push(`- Diferencial: ${ctx.posicionamento.diferencial_frase}`);
  }

  // Território
  if (ctx.territorio?.dominio || ctx.territorio?.ancora_mental) {
    blocks.push(`\nTERRITÓRIO (já gerado):`);
    if (ctx.territorio.dominio)
      blocks.push(`- Domínio: ${ctx.territorio.dominio}`);
    if (ctx.territorio.ancora_mental)
      blocks.push(`- Âncora mental: "${ctx.territorio.ancora_mental}"`);
    if (ctx.territorio.lente)
      blocks.push(`- Lente: ${ctx.territorio.lente}`);
    if (ctx.territorio.tese) blocks.push(`- Tese: "${ctx.territorio.tese}"`);
    if (ctx.territorio.expansao)
      blocks.push(`- Expansão: ${ctx.territorio.expansao}`);
    if (ctx.territorio.fronteiras?.length)
      blocks.push(
        `- Fronteiras NEGATIVAS (NÃO falar sobre): ${ctx.territorio.fronteiras.join(", ")}`
      );
    if (ctx.territorio.fronteiras_positivas?.length)
      blocks.push(
        `- Fronteiras POSITIVAS (defende): ${ctx.territorio.fronteiras_positivas.join(", ")}`
      );
    if (ctx.territorio.areas_atuacao?.length)
      blocks.push(
        `- Áreas de atuação: ${ctx.territorio.areas_atuacao.join(" | ")}`
      );
  }

  // Editorias
  if (editorias.length > 0) {
    blocks.push(`\nEDITORIAS (5 pilares já gerados):`);
    editorias.forEach((e, i) => {
      blocks.push(
        `${i + 1}. ${e.nome} (${e.tipo_objetivo || "?"}) — ${e.objetivo || ""}`
      );
    });
  }

  // Oferta em foco
  if (ctx.oferta) {
    blocks.push(`\nOFERTA EM FOCO (atual):`);
    blocks.push(`- Nome: ${ctx.oferta.name || "—"}`);
    if (ctx.oferta.core_promise)
      blocks.push(`- Promessa: ${ctx.oferta.core_promise}`);
    if (ctx.oferta.method_name)
      blocks.push(`- Método: ${ctx.oferta.method_name}`);
    if (ctx.oferta.dream)
      blocks.push(`- Sonho do cliente: ${ctx.oferta.dream}`);
  }

  blocks.push(
    `\n═══════════════════════════════════════════`,
    `INSTRUCAO: quando o aluno pedir um modulo cuja dado ja existe acima,`,
    `NAO peca de novo. Diga "vejo que voce ja tem [X], vou usar isso..." e`,
    `pule a coleta. Se algo nao tem, ai sim coleta. Sempre coerente com a`,
    `voz e fronteiras dele.`
  );

  return blocks.join("\n");
}
