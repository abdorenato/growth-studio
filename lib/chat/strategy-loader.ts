// Carrega TUDO que o aluno ja tem na plataforma e formata pra injetar
// no system prompt do iAbdo. Cada modulo eh OPCIONAL — carrega em paralelo
// e mostra so o que existe. Nao bail-out se faltar algum (ex: tem voz mas
// nao tem ICP ainda — voz vai mesmo assim).

import { createClient } from "@/lib/supabase/server";
import type { ChatSession } from "./types";
import type { MapaVoz } from "@/types";

type AlunoContext = {
  resumo: string;
  hasData: boolean;
};

export async function loadAlunoContextForChat(
  session: ChatSession
): Promise<AlunoContext> {
  if (!session.user_id) {
    return { resumo: "", hasData: false };
  }

  try {
    const supabase = await createClient();
    const userId = session.user_id;

    // Carrega TODOS os modulos em paralelo, cada um opcional
    const [
      userResp,
      vozResp,
      icpResp,
      posResp,
      terResp,
      edsResp,
    ] = await Promise.all([
      supabase
        .from("users")
        .select("name, instagram, atividade, atividade_descricao, oferta_em_foco_id")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("vozes")
        .select("arquetipo_primario, arquetipo_secundario, mapa_voz")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("icps")
        .select("name, niche, pain_points, desires, objections")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("posicionamentos")
        .select("frase, resultado, mecanismo_nome, mecanismo_descricao, diferencial_frase, frase_apoio")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("territorios")
        .select(
          "dominio, ancora_mental, lente, manifesto, tese, expansao, fronteiras, fronteiras_positivas, areas_atuacao"
        )
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("editorias")
        .select("nome, tipo_objetivo, objetivo, descricao")
        .eq("user_id", userId),
    ]);

    const user = userResp.data;
    if (!user) return { resumo: "", hasData: false };

    // Oferta em foco (se tiver)
    let oferta: {
      name?: string;
      core_promise?: string;
      method_name?: string;
      dream?: string;
    } | null = null;
    if (user.oferta_em_foco_id) {
      const { data: ofData } = await supabase
        .from("ofertas")
        .select("name, core_promise, method_name, dream")
        .eq("id", user.oferta_em_foco_id)
        .maybeSingle();
      oferta = ofData;
    }

    // Monta o bloco com SO o que existe
    const blocks: string[] = [];

    // Quem é (sempre)
    blocks.push("QUEM É:");
    blocks.push(`- Nome: ${user.name || "—"}`);
    if (user.instagram) blocks.push(`- @: @${user.instagram}`);
    if (user.atividade) blocks.push(`- Atividade: ${user.atividade}`);
    if (user.atividade_descricao)
      blocks.push(`- O que resolve: ${user.atividade_descricao}`);

    // Voz (se tiver)
    const mapaVoz = (vozResp.data?.mapa_voz as MapaVoz | undefined) || null;
    if (mapaVoz) {
      blocks.push("\nVOZ DA MARCA (já gerada):");
      blocks.push(
        `- Arquétipos: ${vozResp.data?.arquetipo_primario || "?"} + ${vozResp.data?.arquetipo_secundario || "?"}`
      );
      blocks.push(`- Energia: ${mapaVoz.energia_arquetipica}`);
      blocks.push(`- Tom: ${mapaVoz.tom_de_voz}`);
      blocks.push(`- Frase essência: "${mapaVoz.frase_essencia}"`);
      blocks.push(`- Frase impacto: "${mapaVoz.frase_impacto}"`);
      if (mapaVoz.palavras_usar?.length)
        blocks.push(`- Palavras a USAR: ${mapaVoz.palavras_usar.join(", ")}`);
      if (mapaVoz.palavras_evitar?.length)
        blocks.push(`- Palavras a EVITAR: ${mapaVoz.palavras_evitar.join(", ")}`);
    }

    // ICP (se tiver)
    const icp = icpResp.data;
    if (icp) {
      blocks.push("\nICP (cliente ideal já gerado):");
      blocks.push(`- Nome: ${icp.name}`);
      blocks.push(`- Nicho: ${icp.niche}`);
      if (Array.isArray(icp.pain_points) && icp.pain_points.length)
        blocks.push(
          `- Top dores: ${icp.pain_points.slice(0, 3).join(" | ")}`
        );
      if (Array.isArray(icp.desires) && icp.desires.length)
        blocks.push(`- Top desejos: ${icp.desires.slice(0, 3).join(" | ")}`);
      if (Array.isArray(icp.objections) && icp.objections.length)
        blocks.push(
          `- Top objeções: ${icp.objections.slice(0, 3).join(" | ")}`
        );
    }

    // Posicionamento (se tiver)
    const pos = posResp.data;
    if (pos?.frase) {
      blocks.push("\nPOSICIONAMENTO (já gerado):");
      blocks.push(`- Declaração: "${pos.frase}"`);
      if (pos.frase_apoio) blocks.push(`- Frase apoio: "${pos.frase_apoio}"`);
      if (pos.resultado) blocks.push(`- Resultado: ${pos.resultado}`);
      if (pos.mecanismo_nome) blocks.push(`- Método: ${pos.mecanismo_nome}`);
      if (pos.diferencial_frase) blocks.push(`- Diferencial: ${pos.diferencial_frase}`);
    }

    // Território (se tiver)
    const ter = terResp.data;
    if (ter && (ter.dominio || ter.ancora_mental || ter.tese)) {
      blocks.push("\nTERRITÓRIO (já gerado):");
      if (ter.dominio) blocks.push(`- Domínio: ${ter.dominio}`);
      if (ter.ancora_mental)
        blocks.push(`- Âncora mental: "${ter.ancora_mental}"`);
      if (ter.lente) blocks.push(`- Lente: ${ter.lente}`);
      if (ter.tese) blocks.push(`- Tese: "${ter.tese}"`);
      if (ter.expansao) blocks.push(`- Expansão: ${ter.expansao}`);
      if (Array.isArray(ter.fronteiras) && ter.fronteiras.length)
        blocks.push(
          `- Fronteiras NEGATIVAS (não falar sobre): ${ter.fronteiras.join(", ")}`
        );
      if (
        Array.isArray(ter.fronteiras_positivas) &&
        ter.fronteiras_positivas.length
      )
        blocks.push(
          `- Fronteiras POSITIVAS (defende): ${ter.fronteiras_positivas.join(", ")}`
        );
      if (Array.isArray(ter.areas_atuacao) && ter.areas_atuacao.length)
        blocks.push(`- Áreas de atuação: ${ter.areas_atuacao.join(" | ")}`);
    }

    // Editorias (se tiver)
    const editorias = edsResp.data || [];
    if (editorias.length > 0) {
      blocks.push(`\nEDITORIAS (${editorias.length} pilares já gerados):`);
      editorias.forEach((e, i) => {
        blocks.push(
          `${i + 1}. ${e.nome} (${e.tipo_objetivo || "?"}) — ${e.objetivo || ""}`
        );
      });
    }

    // Oferta em foco (se tiver)
    if (oferta) {
      blocks.push("\nOFERTA EM FOCO (atual):");
      if (oferta.name) blocks.push(`- Nome: ${oferta.name}`);
      if (oferta.core_promise) blocks.push(`- Promessa: ${oferta.core_promise}`);
      if (oferta.method_name) blocks.push(`- Método: ${oferta.method_name}`);
      if (oferta.dream) blocks.push(`- Sonho: ${oferta.dream}`);
    }

    return { resumo: blocks.join("\n"), hasData: true };
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
