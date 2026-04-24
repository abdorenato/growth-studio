import type { ArchetypeKey, Archetype } from "@/types";

export const ARCHETYPES: Record<ArchetypeKey, Archetype> = {
  especialista: {
    name: "O Especialista",
    subtitle: "Autoridade Intelectual",
    description: "Profundidade, lógica e domínio técnico.",
    energy: "Analítica, didática, orientada a resultado",
  },
  protetor: {
    name: "O Protetor",
    subtitle: "Autoridade de Cuidado",
    description: "Estrutura, segurança e empatia.",
    energy: "Acolhedora, estruturada, orientada a cuidado",
  },
  proximo: {
    name: "O Próximo",
    subtitle: "Autoridade de Conexão",
    description: "Autenticidade, vulnerabilidade e presença humana.",
    energy: "Humana, vulnerável, orientada a vínculo",
  },
  desbravador: {
    name: "O Desbravador",
    subtitle: "Autoridade de Ruptura",
    description: "Velocidade, coragem e impacto.",
    energy: "Ousada, contrária, orientada a transformação",
  },
};

export type Question = {
  key: string;
  question: string;
  help?: string;
};

export const DISCOVERY_QUESTIONS: Question[] = [
  {
    key: "origem",
    question: "O que te moveu a começar o que você faz hoje?",
    help: "O motivo que colocou você nessa jornada.",
  },
  {
    key: "virada",
    question:
      "Qual foi o ponto de virada — quando algo te quebrou, te virou ou te fez mudar o jogo?",
    help: "Um momento de ruptura ou insight que mudou seu caminho.",
  },
  {
    key: "impacto",
    question:
      "O que está em jogo hoje — o que você quer que o mundo sinta quando te ouve ou te vê?",
    help: "A marca que você quer deixar nas pessoas.",
  },
  {
    key: "motivo_agora",
    question: "Por que você quer começar (ou fortalecer) a criação de conteúdo agora?",
    help: "O que te trouxe aqui neste momento específico.",
  },
  {
    key: "pessoa_ou_marca",
    question: "Você fala mais como marca (empresa) ou como pessoa (profissional)?",
    help: "Ajuda a calibrar o nível de informalidade e exposição pessoal.",
  },
  {
    key: "referencia",
    question:
      "Se pudesse escolher um personagem fictício ou pessoa pública com quem mais se identifica no estilo ou energia, quem seria?",
    help: "Uma referência de voz e presença que ressoa com você.",
  },
];
