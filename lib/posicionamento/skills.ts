// Skills (estilos) de posicionamento — cada um aplica a essência de um
// pensador/copywriter especifico no momento de gerar a declaracao final.
//
// Default: 'ries_trout' (mais cortante, classico, casa com a metodologia
// que enfatiza ancora mental + tese curta).

export type PosicionamentoSkill =
  | "ries_trout"
  | "ogilvy"
  | "miller"
  | "godin"
  | "dunford";

export type SkillDef = {
  key: PosicionamentoSkill;
  label: string;
  subtitle: string;
  desc: string; // tooltip / cardinha
  style: string; // 1 frase resumindo o estilo
  rules: string[]; // regras especificas pro prompt
  example: string; // exemplo de declaracao no estilo
};

export const SKILLS: Record<PosicionamentoSkill, SkillDef> = {
  ries_trout: {
    key: "ries_trout",
    label: "Al Ries & Jack Trout",
    subtitle: "Brutalmente simples",
    desc: "Criadores do conceito de Positioning. Foco em ocupar UM espaço claro na mente. Frase cortante, sem firula.",
    style: "Brutalmente simples e memorável. Cada palavra puxa peso. Zero adjetivo vazio.",
    rules: [
      "Frase curta como mantra (max 12-15 palavras na principal).",
      "Foco em ocupar 1 espaço mental único e definido.",
      "Zero explicação no momento — explicação vem depois (frase de apoio).",
      "Use dicotomia/contraste quando couber (X, não Y).",
      "Evite TODOS os adjetivos genéricos (incrível, único, especial, melhor).",
    ],
    example: "Ajudo consultores B2B a fechar 3x mais deals em 90 dias.",
  },

  ogilvy: {
    key: "ogilvy",
    label: "David Ogilvy",
    subtitle: "Clareza + autoridade premium",
    desc: "Pai da publicidade moderna. Linguagem mais sofisticada, mas ainda direta. Forte em credibilidade.",
    style: "Clareza com peso de autoridade. Tom premium, sem soar arrogante. Vocabulário preciso.",
    rules: [
      "Frase com cadência (ritmo de leitura, não martelado).",
      "Demonstra autoridade pelo CONTEÚDO, não por adjetivos ('15 anos' OK; 'líder' não).",
      "Pode usar uma estrutura mais elaborada que Ries/Trout (até 2 linhas), desde que cada palavra justifique seu lugar.",
      "Evite jargão de marketing barato. Prefira termos do nicho do cliente.",
      "Se houver número/prova concreta, usa.",
    ],
    example:
      "Para consultores B2B que vendem mais de R$ 100 mil/ano: dobrar pipeline qualificado em 90 dias com diagnóstico estruturado.",
  },

  miller: {
    key: "miller",
    label: "Donald Miller (StoryBrand)",
    subtitle: "Foco no problema do cliente",
    desc: "Storytelling aplicado a negócios. Estrutura didática. Posiciona o cliente como herói, você como guia.",
    style: "Coloca o cliente no centro. A frase descreve a transformação dele, não o que você faz.",
    rules: [
      "Estrutura mental: 'Você [está em X dor] / Nós [te levamos pra Y resultado]'.",
      "O CLIENTE é o herói da frase, você é o guia.",
      "Linguagem clara, sem jargão técnico — fala como cliente fala.",
      "Foco no resultado/transformação, não no método.",
      "Se quiser, pode quebrar em 2 partes: 'antes / depois'.",
    ],
    example:
      "Você tem expertise mas seu pipeline é inconsistente. Te ajudo a criar um sistema de vendas previsível em 90 dias.",
  },

  godin: {
    key: "godin",
    label: "Seth Godin",
    subtitle: "Categoria + percepção",
    desc: "Branding moderno. Mais conceitual e filosófico. Forte em criar/redefinir categoria de mercado.",
    style: "Conceitual e provocativo. Faz o leitor pensar 'nunca vi por esse ângulo'.",
    rules: [
      "Pode reposicionar UMA categoria (ex: 'não vendo treinamento, vendo previsibilidade').",
      "Pode usar metáfora forte (mas só UMA, nunca várias).",
      "Tom calmo e seguro — não grita, sussurra com peso.",
      "Aceita ser intencionalmente vago em UM dos 3 elementos (pra quem / dor / resultado), DESDE QUE em troca crie uma percepção memorável.",
      "Evite o lugar-comum motivacional ('transforme sua vida', 'acredite em você').",
    ],
    example:
      "Não ensino vendas. Ajudo consultores B2B a parar de improvisar reuniões.",
  },

  dunford: {
    key: "dunford",
    label: "April Dunford",
    subtitle: "Precisão B2B",
    desc: "Referência atual em posicionamento B2B. Extremamente precisa em diferenciação e valor real percebido.",
    style: "Operacional e cirúrgica. Toda palavra tem função concreta. Mostra valor real, não promessas.",
    rules: [
      "Estrutura sugerida (mas adaptável): '[Para QUEM ESPECÍFICO], que [SITUAÇÃO/DOR CONCRETA], somos a alternativa que [DIFERENCIADOR EM VALOR REAL]'.",
      "Especifica o segmento o quanto for possível (não 'consultores' — 'consultores B2B vendendo deals de R$50k+').",
      "Diferenciação vem do VALOR PERCEBIDO, não de feature técnica.",
      "Aceita 2-3 frases se necessário — clareza vence brevidade quando o nicho é técnico.",
      "Evite vagueza. Se algo pode ser interpretado de 2 jeitos, reescreve.",
    ],
    example:
      "Para consultores B2B vendendo deals de R$50k+ que não conseguem escalar discovery: somos a alternativa a treinamento genérico — instalamos um framework de qualificação em 90 dias com mentoria 1:1.",
  },
};

export const DEFAULT_SKILL: PosicionamentoSkill = "ries_trout";

export const SKILL_ORDER: PosicionamentoSkill[] = [
  "ries_trout",
  "ogilvy",
  "miller",
  "godin",
  "dunford",
];

/**
 * Bloco de instrucoes pra injetar no prompt de geracao de declaracao.
 * Substitui as regras genericas pelas regras especificas da skill escolhida.
 */
export function buildSkillBlock(skill: PosicionamentoSkill): string {
  const def = SKILLS[skill];
  return `
ESTILO DE POSICIONAMENTO ESCOLHIDO: ${def.label} — ${def.subtitle}

ESSÊNCIA: ${def.style}

REGRAS ESPECÍFICAS DESSE ESTILO (siga TODAS):
${def.rules.map((r, i) => `${i + 1}. ${r}`).join("\n")}

EXEMPLO DE DECLARAÇÃO NESSE ESTILO (apenas referência de TOM, não copie literal):
"${def.example}"
`.trim();
}
