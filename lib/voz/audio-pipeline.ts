// Pipeline de decodificacao de voz: audio -> transcricao (Whisper) -> analise (Claude)
//
// 2 etapas separadas pra dar visibilidade no front + permitir reanalise sem
// re-transcrever (audio fica deletado apos done, mas transcricao persiste).

import { callClaude } from "@/lib/claude";

const OPENAI_BASE = "https://api.openai.com/v1";

function getOpenAIKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error(
      "OPENAI_API_KEY nao configurada. Adicione no Vercel → Settings → Environment Variables."
    );
  }
  return key;
}

/**
 * Transcreve audio via OpenAI Whisper.
 * Custo: ~$0.006/min. Limite: 25MB por arquivo.
 */
export async function transcribeAudio(
  audioBlob: Blob,
  filename: string
): Promise<string> {
  const key = getOpenAIKey();

  const formData = new FormData();
  formData.append("file", audioBlob, filename);
  formData.append("model", "whisper-1");
  formData.append("language", "pt");
  formData.append("response_format", "text");
  formData.append("temperature", "0");

  const resp = await fetch(`${OPENAI_BASE}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: formData,
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error("Whisper error:", resp.status, errText);
    throw new Error(`Falha na transcricao (${resp.status})`);
  }

  // response_format=text → retorna text/plain direto
  const transcricao = await resp.text();
  return transcricao.trim();
}

// ─────────────────────────────────────────────────────────────────────
// ANALISE: prompt de 2 passos (extracao bruta -> interpretacao)
// ─────────────────────────────────────────────────────────────────────

const ANALYZE_SYSTEM_PROMPT = `Voce e especialista em analise de voz e arquetipos de marca pessoal.

Recebeu a TRANSCRICAO de um audio em que uma pessoa fala sobre o que faz, sua origem, ponto de virada, impacto desejado, e estilo (perguntas em formato livre — pode ter pulado algumas).

Sua tarefa: extrair o ARQUETIPO + MAPA DE VOZ aplicando um processo de 2 passos.

═══════════════════════════════════════════
PASSO 1 — EXTRACAO BRUTA (sem interpretar ainda)
═══════════════════════════════════════════

Antes de aplicar framework, capture os SINAIS LITERAIS na fala:

- palavras_frequentes: 5-10 palavras MAIS USADAS (alem de stopwords). Ordene por frequencia.
- frases_chave_literais: 2-3 frases que aparecem REPETIDAS LITERALMENTE OU sao formulacoes muito proprias da pessoa. Pegue elas inteiras como sairam, sem reescrever.
- marcadores_emocionais: identifique tom predominante. Vulnerabilidade? Certeza? Inquietacao? Indignacao? Calma analitica? Cite trecho que comprove.
- ritmo_e_pessoa: pessoa predominante (1a, 2a, 3a)? tempo verbal predominante (passado/presente/futuro)? Ritmo (curto direto / longo elaborado / fragmentado / circular)?
- estrutura_discursiva: como organiza o pensamento? Linear (causa-consequencia)? Circular (volta ao mesmo ponto)? Fragmentada (vai e vem)? Parental (explica como pra leigo)?

═══════════════════════════════════════════
PASSO 2 — INTERPRETACAO (aplica framework com base nos sinais brutos)
═══════════════════════════════════════════

Os 4 ARQUETIPOS (use APENAS esses):

1. ESPECIALISTA (Autoridade Intelectual) — profundidade, logica, dominio tecnico. Energia analitica, didatica.
2. PROTETOR (Autoridade de Cuidado) — estrutura, seguranca, empatia. Energia acolhedora.
3. PROXIMO (Autoridade de Conexao) — autenticidade, vulnerabilidade, presenca humana. Energia humana, vulneravel.
4. DESBRAVADOR (Autoridade de Ruptura) — velocidade, coragem, impacto. Energia ousada, contraria.

Identifique:
- arquetipo_primario e arquetipo_secundario: justifique CITANDO sinais brutos do passo 1 (ex: "frequencia de 'metodo' e 'padrao' + estrutura linear → Especialista").
- mapa_voz: monte com base na fala REAL, nao no ideal:
  - energia_arquetipica: 1 frase descrevendo a energia combinada
  - tom_de_voz: 3-5 adjetivos
  - frase_essencia: 1 frase em 1a pessoa, idealmente PUXANDO uma frase_chave_literal real do passo 1 (mais autentico que inventar)
  - frase_impacto: bandeira publica, direta e memoravel
  - palavras_usar: 5 palavras (priorize as palavras_frequentes do passo 1 que sao identitarias, NAO genericas tipo "tipo", "entao")
  - palavras_evitar: 3 palavras que CONTRADIZEM o arquetipo identificado

- insights_especificos: 3-5 observacoes praticas que a pessoa pode acionar, citando trechos LITERAIS dela. Exemplos:
  - "Voce disse literalmente 'X' — pode virar uma frase de essencia melhor que qualquer coisa que eu inventaria"
  - "Padrao: voce comeca toda explicacao com 'olha so' — assina sua voz, considera manter"
  - "Marcador: vc usa 'a gente' constantemente em vez de 'voce' — autoridade-proxima, nao autoridade-de-cima"

REGRAS CRITICAS:
- NUNCA invente fatos sobre a pessoa que nao estao na transcricao
- Se a transcricao nao cobre algo (ex: nao falou sobre origem), reconheca em "lacunas"
- Cite SEMPRE trechos literais nos insights, sao o que diferencia analise por audio de analise por formulario

RESPONDA EXCLUSIVAMENTE COM JSON nesse formato:

{
  "extracao_bruta": {
    "palavras_frequentes": ["..."],
    "frases_chave_literais": ["..."],
    "marcadores_emocionais": "string explicando + trecho citado",
    "ritmo_e_pessoa": "string descrevendo",
    "estrutura_discursiva": "string descrevendo"
  },
  "arquetipo_primario": "especialista|protetor|proximo|desbravador",
  "arquetipo_secundario": "especialista|protetor|proximo|desbravador",
  "justificativa": "2-3 frases citando sinais brutos do passo 1",
  "mapa_voz": {
    "energia_arquetipica": "...",
    "tom_de_voz": "...",
    "frase_essencia": "...",
    "frase_impacto": "...",
    "palavras_usar": ["...", "...", "...", "...", "..."],
    "palavras_evitar": ["...", "...", "..."]
  },
  "insights_especificos": ["...", "...", "..."],
  "lacunas": "string mencionando se a transcricao deixou algum aspecto importante sem cobertura (origem, virada, impacto, etc.)"
}`;

export type VozAudioAnalysis = {
  extracao_bruta: {
    palavras_frequentes: string[];
    frases_chave_literais: string[];
    marcadores_emocionais: string;
    ritmo_e_pessoa: string;
    estrutura_discursiva: string;
  };
  arquetipo_primario: string;
  arquetipo_secundario: string;
  justificativa: string;
  mapa_voz: {
    energia_arquetipica: string;
    tom_de_voz: string;
    frase_essencia: string;
    frase_impacto: string;
    palavras_usar: string[];
    palavras_evitar: string[];
  };
  insights_especificos: string[];
  lacunas: string;
};

/**
 * Analisa uma transcricao e retorna o mapa de voz + insights especificos.
 * Custo Anthropic: ~$0.05-0.15 dependendo do tamanho da transcricao.
 */
export async function analyzeTranscription(
  transcricao: string,
  userId: string
): Promise<VozAudioAnalysis> {
  if (!transcricao.trim()) {
    throw new Error("Transcricao vazia.");
  }

  const userMessage = `Transcricao do audio (analise aplicando o processo de 2 passos):\n\n"""\n${transcricao}\n"""`;

  const text = await callClaude(ANALYZE_SYSTEM_PROMPT, userMessage, 4000, {
    endpoint: "/api/voz/audio/process",
    userId,
  });

  // parseJSON local (nao vou importar pra evitar acoplamento)
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .split("\n")
      .filter((l) => !l.trim().startsWith("```"))
      .join("\n")
      .trim();
  }
  // Tenta achar primeiro {...}
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) cleaned = match[0];

  try {
    return JSON.parse(cleaned) as VozAudioAnalysis;
  } catch (err) {
    console.error("analyzeTranscription parse error:", err, "\nText:", text.slice(0, 500));
    throw new Error("Resposta da IA em formato invalido. Tente novamente.");
  }
}
