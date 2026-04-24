import type { ICP, MapaVoz, User } from "@/types";
import { formatICP } from "./oferta";
import { formatUserContext } from "./_user-context";
import { LENTES, type LenteKey } from "@/lib/territorio/constants";

type Posicionamento = {
  frase?: string;
  resultado?: string;
  mecanismo_nome?: string;
  diferencial_frase?: string;
} | null;

function buildContext(
  creator: Partial<User> | null | undefined,
  icp: ICP,
  mapaVoz: MapaVoz | null,
  posicionamento: Posicionamento
) {
  const userCtx = formatUserContext(creator);
  const vozCtx = mapaVoz
    ? `\nVOZ:
- Energia: ${mapaVoz.energia_arquetipica}
- Tom: ${mapaVoz.tom_de_voz}
- Frase de essência: "${mapaVoz.frase_essencia}"`
    : "";

  const posCtx = posicionamento?.frase
    ? `\nPOSICIONAMENTO ATUAL:
"${posicionamento.frase}"`
    : "";

  return `${userCtx}

ICP:
${formatICP(icp)}
${vozCtx}${posCtx}`;
}

// ─── SUGERIR TEMAS ────────────────────────────────────────────────────────

export function suggestTemasPrompt(
  creator: Partial<User> | null | undefined,
  icp: ICP,
  mapaVoz: MapaVoz | null,
  posicionamento: Posicionamento
) {
  const ctx = buildContext(creator, icp, mapaVoz, posicionamento);

  const system = `Você é especialista em estratégia de marca e territórios de conteúdo.

Sugira 3 opções de TEMA (domínio temático) pra esse criador dominar como território.

REGRAS DE UM BOM TEMA:
- 2-5 palavras
- Amplo o suficiente pra ter o que dizer por anos
- Estreito o suficiente pra virar autoridade específica
- Coerente com a atividade real do criador
- Evite genérico ("Marketing Digital") e super nicho ("LinkedIn Ads pra SaaS B2B")

Exemplos bons:
- "Vendas Consultivas B2B"
- "Branding Pessoal pra Profissionais Técnicos"
- "Finanças Pessoais pra Casais"

Exemplos ruins:
- "Sucesso" (genérico demais)
- "Anúncios de Facebook pra lojas de óculos no Paraná" (nicho demais)

${ctx}

Responda EXCLUSIVAMENTE com JSON:
{
  "options": [
    {"tema": "...", "por_que": "breve explicação de por que encaixa"},
    {"tema": "...", "por_que": "..."},
    {"tema": "...", "por_que": "..."}
  ]
}`;

  return { system, user: "Sugira 3 temas candidatos." };
}

// ─── GERAR MANIFESTO ──────────────────────────────────────────────────────

export function generateManifestoPrompt(
  creator: Partial<User> | null | undefined,
  icp: ICP,
  mapaVoz: MapaVoz | null,
  posicionamento: Posicionamento,
  tema: string,
  lente: LenteKey
) {
  const ctx = buildContext(creator, icp, mapaVoz, posicionamento);
  const lenteInfo = LENTES[lente];

  const system = `Você é especialista em estratégia de marca.

Gere 3 opções de MANIFESTO para o território abaixo.

O QUE É UM MANIFESTO:
- 1 frase curta e memorável (8-20 palavras)
- Expressa a tese/crença central do criador sobre o tema
- Serve como BANDEIRA pública — vira bio, topo de post, storie fixada
- Carrega a LENTE escolhida (ou seja, reflete a maneira de enxergar)

TEMA: ${tema}

LENTE ESCOLHIDA: ${lenteInfo.label}
- Descrição: ${lenteInfo.desc}
- Palavras-chave da lente: ${lenteInfo.palavrasChave.join(", ")}
- Exemplo no estilo: "${lenteInfo.exemplo}"

REGRAS:
- O manifesto DEVE soar como da lente escolhida
- Use as palavras-chave da lente quando couber naturalmente
- Use o tom da voz do usuário
- NÃO seja motivacional genérico ("seja o melhor de você mesmo")
- Seja específico do tema — se for vendas, fale de vendas; não de "sucesso"

${ctx}

Responda EXCLUSIVAMENTE com JSON:
{
  "options": [
    {"manifesto": "...", "por_que": "breve explicação"},
    {"manifesto": "...", "por_que": "..."},
    {"manifesto": "...", "por_que": "..."}
  ],
  "recomendada": 0
}`;

  return { system, user: "Gere 3 manifestos." };
}

// ─── SUGERIR FRONTEIRAS ───────────────────────────────────────────────────

export function suggestFronteirasPrompt(
  creator: Partial<User> | null | undefined,
  icp: ICP,
  mapaVoz: MapaVoz | null,
  posicionamento: Posicionamento,
  tema: string,
  lente: LenteKey,
  manifesto: string
) {
  const ctx = buildContext(creator, icp, mapaVoz, posicionamento);
  const lenteInfo = LENTES[lente];

  const system = `Você é especialista em posicionamento estratégico.

Sugira 4 FRONTEIRAS (o que o criador NÃO fala, se recusa a defender) pro território abaixo.

O QUE SÃO FRONTEIRAS:
- Lista concreta do que está DE FORA do território
- Força clareza estratégica — territórios sem fronteira viram genéricos
- Cada fronteira ataca uma prática/abordagem COMUM do mercado que o criador rejeita
- Específicas do mercado, não genéricas

Exemplos bons:
- "Prospecção fria em massa"
- "Gatilhos mentais clichês"
- "Antes e depois de corpo"
- "Dietas restritivas"

Exemplos ruins (muito genéricos):
- "Conteúdo ruim"
- "Não ter foco"
- "Preguiça"

TEMA: ${tema}
LENTE: ${lenteInfo.label}
MANIFESTO: "${manifesto}"

${ctx}

Responda EXCLUSIVAMENTE com JSON:
{
  "options": [
    "...",
    "...",
    "...",
    "..."
  ]
}`;

  return { system, user: "Sugira 4 fronteiras concretas." };
}
