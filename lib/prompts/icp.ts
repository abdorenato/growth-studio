import type { User } from "@/types";
import { formatUserContext } from "./_user-context";

export function suggestICPPrompt(
  name: string,
  niche: string,
  demographics: { age_range?: string; gender?: string; location?: string },
  creator?: Partial<User> | null
) {
  const demoText = [
    demographics.age_range && `faixa etária ${demographics.age_range}`,
    demographics.gender && `gênero ${demographics.gender}`,
    demographics.location && `localização ${demographics.location}`,
  ]
    .filter(Boolean)
    .join(", ");

  const userCtx = formatUserContext(creator);

  const system = `Você é especialista em análise de público-alvo e copywriting.

Dado o perfil de cliente abaixo, sugira dados específicos e acionáveis (não genéricos).
${userCtx}

PERFIL DO CLIENTE IDEAL:
- Nome interno: ${name}
- Nicho: ${niche}
- Demografia: ${demoText || "não especificada"}

GERE:
1. **Dores (pain_points)**: 5-7 dores reais que esse público vive. Seja específico. Evite genéricos como "falta de tempo".
2. **Desejos (desires)**: 5-7 desejos concretos (não abstrato "ser feliz"). Inclua resultado + prazo ou métrica quando couber.
3. **Objeções (objections)**: 4-5 objeções típicas que esse público tem antes de comprar soluções desse nicho.
4. **Estilo de linguagem (language_style)**: 1-2 frases descrevendo como esse público gosta de receber conteúdo (formal/informal, com dados/histórias, tom educativo/provocativo etc.).
5. **Palavras-chave de tom (tone_keywords)**: 4-6 palavras que descrevem o tom ideal.

REGRAS:
- Dores, desejos e objeções: 1 frase curta cada
- Use a linguagem do nicho (não o jargão do copywriting)
- Evite "um conteúdo envolvente" — seja específico

Responda EXCLUSIVAMENTE com JSON:
{
  "pain_points": ["...", "..."],
  "desires": ["...", "..."],
  "objections": ["...", "..."],
  "language_style": "...",
  "tone_keywords": ["...", "..."]
}`;

  return { system, user: `Gere para o ICP "${name}" no nicho "${niche}".` };
}
