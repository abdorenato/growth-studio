import type { ICP, MapaVoz, User } from "@/types";
import { formatICP } from "./oferta";
import { formatUserContext } from "./_user-context";

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
