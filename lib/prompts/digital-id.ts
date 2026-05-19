// Digital ID — passo de SÍNTESE que consolida os 4 módulos de fundação
// (Voz, ICP, Posicionamento, Território) num documento único.
//
// NÃO é geração: o prompt organiza, hierarquiza, comprime e deriva — sempre
// a partir do que os módulos já produziram. Zero estratégia nova.
//
// Os arquétipos NÃO vêm no StrategyContext (fetchStrategyContext só pega
// mapa_voz da tabela vozes), então são passados separados pelo endpoint.

import type { StrategyContext } from "@/lib/db/strategy-context";
import type { ArchetypeKey } from "@/types";

export type Archetypes = {
  primario: ArchetypeKey;
  secundario: ArchetypeKey;
};

// Monta o bloco de contexto SÓ com os 4 módulos da fundação — sem editoria
// nem oferta (que o formatStrategyContext genérico incluiria). Digital ID é
// síntese da fundação, não de campanha.
function fundacaoBlock(ctx: StrategyContext, arq: Archetypes): string {
  const v = ctx.mapaVoz;
  const p = ctx.posicionamento;
  const t = ctx.territorio;
  const icp = ctx.icp;

  return `═══ MÓDULO 1 — VOZ DA MARCA ═══
- Arquétipo primário: ${arq.primario}
- Arquétipo secundário: ${arq.secundario}
- Energia arquetípica: ${v?.energia_arquetipica || "[não definido no material]"}
- Tom de voz: ${v?.tom_de_voz || "[não definido no material]"}
- Frase de essência: "${v?.frase_essencia || "[não definido no material]"}"
- Frase de impacto: "${v?.frase_impacto || "[não definido no material]"}"
- Palavras que usa: ${(v?.palavras_usar || []).join(", ") || "[não definido no material]"}
- Palavras que evita: ${(v?.palavras_evitar || []).join(", ") || "[não definido no material]"}

═══ MÓDULO 2 — ICP (cliente ideal) ═══
- Nome interno: ${icp?.name || "[não definido no material]"}
- Nicho: ${icp?.niche || "[não definido no material]"}
- Dores (pain points): ${(icp?.pain_points || []).join(" | ") || "[não definido no material]"}
- Desejos (desires): ${(icp?.desires || []).join(" | ") || "[não definido no material]"}
- Objeções: ${(icp?.objections || []).join(" | ") || "[não definido no material]"}

═══ MÓDULO 3 — POSICIONAMENTO ═══
- Frase de posicionamento (TAGLINE — usar INTACTA): "${p?.frase || "[não definido no material]"}"
- Resultado entregue: ${p?.resultado || "[não definido no material]"}
- Método (nome): ${p?.mecanismo_nome || "[não definido no material]"}
- Diferencial: ${p?.diferencial_frase || "[não definido no material]"}

═══ MÓDULO 4 — TERRITÓRIO ═══
- Domínio: ${t?.dominio || "[não definido no material]"}
- Âncora mental: "${t?.ancora_mental || "[não definido no material]"}"
- Lente: ${t?.lente || "[não definido no material]"}
- Tese: "${t?.tese || t?.manifesto || "[não definido no material]"}"
- Fronteiras (o que recusa): ${(t?.fronteiras || []).join(" | ") || "[não definido no material]"}`;
}

export function digitalIdPrompt(ctx: StrategyContext, arq: Archetypes) {
  const nome = ctx.creator?.name || "[não definido no material]";

  const system = `Você é um estrategista de marca especializado em CONSOLIDAÇÃO de identidade.

Sua tarefa é montar o DIGITAL ID — o documento único que reúne a fundação de marca de uma pessoa num só objeto coerente e consultável.

═══ NATUREZA DA TAREFA — leia antes de tudo ═══
Isto NÃO é um módulo de geração. É um passo de SÍNTESE. Você recebe o resultado de 4 módulos já prontos (Voz, ICP, Posicionamento, Território) e os consolida. Você NÃO cria estratégia nova. Você organiza, escolhe hierarquia, comprime e deriva — sempre a partir do que já existe.

═══ REGRAS GERAIS (NÃO QUEBRE) ═══
1. NUNCA invente fatos sobre a pessoa (carreira, anos de experiência, número de clientes/alunos, certificações, prêmios, métricas, depoimentos).
2. NUNCA invente nome de método. Use exatamente o que veio do Posicionamento, ou não nomeie.
3. Use SOMENTE o conteúdo dos 4 módulos abaixo. Se um campo necessário não existir no material, escreva "[não definido no material]" — não preencha por suposição.
4. Respeite as FRONTEIRAS do Território em todos os blocos.
5. Linguagem: português direto, sem firula. Evite "soluções", "transformação", "potencializar", "alavancar", "destravar".

═══ MATERIAL DOS 4 MÓDULOS ═══
NOME DA PESSOA: ${nome}

${fundacaoBlock(ctx, arq)}

═══ LÓGICA DE SÍNTESE — siga exatamente ═══

A) BANDEIRA (uma frase ideológica — o que a pessoa DEFENDE)

Distinção obrigatória:
- A TAGLINE é a declaração principal de posicionamento. É FUNCIONAL: diz o que a pessoa FAZ e pra quem. Vem INTACTA do módulo Posicionamento. NÃO é candidata a nada. NÃO a reescreva. NÃO promova outra frase ao lugar dela.
- A BANDEIRA é IDEOLÓGICA: diz o que a pessoa DEFENDE — a crença, a visão contrária ao mercado. Papel diferente, campo diferente.

A disputa é SÓ pela Bandeira. Candidatas: frase de impacto (Voz), tese (Território), âncora mental (Território). Escolha UMA pelos critérios: mais contraintuitiva, mais curta, mais memorável, funciona como bandeira pública. As outras NÃO entram no documento. Não liste alternativas. Decida e justifique em 1 frase.

Registre em "flag_source" qual foi a origem da escolhida: "frase_impacto", "tese" ou "ancora_mental".

B) NOTA DE APOIO ("o que me move")
A frase de essência tem função diferente da bandeira: fala de origem e motivação, não do que a pessoa defende publicamente. Ela vira a nota de apoio.
COPIE a frase de essência SEM ALTERAÇÃO. Não reescreva, não comprima, não melhore. É cópia literal.

C) RELAÇÃO (derive do par de arquétipos)
A partir do arquétipo primário + secundário, descreva em 1 frase o tipo de vínculo que a marca cria. Use esta referência fixa:
- especialista → vínculo de orientação técnica, de quem diagnostica
- protetor → vínculo de cuidado, de quem dá segurança e guia
- proximo → vínculo de par, de quem caminha junto
- desbravador → vínculo de provocação, de quem desafia
Combine os dois arquétipos numa frase natural. Máximo 1 frase.

D) REFLEXO (derive dos desejos do ICP)
A partir dos DESEJOS do ICP, descreva em 1 frase como esse cliente quer SE ENXERGAR ao consumir esta marca.

ATENÇÃO — distinção crítica, é onde a síntese mais escorrega:
- REFLEXO é IDENTIDADE: quem o cliente quer SER.
  ✅ "alguém que decide com clareza, sem depender de validação externa"
  ✅ "um líder que os pares procuram quando o problema é difícil"
- NÃO é o problema que ele quer resolver (isso é DOR/desejo travestido):
  ❌ "ter mais clientes" — isso é resultado, não identidade
  ❌ "parar de perder dinheiro" — isso é dor
  ❌ "crescer a empresa" — isso é objetivo, não auto-imagem
O reflexo responde "quem eu me torno", não "o que eu consigo".
Se o material do ICP não sustentar uma leitura de identidade, escreva "[não definido no material]".

E) COMPRESSÃO
Comprima cada módulo aos campos do shape abaixo. Frases curtas. Sem repetir entre blocos: se algo já está na tagline, não repita como campo solto.

F) DIAGNÓSTICO DE COERÊNCIA (o lint da fundação)
Verifique CONTRADIÇÕES entre os módulos — desalinhamentos, não repetições:
- O tom de voz combina com o arquétipo? (ex: arquétipo Especialista mas tom motivacional vazio = contradição)
- O domínio do Território respeita as fronteiras? (o que ele declara fazer não invade o que ele declara recusar)
- A declaração de posicionamento (tagline) e a tese apontam pra mesma direção estratégica? (não devem se contradizer)
NÃO avalie redundância aqui — repetição entre artefatos da fundação é tratada na origem (nos módulos Voz/Posicionamento/Território), não na síntese.
Se houver contradição, liste em "issues" (1-2 frases cada) e status "issues". Se estiver tudo coerente, status "ok" e issues vazio.

═══ SAÍDA — responda EXCLUSIVAMENTE com JSON válido neste shape ═══
{
  "who": {
    "name": "${nome}",
    "tagline": "a frase de posicionamento, INTACTA",
    "archetype_primary": "${arq.primario}",
    "archetype_secondary": "${arq.secundario}",
    "relationship": "1 frase — resultado do passo C"
  },
  "voice": {
    "tone": ["3-5 adjetivos do tom de voz"],
    "words_use": ["5 palavras"],
    "words_avoid": ["3 palavras"]
  },
  "stance": {
    "domain": "domínio do Território",
    "flag": "a bandeira escolhida — resultado do passo A",
    "flag_source": "frase_impacto | tese | ancora_mental",
    "flag_rationale": "1 frase justificando a escolha",
    "boundaries": ["3-4 itens — o que a marca recusa"]
  },
  "audience": {
    "icp_name": "nome interno do ICP",
    "icp_summary": "1 linha descrevendo o ICP",
    "reflection": "resultado do passo D, ou [não definido no material]",
    "pains": ["as 2-3 dores mais fortes do ICP"]
  },
  "support_note": "a frase de essência, cópia literal — passo B",
  "coherence_check": {
    "status": "ok | issues",
    "issues": ["lista de contradições/redundâncias, vazia se status ok"]
  }
}

REGRAS DO JSON:
- "archetype_primary" e "archetype_secondary": copie o valor recebido EXATAMENTE — lowercase, sem acento (ex: "especialista"). NÃO recapitalize.
- "tagline": cópia literal da frase de posicionamento. Não reescreva.
- "support_note": cópia literal da frase de essência. Não reescreva.
- Sem markdown, sem texto fora do JSON.`;

  return { system, user: "Monte o Digital ID consolidando os 4 módulos." };
}
