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

  /** Resumo do estilo aplicado a TODA saida. */
  style: string;

  /** Regras pra DECLARACAO PRINCIPAL + 2 VARIACOES. */
  rules: string[];

  /** Regras pra FRASE DE APOIO (que vem DEPOIS da principal). */
  rules_frase_apoio: string[];

  /** Exemplo de declaracao no estilo (referencia de tom). */
  example: string;

  /** Exemplo de frase de apoio no estilo. */
  example_frase_apoio: string;
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
    rules_frase_apoio: [
      "Mesmo tom cortante, sem firula.",
      "Pode usar 2-3 frases curtas em cadência (ex: 'X anos. Y casos. Z método.').",
      "Complementa SEM repetir o que já está na principal.",
      "Carrega o método/diferencial em pílula direta.",
    ],
    example: "Ajudo consultores B2B a fechar mais deals em menos tempo.",
    example_frase_apoio:
      "Método próprio. Diagnóstico antes de pitch. Pipeline previsível em 90 dias.",
  },

  ogilvy: {
    key: "ogilvy",
    label: "David Ogilvy",
    subtitle: "Clareza + autoridade premium",
    desc: "Pai da publicidade moderna. Linguagem mais sofisticada, mas ainda direta. Forte em credibilidade.",
    style:
      "Cadência elevada com peso de autoridade. Tom premium, sem soar arrogante. Vocabulário preciso, palavras escolhidas.",
    rules: [
      "Cadência OBRIGATÓRIA: a frase deve ter ritmo natural ao ler em voz alta. Use ponto final pra criar pausa onde precisar — pode ser 2 frases curtas em vez de 1 longa.",
      "Vocabulário ligeiramente mais elevado, mas ainda direto. Sem jargão de marketing barato.",
      "PROIBIDO usar a estrutura 'Para X que Y, somos Z' (essa é Dunford — evita overlap).",
      "Demonstra autoridade pelo CONTEÚDO escolhido, NÃO por adjetivos ('15 anos auditando' OK; 'líder de mercado' não).",
      "Pode usar paralelismo ou tríade (estrutura de 3 elementos).",
      "Se for 2 frases, a segunda complementa a primeira por contraste ou amplificação.",
    ],
    rules_frase_apoio: [
      "Mantém a cadência da principal — geralmente 2-3 frases curtas em ritmo.",
      "Demonstra autoridade pelo concreto: anos de prática, casos, contexto profissional.",
      "Pode usar paralelismo (estrutura repetida pra criar efeito).",
      "Tom de quem fala com calma, sem precisar provar.",
    ],
    example:
      "Ajudo fundadores de empresas de serviços a recuperar margem. Sem reestruturação dolorosa, sem dispensa de equipe.",
    example_frase_apoio:
      "Vinte anos atravessando consultorias. Centenas de operações lidas. Um padrão que se repete — e que poucos enxergam de dentro.",
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
    rules_frase_apoio: [
      "Mantém o cliente como herói da história.",
      "Você se posiciona como GUIA EXPERIENTE que já passou por isso.",
      "Pode contar mini-história em 1-2 frases ('quando eu mesmo passei por isso, descobri que...').",
      "Empatia primeiro, autoridade depois.",
    ],
    example:
      "Você tem expertise mas seu pipeline é inconsistente. Eu te ajudo a criar um sistema de vendas previsível.",
    example_frase_apoio:
      "Eu mesmo passei pelo mesmo problema antes de virar consultor. A diferença é que agora reconheço o padrão antes dele te derrubar.",
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
    rules_frase_apoio: [
      "Conceitual ou metafórica — reframea o método como filosofia, não técnica.",
      "Sussurro com peso. Tom calmo, seguro, quase contemplativo.",
      "Pode subverter expectativa (ex: 'não é sobre velocidade, é sobre direção').",
      "Evite explicar o método em jargão — explique em princípio.",
    ],
    example: "Não ensino vendas. Ajudo consultores a parar de improvisar reuniões.",
    example_frase_apoio:
      "Existe um padrão. Você não enxerga porque está dentro dele. Eu vejo porque já estive lá fora.",
  },

  dunford: {
    key: "dunford",
    label: "April Dunford",
    subtitle: "Precisão B2B",
    desc: "Referência atual em posicionamento B2B. Extremamente precisa em diferenciação e valor real percebido.",
    style:
      "Operacional e cirúrgica. Toda palavra tem função concreta. Mostra valor real, não promessas.",
    rules: [
      "Estrutura sugerida (mas adaptável): 'Para [QUEM ESPECÍFICO], que [SITUAÇÃO/DOR CONCRETA], somos a alternativa que [DIFERENCIADOR EM VALOR REAL]'.",
      "Especifica o segmento usando linguagem CASUAL DE NEGÓCIO BR — 'fundadores de consultoria/agência/escritório', 'donos de pequena empresa de serviço', 'CEOs de startup B2B'. PROIBIDO jargão acadêmico tipo 'operadores de negócios baseados em conhecimento', 'modelos de operação X', 'profissionais de receita recorrente'.",
      "Diferenciação vem do VALOR PERCEBIDO contra alternativas concretas (ex: 'consultor que não pula diagnóstico', 'agência que entrega operação no lugar de relatório'), não de feature técnica.",
      "Aceita 2-3 frases se necessário — clareza vence brevidade quando o nicho é técnico.",
      "Toda palavra justifica seu lugar. Se algo pode ser interpretado de 2 jeitos, reescreve.",
    ],
    rules_frase_apoio: [
      "Operacional: mostra COMO você faz diferente, em palavras concretas.",
      "Cita método/processo/framework proprietário com nome.",
      "Pode quantificar timing (90 dias, 6 semanas) se for diferenciador real — NUNCA inventa número de resultado/percentual.",
      "Se houver alternativa óbvia no mercado, contrasta diretamente ('outros consultores fazem X, nós fazemos Y').",
    ],
    example:
      "Para fundadores de consultoria que não conseguem escalar discovery: somos a alternativa a treinamento genérico — instalamos o framework de qualificação direto na sua operação.",
    example_frase_apoio:
      "Discovery 3D em vez de planilha de qualificação. Aplicado em mentoria 1:1 com seu time, em ciclos de 90 dias. Outros consultores entregam relatório; nós entregamos um time qualificando deals igual.",
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

ESSÊNCIA DO ESTILO: ${def.style}

──────────────────────────────────────────────
REGRAS PRA DECLARAÇÃO PRINCIPAL + 2 VARIAÇÕES
──────────────────────────────────────────────
${def.rules.map((r, i) => `${i + 1}. ${r}`).join("\n")}

EXEMPLO DE DECLARAÇÃO NESSE ESTILO (apenas referência de TOM, NÃO copie literal):
"${def.example}"

──────────────────────────────────────────────
REGRAS ESPECÍFICAS PRA FRASE DE APOIO
──────────────────────────────────────────────
A frase de apoio é DIFERENTE da declaração — ela carrega método/diferencial/autoridade
e tem tom próprio dentro do estilo escolhido. Siga estas regras:

${def.rules_frase_apoio.map((r, i) => `${i + 1}. ${r}`).join("\n")}

EXEMPLO DE FRASE DE APOIO NESSE ESTILO (referência de TOM):
"${def.example_frase_apoio}"
`.trim();
}
