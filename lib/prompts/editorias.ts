import type { ICP, MapaVoz, User } from "@/types";
import { formatICP } from "./oferta";
import { formatUserContext } from "./_user-context";
import { OBJETIVOS, type TipoObjetivo } from "@/lib/editorias/constants";

type TerritorioCtx = {
  nome?: string;
  lente?: string;
  manifesto?: string;
  fronteiras?: string[];
} | null;

type PosicionamentoCtx = {
  frase?: string;
} | null;

function buildContext(
  creator: Partial<User> | null | undefined,
  icp: ICP,
  mapaVoz: MapaVoz | null,
  posicionamento: PosicionamentoCtx,
  territorio: TerritorioCtx
) {
  const userCtx = formatUserContext(creator);
  const vozCtx = mapaVoz
    ? `\nVOZ:
- Energia: ${mapaVoz.energia_arquetipica}
- Tom: ${mapaVoz.tom_de_voz}`
    : "";

  const posCtx = posicionamento?.frase
    ? `\nPOSICIONAMENTO: "${posicionamento.frase}"`
    : "";

  const terCtx = territorio?.nome
    ? `\nTERRITÓRIO:
- Tema: ${territorio.nome}
- Lente: ${territorio.lente || ""}
- Manifesto: "${territorio.manifesto || ""}"
- Fronteiras (NÃO falo sobre): ${(territorio.fronteiras || []).join(", ")}`
    : "";

  return `${userCtx}

ICP:
${formatICP(icp)}
${vozCtx}${posCtx}${terCtx}`;
}

// ─── GERAR 5 EDITORIAS (uma por objetivo) ─────────────────────────────────

export function generateEditoriasPrompt(
  creator: Partial<User> | null | undefined,
  icp: ICP,
  mapaVoz: MapaVoz | null,
  posicionamento: PosicionamentoCtx,
  territorio: TerritorioCtx
) {
  const ctx = buildContext(creator, icp, mapaVoz, posicionamento, territorio);

  const objetivosInstr = Object.entries(OBJETIVOS)
    .map(
      ([key, obj]) =>
        `- ${key} (${obj.label}): ${obj.desc} Exemplos de nome: ${obj.exemplos.join(", ")}`
    )
    .join("\n");

  const system = `Você é estrategista editorial de marca pessoal.

Gere 5 EDITORIAS (pilares de conteúdo recorrentes) pro criador. Cada uma cobre um dos 5 objetivos estratégicos abaixo.

OS 5 OBJETIVOS:
${objetivosInstr}

REGRAS:
- Exatamente 5 editorias, 1 de cada tipo (autoridade, conectar, provocar, prova, converter)
- Cada editoria tem:
  - "nome" (2-4 palavras, identitário, puxa do território)
  - "tipo_objetivo" (um dos 5: autoridade|conectar|provocar|prova|converter)
  - "objetivo" (frase de 1 linha explicando o que essa editoria faz estrategicamente na vida do criador)
  - "descricao" (1-2 frases sobre o QUE ela cobre de tema)
- Nomes específicos do território, NÃO genéricos
- Respeite as fronteiras (não proponha editoria que fala do que o criador recusa)
- O nome da editoria "Converter" deve ser CHAMADO — não "Vendas" (muito cru)

${ctx}

Responda EXCLUSIVAMENTE com JSON na ordem dos 5 objetivos:
{
  "editorias": [
    {"nome": "...", "tipo_objetivo": "autoridade", "objetivo": "...", "descricao": "..."},
    {"nome": "...", "tipo_objetivo": "conectar", "objetivo": "...", "descricao": "..."},
    {"nome": "...", "tipo_objetivo": "provocar", "objetivo": "...", "descricao": "..."},
    {"nome": "...", "tipo_objetivo": "prova", "objetivo": "...", "descricao": "..."},
    {"nome": "...", "tipo_objetivo": "converter", "objetivo": "...", "descricao": "..."}
  ]
}`;

  return { system, user: "Gere as 5 editorias." };
}

// ─── REGERAR UMA EDITORIA ESPECÍFICA ──────────────────────────────────────

export function regenerateOneEditoriaPrompt(
  creator: Partial<User> | null | undefined,
  icp: ICP,
  mapaVoz: MapaVoz | null,
  posicionamento: PosicionamentoCtx,
  territorio: TerritorioCtx,
  tipoObjetivo: TipoObjetivo,
  nomeAnterior?: string
) {
  const ctx = buildContext(creator, icp, mapaVoz, posicionamento, territorio);
  const obj = OBJETIVOS[tipoObjetivo];

  const system = `Você é estrategista editorial.

Gere 1 EDITORIA alternativa pro objetivo abaixo. Diferente da anterior, com nome fresco.

OBJETIVO: ${tipoObjetivo} (${obj.label})
FUNÇÃO: ${obj.desc}
EXEMPLOS DE NOME: ${obj.exemplos.join(", ")}

${nomeAnterior ? `NOME ANTERIOR (NÃO repita): ${nomeAnterior}` : ""}

REGRAS:
- Nome 2-4 palavras, identitário, puxa do território
- Respeite as fronteiras
- Tom da voz do criador

${ctx}

Responda EXCLUSIVAMENTE com JSON:
{
  "nome": "...",
  "tipo_objetivo": "${tipoObjetivo}",
  "objetivo": "...",
  "descricao": "..."
}`;

  return { system, user: "Gere 1 editoria alternativa." };
}
