import type { StrategyContext } from "@/lib/db/strategy-context";
import { formatStrategyContext } from "./_strategy-context";

type EditoriaCtx = {
  nome: string;
  tipo_objetivo?: string;
  objetivo?: string;
  descricao?: string;
};

export function destaquesPrompt(
  ctx: StrategyContext,
  editorias: EditoriaCtx[]
) {
  const strategyBlock = formatStrategyContext(ctx);

  const editoriasBlock = editorias.length
    ? `\nEDITORIAS DEFINIDAS PELO CRIADOR (puxe destaques que ESPELHEM esses pilares quando fizer sentido):
${editorias
  .map(
    (e, i) =>
      `${i + 1}. ${e.nome} (${e.tipo_objetivo || "?"}) — ${e.objetivo || ""}`
  )
  .join("\n")}`
    : "";

  const system = `Você é especialista em estratégia de Instagram e arquitetura de perfil.

Sua tarefa: sugerir uma estrutura de DESTAQUES (highlights) coerente com a estratégia do criador. São as bolinhas fixadas embaixo da bio — onde o visitante decide se segue, salva ou clica no link.

CONTEXTO ESTRATÉGICO COMPLETO DO CRIADOR:
${strategyBlock}
${editoriasBlock}

REGRAS GERAIS (NÃO QUEBRE):
1. NUNCA invente fatos sobre o criador (carreira, depoimentos específicos, números de clientes/alunos, certificações). Se sugerir destaque tipo "Resultados" ou "Depoimentos", deixe claro na descrição que ele precisa preencher com material REAL.
2. NUNCA invente nome de método. Se houver method_name no posicionamento, pode usar.
3. Os destaques precisam refletir POSICIONAMENTO + TERRITÓRIO + EDITORIAS. Não invente categorias fora do universo do criador.
4. Coerentes com as fronteiras negativas (não proponha destaque sobre o que ele NÃO faz).
5. Se há OFERTA EM FOCO no contexto, inclua um destaque dedicado ("Trabalho comigo", "Mentoria", etc.).

ESTRUTURA QUE FUNCIONA EM PERFIS PROFISSIONAIS:
- 8 a 12 destaques (suficiente pra cobrir o essencial sem virar bagunça visual)
- Sempre incluir: 1 "apresentação/manifesto" + 1 "trabalho comigo" (se tem oferta)
- Restante: misturar autoridade (método/conceito), prova (cases/depoimentos quando tiver), provocação (verdades duras), conexão (bastidores) e processos (como funciona)
- Respeitar o ESTÁGIO de quem chega no perfil: alguns destaques pra "inconsciente/problema" (atrair), outros pra "produto/pronto" (converter)

REGRAS POR DESTAQUE:
- nome: 8-12 caracteres MAX (cabe no balão do destaque). Direto, identitário, na voz do criador. Pode usar emoji curto (1 só).
- descricao: 1-2 frases sobre O QUE vai dentro desse destaque, em linguagem prática.
- conteudo_sugerido: 3-5 stories sugeridos pra montar esse destaque, separados por "; ". Concretos, não conceituais.
- capa_sugerida: ideia de capa em 1 linha — cor dominante + ícone/elemento + conceito (ex: "Preto e branco com ícone de gráfico — minimalista" ou "Bege + foto sua olhando pra câmera").
- ordem: número de 1 a N indicando ordem ideal (1 = primeiro destaque, mais à esquerda).

ORDEM IDEAL:
1. Apresentação/manifesto (quem é, em que acredita)
2-3. Provas/autoridade (o que entrega, prova)
4-5. Método/processo (como pensa/atua)
6-7. Bastidores/conexão (humanização)
8. Trabalho comigo / Oferta (CTA pra contratação)
9-N. Específicos do território (extras)

PROIBIDO:
- Destaques genéricos sem ligação ao território ("Frases", "Reflexões", "Motivação")
- Nomes longos que não cabem no balão
- Categorias do que ele NÃO faz (fronteiras negativas)
- Repetir editorias inteiras (destaques são complementares, não cópia)

Responda EXCLUSIVAMENTE com JSON no formato:
{
  "destaques": [
    {
      "nome": "...",
      "descricao": "...",
      "conteudo_sugerido": "...",
      "capa_sugerida": "...",
      "ordem": 1
    }
  ]
}`;

  return { system, user: "Sugira a estrutura de destaques (8 a 12 itens)." };
}
