import type { MapaVoz, ICP } from "@/types";
import { formatICP } from "./oferta";

export function posicionamentoPrompt(
  mapaVoz: MapaVoz | null,
  icp: ICP | null,
  whatYouDo: string,
  forWhom: string
) {
  const vozBlock = mapaVoz
    ? `\nVOZ DA MARCA:
- Energia: ${mapaVoz.energia_arquetipica}
- Tom: ${mapaVoz.tom_de_voz}
- Frase de essência: "${mapaVoz.frase_essencia}"
- Palavras usadas: ${(mapaVoz.palavras_usar || []).join(", ")}`
    : "";

  const icpBlock = icp ? `\nICP:\n${formatICP(icp)}` : "";

  const system = `Você é especialista em posicionamento de marca pessoal.

Crie 3 opções de FRASE DE POSICIONAMENTO para o usuário.

REGRAS DA FRASE:
- 1 frase, máximo 20 palavras
- Estrutura: "Eu ajudo [público] a [transformação/resultado] sem [dor evitada / jeito ruim]"
- Deve soar natural na voz do usuário
- Deve diferenciar (mostrar o ângulo único)
- Evite jargão genérico ("ajudo pessoas a viverem melhor")
- Use as palavras-chave da voz quando couber
${vozBlock}${icpBlock}

DADOS DO USUÁRIO:
- O que faz: ${whatYouDo}
- Para quem: ${forWhom}

Responda EXCLUSIVAMENTE com JSON:
{
  "options": [
    {"frase": "...", "explicacao": "breve explicação do porquê funciona"},
    {"frase": "...", "explicacao": "..."},
    {"frase": "...", "explicacao": "..."}
  ],
  "recomendada": 0
}`;

  return { system, user: "Crie 3 opções de posicionamento." };
}
