export type LenteKey =
  | "analitica"
  | "humana"
  | "provocadora"
  | "pratica"
  | "visionaria";

export const LENTES: Record<
  LenteKey,
  {
    label: string;
    icon: string;
    desc: string;
    exemplo: string;
    palavrasChave: string[];
  }
> = {
  analitica: {
    label: "Analítica",
    icon: "🧠",
    desc: "Dados, método, padrão, diagnóstico. Lê a realidade antes de agir.",
    exemplo: "Vender é leitura de padrão, não motivação.",
    palavrasChave: ["método", "padrão", "diagnóstico", "leitura", "dados", "execução"],
  },
  humana: {
    label: "Humana",
    icon: "❤️",
    desc: "História, empatia, vulnerabilidade. Conecta pelo que é real.",
    exemplo: "Vender é entender o humano antes do negócio.",
    palavrasChave: ["história", "humano", "real", "verdade", "conexão", "empatia"],
  },
  provocadora: {
    label: "Provocadora",
    icon: "⚡",
    desc: "Contra o status quo, rupturas. Desafia o óbvio.",
    exemplo: "Vendas tradicional já morreu. Preciso ensinar outra coisa.",
    palavrasChave: ["ruptura", "contra", "quebrar", "reinventar", "provocar", "desafio"],
  },
  pratica: {
    label: "Prática",
    icon: "🎯",
    desc: "Execução, mão na massa, resultado concreto. Sem firula.",
    exemplo: "Vender é sistema. E sistema se repete.",
    palavrasChave: ["sistema", "repetição", "execução", "prática", "resultado", "ação"],
  },
  visionaria: {
    label: "Visionária",
    icon: "🔮",
    desc: "Princípios, visão de mundo amplo. Pensa grande antes do tático.",
    exemplo: "Vender é servir com escala. O dinheiro é consequência.",
    palavrasChave: ["visão", "princípio", "propósito", "futuro", "escala", "impacto"],
  },
};
