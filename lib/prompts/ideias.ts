import type { ICP, MapaVoz, User } from "@/types";
import { formatICP } from "./oferta";
import { formatUserContext } from "./_user-context";
import { OBJETIVOS, type TipoObjetivo } from "@/lib/editorias/constants";

type Editoria = {
  nome: string;
  tipo_objetivo?: string;
  objetivo?: string;
  descricao?: string;
};

type TerritorioCtx = {
  nome?: string;
  lente?: string;
  manifesto?: string;
  fronteiras?: string[];
} | null;

type OfferCtx = {
  name?: string;
  core_promise?: string;
  method_name?: string;
  dream?: string;
} | null;

export function ideiasPrompt(
  icp: ICP,
  mapaVoz: MapaVoz | null,
  editoria: Editoria,
  territorio: TerritorioCtx,
  offer: OfferCtx,
  count = 5,
  creator?: Partial<User> | null
) {
  const userCtx = formatUserContext(creator);

  const vozContext = mapaVoz
    ? `\nVOZ DA MARCA:
- Energia: ${mapaVoz.energia_arquetipica}
- Tom: ${mapaVoz.tom_de_voz}
- Frase de essência: "${mapaVoz.frase_essencia}"
- Palavras usadas: ${(mapaVoz.palavras_usar || []).join(", ")}`
    : "";

  const territorioContext = territorio?.nome
    ? `\nTERRITÓRIO:
- Tema: ${territorio.nome}
- Manifesto: "${territorio.manifesto || ""}"
- Fronteiras (NUNCA fale sobre isso): ${(territorio.fronteiras || []).join(", ")}`
    : "";

  const tipoInfo = editoria.tipo_objetivo
    ? OBJETIVOS[editoria.tipo_objetivo as TipoObjetivo]
    : null;

  const editoriaContext = `\nEDITORIA (essa é a âncora das ideias — todas devem pertencer a essa editoria):
- Nome: ${editoria.nome}
- Objetivo estratégico: ${editoria.objetivo || ""}
- O que cobre: ${editoria.descricao || ""}
- Tipo de objetivo: ${tipoInfo ? `${tipoInfo.label} — ${tipoInfo.desc}` : editoria.tipo_objetivo || ""}`;

  // Oferta entra só se for editoria de Converter ou Prova; senão, ignora
  const usaOferta =
    offer &&
    (editoria.tipo_objetivo === "converter" ||
      editoria.tipo_objetivo === "prova");

  const offerContext = usaOferta
    ? `\nOFERTA EM FOCO (relevante pra essa editoria):
- Nome: ${offer.name || ""}
- Promessa: ${offer.core_promise || ""}
- Método: ${offer.method_name || ""}
- Transformação: ${offer.dream || ""}`
    : "";

  const system = `Você é um estrategista de conteúdo para Instagram especializado em carrosséis virais.

Gere ${count} IDEIAS de carrosséis DENTRO DA EDITORIA abaixo. Todas as ideias precisam:
- Pertencer ao objetivo estratégico da editoria (não misturar com outros objetivos)
- Usar o território como pano de fundo
- Respeitar as fronteiras (não tocar em assuntos proibidos)
- Ter gancho forte (curiosidade, urgência, contraintuição)
- Ser acionáveis — não conceituais demais

${userCtx}
${editoriaContext}

ICP:
${formatICP(icp)}
${territorioContext}${vozContext}${offerContext}

Responda EXCLUSIVAMENTE com JSON:
{
  "ideas": [
    {
      "topic": "tema específico do carrossel",
      "hook": "frase de gancho do slide 1 (curiosidade/urgência)",
      "angle": "ângulo/abordagem da peça",
      "target_emotion": "emoção principal",
      "carousel_style": "educational|storytelling|listicle|myth_busting|before_after"
    }
  ]
}`;

  const user = `Gere ${count} ideias de carrosséis dentro da editoria "${editoria.nome}".`;

  return { system, user };
}
