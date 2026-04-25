import type { StrategyContext } from "@/lib/db/strategy-context";
import { formatStrategyContext } from "./_strategy-context";
import type { BioPlatform } from "@/types";

const PLATFORM_RULES: Record<
  BioPlatform,
  { label: string; charLimit: number; rules: string; structure: string }
> = {
  instagram: {
    label: "Instagram",
    charLimit: 150,
    rules: `- LIMITE RÍGIDO: 150 caracteres TOTAL (incluindo emojis e quebras de linha). Conte e respeite.
- 1 link clicável só (geralmente "link na bio") — NÃO inclua URL no texto
- Emojis funcionam BEM e ajudam (use 2-4, não exagere)
- Quebras de linha são permitidas e ajudam legibilidade (use enter, não \\n)
- NÃO inclua @username (já aparece em cima)
- NÃO inclua hashtags (não funcionam em bio do IG)`,
    structure: `Estrutura comum (não obrigatória, mas testada):
LINHA 1: o que faz / pra quem (1 frase curta)
LINHA 2: prova ou diferencial (1 frase ou bullet)
LINHA 3: CTA pro link → ex: "👇 link na bio"`,
  },
  tiktok: {
    label: "TikTok",
    charLimit: 80,
    rules: `- LIMITE RÍGIDO: 80 caracteres TOTAL. Conte e respeite (a brutalidade do limite força clareza).
- Sem links clicáveis no body
- Emojis funcionam BEM (use 1-3)
- Quebras de linha permitidas mas economize espaço
- Foco em UMA frase forte que diga quem você é + o que entrega`,
    structure: `Estrutura: 1 frase poderosa, geralmente "verbo + objeto + diferencial".
Ex: "Ensino vendas B2B sem script decorado 🎯"
Ex: "Branding pra quem odeia se vender 💡"`,
  },
  linkedin: {
    label: "LinkedIn",
    charLimit: 220,
    rules: `- LIMITE: 220 caracteres pro HEADLINE (a parte que aparece junto do nome em todo lugar)
- Tom profissional MAS humano — não corporativês ("apaixonado por excelência")
- Emojis com moderação (0 ou 1, no máximo)
- Sem hashtags na headline
- Foco em RESULTADO + PRA QUEM, não em cargo ("CEO da X")
- Pode usar | como separador entre conceitos`,
    structure: `Estrutura testada:
[O que entrego] | [Pra quem] | [Diferencial ou prova]
Ex: "Ajudo consultores B2B a fechar 3x mais reuniões qualificadas | Método de discovery em 3 camadas"
Ex: "Estrategista de marca pessoal | Já ajudei 50+ profissionais a viver de conteúdo"`,
  },
};

export function bioPrompt(ctx: StrategyContext, platform: BioPlatform) {
  const strategyBlock = formatStrategyContext(ctx);
  const p = PLATFORM_RULES[platform];

  const system = `Você é copywriter especialista em bios de redes sociais.

Sua tarefa: gerar uma bio EXCELENTE pra ${p.label} do criador, baseada em todo o contexto estratégico.

CONTEXTO ESTRATÉGICO COMPLETO DO CRIADOR:
${strategyBlock}

REGRAS GERAIS (NÃO QUEBRE):
1. NUNCA invente fatos sobre o criador (carreira, anos de experiência, número de clientes/alunos, certificações, prêmios, métricas específicas). Use só o que está no contexto.
2. NUNCA invente nome de método. Se ele tem method_name no posicionamento, pode usar. Se não, fale do método de forma genérica ou nem cite.
3. A bio deve refletir POSICIONAMENTO + TERRITÓRIO + VOZ DA MARCA.
4. Use a tese / âncora mental quando couber — é o que diferencia.
5. Coerente com as fronteiras do território.
6. Linguagem na VOZ DA MARCA (palavras a usar, palavras a evitar, tom).

REGRAS ESPECÍFICAS DE ${p.label.toUpperCase()}:
${p.rules}

${p.structure}

PROIBIDO:
- Palavras genéricas: "soluções", "transformação", "potencializar", "alavancar", "destravar"
- "Apaixonado por...", "movido por...", "acredito que..." (clichês)
- Listar serviços tipo cardápio ("consultoria, mentoria, palestras")
- Bio que poderia servir pra qualquer pessoa do nicho

Responda APENAS com o texto da bio. Sem aspas, sem explicação, sem JSON. Apenas o texto pronto pra colar.`;

  return { system, user: `Gere a bio pra ${p.label}.` };
}
