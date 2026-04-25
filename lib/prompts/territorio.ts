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

// ─── 1. SUGERIR DOMÍNIOS (descritivo técnico) ─────────────────────────────

export function suggestDominiosPrompt(
  creator: Partial<User> | null | undefined,
  icp: ICP,
  mapaVoz: MapaVoz | null,
  posicionamento: Posicionamento
) {
  const ctx = buildContext(creator, icp, mapaVoz, posicionamento);

  const system = `Você é especialista em estratégia de marca.

Sugira 3 opções de DOMÍNIO TEMÁTICO (descritivo, técnico) que esse criador pode dominar.

REGRAS DE UM BOM DOMÍNIO:
- 2-5 palavras
- Descritivo, técnico — descreve o nicho/segmento de atuação
- Amplo o bastante pra ter o que dizer por anos
- Estreito o bastante pra virar autoridade
- Coerente com a atividade real do criador

Exemplos bons:
- "Vendas Consultivas B2B"
- "Branding Pessoal pra Profissionais Técnicos"
- "Finanças Pessoais pra Casais"

Exemplos ruins:
- "Sucesso" (genérico demais)
- "Anúncios de FB pra lojas no Paraná" (nicho demais)

${ctx}

Responda EXCLUSIVAMENTE com JSON:
{
  "options": [
    {"dominio": "...", "por_que": "breve explicação"},
    {"dominio": "...", "por_que": "..."},
    {"dominio": "...", "por_que": "..."}
  ]
}`;

  return { system, user: "Sugira 3 domínios candidatos." };
}

// ─── 2. SUGERIR ÂNCORAS MENTAIS (1-3 palavras emocional) ──────────────────

export function suggestAncorasPrompt(
  creator: Partial<User> | null | undefined,
  icp: ICP,
  mapaVoz: MapaVoz | null,
  posicionamento: Posicionamento,
  dominio: string,
  lente: LenteKey
) {
  const ctx = buildContext(creator, icp, mapaVoz, posicionamento);
  const lenteInfo = LENTES[lente];

  const system = `Você é especialista em branding e naming estratégico.

Sugira 5 opções de ÂNCORA MENTAL pra esse território.

O QUE É UMA ÂNCORA MENTAL:
- 1 a 3 palavras
- Emocional, intrigante OU provocativa
- NÃO descreve o que a marca faz — comunica o ESPAÇO MENTAL que ela quer dominar
- Compreendida em até 3 segundos
- Funciona como bandeira, vira frase de bio, abre conversa

DOMÍNIO TÉCNICO: ${dominio}
LENTE: ${lenteInfo.label} — ${lenteInfo.desc}

EXEMPLOS DE TRANSFORMAÇÃO:
- Domínio "Vendas Consultivas" → Âncora "Vender é leitura"
- Domínio "Marketing pra Arquitetos" → Âncora "A arte de cobrar"
- Domínio "Finanças pra Casais" → Âncora "Casal sem segredo"
- Domínio "Personal pra Mulheres 40+" → Âncora "Corpo é casa"
- Domínio "Branding Pessoal" → Âncora "Marca é verbo"

REGRAS RÍGIDAS (a maioria das opções deve respeitar):
- Máximo 4 palavras
- Sem termos técnicos do nicho
- Sem palavras óbvias do domínio
- Use verbos, metáforas, oposições, paradoxos

${ctx}

Responda EXCLUSIVAMENTE com JSON:
{
  "options": [
    {"ancora": "...", "por_que": "explicação curta do efeito mental"},
    {"ancora": "...", "por_que": "..."},
    {"ancora": "...", "por_que": "..."},
    {"ancora": "...", "por_que": "..."},
    {"ancora": "...", "por_que": "..."}
  ]
}`;

  return { system, user: "Sugira 5 âncoras mentais." };
}

// ─── 3. GERAR MANIFESTO (Tese + Expansão) ─────────────────────────────────

export function generateManifestoPrompt(
  creator: Partial<User> | null | undefined,
  icp: ICP,
  mapaVoz: MapaVoz | null,
  posicionamento: Posicionamento,
  dominio: string,
  ancora: string,
  lente: LenteKey
) {
  const ctx = buildContext(creator, icp, mapaVoz, posicionamento);
  const lenteInfo = LENTES[lente];

  const system = `Você é especialista em estratégia de marca.

Gere 3 opções de MANIFESTO completo (TESE + EXPANSÃO) pro território abaixo.

ESTRUTURA DO MANIFESTO:
- TESE (1 frase): curta, direta, forte, idealmente CONTRAINTUITIVA. É a bandeira pública.
- EXPANSÃO (1-2 frases): explica a tese, conecta com problema real, sem jargões.

DOMÍNIO: ${dominio}
ÂNCORA MENTAL: "${ancora}"
LENTE: ${lenteInfo.label}
- Descrição: ${lenteInfo.desc}
- Palavras-chave: ${lenteInfo.palavrasChave.join(", ")}

REGRAS:
- A tese deve soar como ${lenteInfo.label}
- Tese de no máximo 12 palavras
- Expansão deve ampliar a tese sem repetir as mesmas palavras
- Zero motivacional vazio ("seja a melhor versão de você")

EXEMPLOS DE BOA TESE + EXPANSÃO:
- Tese: "Vender não é sorte. É leitura."
  Expansão: "Quem fecha consistentemente lê padrões antes de pitch. O resto improvisa e perde."
- Tese: "Não existe vendedor nato."
  Expansão: "Existe vendedor com método. Talento sem sistema é loteria. Sistema sem talento ainda fecha."

${ctx}

Responda EXCLUSIVAMENTE com JSON:
{
  "options": [
    {"tese": "...", "expansao": "...", "por_que": "breve explicação do efeito"},
    {"tese": "...", "expansao": "...", "por_que": "..."},
    {"tese": "...", "expansao": "...", "por_que": "..."}
  ],
  "recomendada": 0
}`;

  return { system, user: "Gere 3 opções de manifesto." };
}

// ─── 4. SUGERIR FRONTEIRAS (negativas + positivas) ────────────────────────

export function suggestFronteirasPrompt(
  creator: Partial<User> | null | undefined,
  icp: ICP,
  mapaVoz: MapaVoz | null,
  posicionamento: Posicionamento,
  dominio: string,
  ancora: string,
  lente: LenteKey,
  tese: string
) {
  const ctx = buildContext(creator, icp, mapaVoz, posicionamento);
  const lenteInfo = LENTES[lente];

  const system = `Você é especialista em posicionamento estratégico.

Sugira FRONTEIRAS pro território abaixo, em DUAS LISTAS PARALELAS:

🚫 FRONTEIRAS NEGATIVAS (4 itens) — o que NÃO faz/recusa
✅ FRONTEIRAS POSITIVAS (4 itens) — o que FAZ/defende

REGRAS:
- Frases curtas (3-7 palavras cada)
- ESCANEÁVEIS
- PARALELAS: cada negativa idealmente tem uma positiva correspondente
- Específicas do mercado, não genéricas

EXEMPLOS BONS:
🚫 Prospecção em massa  ↔  ✅ Diagnóstico antes de pitch
🚫 Gatilhos mentais  ↔  ✅ Conversa franca
🚫 Scripts decorados  ↔  ✅ Reunião improvisada com método
🚫 Antes e depois de corpo  ↔  ✅ Histórias de força no dia a dia

DOMÍNIO: ${dominio}
ÂNCORA: "${ancora}"
TESE: "${tese}"
LENTE: ${lenteInfo.label}

${ctx}

Responda EXCLUSIVAMENTE com JSON:
{
  "negativas": ["...", "...", "...", "..."],
  "positivas": ["...", "...", "...", "..."]
}`;

  return { system, user: "Sugira fronteiras negativas + positivas." };
}

// ─── 5. SUGERIR ÁREAS DE ATUAÇÃO ──────────────────────────────────────────

export function suggestAreasAtuacaoPrompt(
  creator: Partial<User> | null | undefined,
  icp: ICP,
  mapaVoz: MapaVoz | null,
  posicionamento: Posicionamento,
  dominio: string,
  ancora: string,
  tese: string
) {
  const ctx = buildContext(creator, icp, mapaVoz, posicionamento);

  const system = `Você é estrategista de negócio.

Sugira 5 ÁREAS DE ATUAÇÃO concretas pro território abaixo.

O QUE SÃO ÁREAS DE ATUAÇÃO:
- Onde o território vira NEGÓCIO REAL
- Aplicações práticas: processos, sistemas, abordagens, serviços, frameworks
- NÃO são temas de conteúdo
- NÃO são editorias
- SÃO o que o criador entrega/cobra

EXEMPLOS:
Território "Vender é leitura" → áreas:
- Diagnóstico de Maturidade de Compra
- Treinamento de Discovery em 3 Camadas
- Auditoria de CRM e Pipeline
- Mentoria de Vendas Consultivas
- Implementação de Framework de Proposta

REGRAS:
- 2-6 palavras por item
- Cada item é uma OFERTA POTENCIAL
- Coerente com a atividade do criador
- Específico (não "consultoria geral")

DOMÍNIO: ${dominio}
ÂNCORA: "${ancora}"
TESE: "${tese}"

${ctx}

Responda EXCLUSIVAMENTE com JSON:
{
  "areas": ["...", "...", "...", "...", "..."]
}`;

  return { system, user: "Sugira 5 áreas de atuação." };
}
