import type { ICP, MapaVoz, User } from "@/types";
import { formatICP } from "./oferta";
import { formatUserContext } from "./_user-context";
import {
  buildSkillBlock,
  DEFAULT_SKILL,
  type PosicionamentoSkill,
} from "@/lib/posicionamento/skills";

export type DiferencialCategoria = "metodo" | "filosofia" | "origem";

export const DIFERENCIAL_CATEGORIAS: Record<
  DiferencialCategoria,
  { label: string; icon: string; desc: string }
> = {
  metodo: {
    label: "Método / Sistema",
    icon: "🔧",
    desc: "O COMO técnico que só você faz.",
  },
  filosofia: {
    label: "Filosofia / Crença",
    icon: "💭",
    desc: "Uma visão contrária ao mercado.",
  },
  origem: {
    label: "Origem / História",
    icon: "📖",
    desc: "Uma credencial pessoal única.",
  },
};

// ─── Sugerir RESULTADO ───────────────────────────────────────────────────

export function suggestResultadoPrompt(icp: ICP, creator?: Partial<User> | null) {
  const userCtx = formatUserContext(creator);
  const system = `Você é especialista em posicionamento e copywriting.

Sugira 5 opções de RESULTADO que o profissional pode entregar pro ICP abaixo.

REGRAS:
- Cada resultado é uma frase curta (máx 15 palavras)
- Linguagem direta: verbo no infinitivo + métrica/situação concreta
- Use os desejos e dores do ICP como base
- Gere resultados ESPECÍFICOS, não genéricos
- Os resultados devem ser coerentes com a atividade do criador
- Exemplos bons: "dobrar o faturamento em 12 meses sem virar infoprodutor"
- Exemplos ruins: "ajudar a ter mais sucesso"
${userCtx}

ICP:
${formatICP(icp)}

Responda EXCLUSIVAMENTE com JSON:
{
  "options": [
    {"resultado": "...", "por_que": "breve explicação"},
    {"resultado": "...", "por_que": "..."}
  ]
}`;
  return { system, user: "Sugira 5 resultados." };
}

// ─── Nomear MECANISMO ─────────────────────────────────────────────────────

export function nameMecanismoPrompt(
  icp: ICP,
  mapaVoz: MapaVoz | null,
  descricao: string
) {
  const vozBlock = mapaVoz
    ? `\nVOZ (tom do nome):\n- Tom: ${mapaVoz.tom_de_voz}\n- Palavras usadas: ${(mapaVoz.palavras_usar || []).join(", ")}`
    : "";

  const system = `Você é especialista em naming de métodos.

Dado o método descrito abaixo, sugira 3 NOMES fortes, curtos e memoráveis.

REGRAS:
- Máximo 3 palavras
- Evoque a essência do método
- Evite clichês ("método infalível", "sistema X")
- Pode usar sigla/acrônimo se fizer sentido
- Use o tom da voz

ICP: ${icp.niche}${vozBlock}

DESCRIÇÃO DO MÉTODO:
${descricao}

Responda EXCLUSIVAMENTE com JSON:
{
  "names": [
    {"nome": "...", "por_que": "breve explicação"},
    {"nome": "...", "por_que": "..."},
    {"nome": "...", "por_que": "..."}
  ]
}`;
  return { system, user: "Sugira 3 nomes." };
}

// ─── DECLARAÇÃO DE POSICIONAMENTO (final, polida, repetível) ──────────────

export function generateDeclaracaoPrompt(
  icp: ICP,
  resultado: string,
  mecanismo_nome: string,
  mecanismo_descricao: string,
  diferencial: string,
  creator?: Partial<User> | null,
  skill: PosicionamentoSkill = DEFAULT_SKILL,
  /** Foco da declaração: 1 dor primária + 1 desejo primário escolhidos pelo user.
   *  Se vazio, IA fica livre (comportamento antigo — mas qualidade pior).      */
  foco?: { dor_foco?: string; desejo_foco?: string }
) {
  const userCtx = formatUserContext(creator);
  const skillBlock = buildSkillBlock(skill);

  // Bloco de foco — força exclusão (princípio central de Ries/Trout/Moore/Dunford)
  const dorFoco = foco?.dor_foco?.trim();
  const desejoFoco = foco?.desejo_foco?.trim();

  const outrasDores = (icp.pain_points || [])
    .filter((p) => p && p !== dorFoco)
    .slice(0, 5);
  const outrosDesejos = (icp.desires || [])
    .filter((d) => d && d !== desejoFoco)
    .slice(0, 5);

  const focoBlock =
    dorFoco || desejoFoco
      ? `
═══════════════════════════════════════════
🎯 FOCO ESTRATÉGICO DESTA DECLARAÇÃO
═══════════════════════════════════════════
${dorFoco ? `DOR PRIMÁRIA (atacar diretamente): "${dorFoco}"` : ""}
${desejoFoco ? `DESEJO PRIMÁRIO (prometer): "${desejoFoco}"` : ""}

REGRA CRÍTICA: a DECLARAÇÃO PRINCIPAL deve atacar EXATAMENTE essa dor e
prometer EXATAMENTE esse desejo. NÃO tente cobrir as outras dores/desejos
listados abaixo — são apenas CONTEXTO DE FUNDO pra você não contradizer
nada que o ICP sente, mas o ângulo central é o foco acima.

(Posicionamento é ato de EXCLUSÃO — Ries & Trout. Atacar tudo = atacar nada.)
${outrasDores.length ? `\nOutras dores secundárias (contexto, NÃO ângulo central): ${outrasDores.join(" | ")}` : ""}
${outrosDesejos.length ? `\nOutros desejos secundários (contexto, NÃO ângulo central): ${outrosDesejos.join(" | ")}` : ""}
═══════════════════════════════════════════
`
      : "";

  const system = `Você é especialista em copywriting de posicionamento.

Gere uma DECLARAÇÃO DE POSICIONAMENTO clara, curta e forte.

═══════════════════════════════════════════
${skillBlock}
═══════════════════════════════════════════

REGRAS UNIVERSAIS (somam às do estilo escolhido — todas valem):
- Deve conter, de forma natural:
  • Quem o usuário ajuda (ICP claro)
  • Qual problema resolve (dor específica)
  • Qual resultado gera (transformação CONCRETA mas SEM número específico)
- NÃO misturar método, história pessoal ou diferencial na frase principal
  (esses elementos vão SEPARADOS, na frase de apoio)
- PROIBIDO usar números/percentuais específicos (ex: "25-40% margem", "3x mais",
  "em 90 dias", "100 clientes") na DECLARAÇÃO PRINCIPAL e nas VARIAÇÕES.
  Princípio: posicionamento = lugar na mente do cliente, NÃO peça de venda.
  Sem prova ao lado, número específico soa feature de copy duvidosa.
  Genericidade aqui é POSITIVA: "aumentar margem" vence "aumentar margem em
  25%". Números reais ficam pra frase de apoio (com contexto/método) ou
  material de venda. EXCEÇÃO: timing de método na frase de apoio é OK se for
  diferenciador real (ex: "ciclos de 90 dias").
- EVITAR palavras genéricas: "soluções", "transformação", "potencializar",
  "alavancar", "destravar"
- Deve soar como algo fácil de repetir em voz alta — em palestra, no elevador,
  em DM
- AS 2 VARIAÇÕES DEVEM SER REALMENTE DIFERENTES: diferentes da principal E
  diferentes entre si. Diferentes em estrutura (abertura, ordem de elementos)
  E em ângulo. Se a primeira começa com "Você...", a segunda deve começar de
  outro jeito. Se uma é dicotomia, a outra é direta. NÃO copie a principal
  trocando 2 palavras — isso não é variação, é repetição.

EXEMPLO DE DECLARAÇÃO RUIM (independente do estilo):
- "Ajudo profissionais a alcançar transformação e potencializar seu negócio
  através de soluções estratégicas e meu método único de 7 etapas e atendimento
  personalizado." (longa, genérica, mistura tudo, palavras vazias)
- "Ajudo X a aumentar margem em 25-40% em 90 dias." (número específico sem
  prova ao lado — soa pitch de venda, não posicionamento)

DADOS DO USUÁRIO:
${userCtx}

ICP:
${formatICP(icp)}
${focoBlock}
RESULTADO QUE ENTREGA: ${resultado}

MÉTODO/MECANISMO (NÃO usar na declaração principal — só na frase de apoio):
- Nome: ${mecanismo_nome || "(sem nome)"}
- Descrição: ${mecanismo_descricao || "(sem descrição)"}

DIFERENCIAL (NÃO usar na declaração principal — só na frase de apoio):
${diferencial || "(sem diferencial declarado)"}

Saída esperada (no estilo escolhido acima):
- 1 declaração principal
- 2 variações alternativas (mesmas regras, formulações diferentes — TODAS no mesmo estilo)
- 1 frase de apoio (carrega diferencial/método/autoridade — usada DEPOIS da declaração principal)

Responda EXCLUSIVAMENTE com JSON:
{
  "principal": "...",
  "variacoes": ["...", "..."],
  "frase_apoio": "..."
}`;

  return { system, user: "Gere a declaração de posicionamento." };
}

// ─── Sugerir DIFERENCIAL ──────────────────────────────────────────────────

export function suggestDiferencialPrompt(
  icp: ICP,
  mapaVoz: MapaVoz | null,
  respostasVoz: Record<string, string> | null,
  categoria: DiferencialCategoria,
  creator?: Partial<User> | null
) {
  const userCtx = formatUserContext(creator);
  const vozBlock = mapaVoz
    ? `\nVOZ:
- Arquétipo primário: ${mapaVoz.energia_arquetipica}
- Tom: ${mapaVoz.tom_de_voz}
- Frase de essência: "${mapaVoz.frase_essencia}"`
    : "";

  const historiaBlock = respostasVoz
    ? `\nHISTÓRIA DO USUÁRIO (das perguntas da voz):
${Object.entries(respostasVoz)
  .filter(([, v]) => v?.trim())
  .map(([k, v]) => `- ${k}: ${v}`)
  .join("\n")}`
    : "";

  const categoriaContext = {
    metodo: {
      foco: "diferencial de MÉTODO/SISTEMA: o COMO técnico único",
      exemplos: [
        "Uso 3 camadas de diagnóstico que ninguém faz",
        "Vendo pela lente de dados, não de intuição",
      ],
    },
    filosofia: {
      foco: "diferencial de FILOSOFIA/CRENÇA: uma visão contrária ao mercado",
      exemplos: [
        "Não acredito em upsell forçado",
        "Recuso contratos sem diagnóstico prévio de 3 dias",
      ],
    },
    origem: {
      foco: "diferencial de ORIGEM/HISTÓRIA: credencial pessoal única",
      exemplos: [
        "Fechei 180 contratos em 8 anos no Magazine Luiza",
        "Fui burocracia 15 anos antes de virar consultor",
      ],
    },
  }[categoria];

  const system = `Você é especialista em posicionamento estratégico.
${userCtx}
Sugira 3 opções de DIFERENCIAL para o usuário, no formato de "e me diferencio porque {DIFERENCIAL}".

CATEGORIA ESCOLHIDA: ${categoriaContext.foco}

Exemplos do estilo certo:
${categoriaContext.exemplos.map((e) => `- "${e}"`).join("\n")}

REGRAS:
- Máximo 20 palavras cada
- Específico, não genérico (evite "trato com atenção", "tenho experiência")
- Use as palavras da voz do usuário quando couber
- Deve soar natural no final da frase "...e me diferencio porque {frase}"

ICP: ${icp.niche}${vozBlock}${historiaBlock}

Responda EXCLUSIVAMENTE com JSON:
{
  "options": [
    {"diferencial": "...", "por_que": "breve explicação"},
    {"diferencial": "...", "por_que": "..."},
    {"diferencial": "...", "por_que": "..."}
  ]
}`;
  return { system, user: "Sugira 3 diferenciais." };
}
