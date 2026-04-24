export type TipoObjetivo =
  | "autoridade"
  | "conectar"
  | "provocar"
  | "prova"
  | "converter";

export const OBJETIVOS: Record<
  TipoObjetivo,
  { label: string; icon: string; desc: string; exemplos: string[] }
> = {
  autoridade: {
    label: "Autoridade",
    icon: "🎓",
    desc: "Ensinar, provar domínio técnico. Gera confiança.",
    exemplos: ["Diagnóstico", "Método", "Fundamentos", "Framework"],
  },
  conectar: {
    label: "Conectar",
    icon: "❤️",
    desc: "Humanizar, mostrar bastidores, história. Aproxima.",
    exemplos: ["Bastidores", "Diário", "Jornada", "Histórias reais"],
  },
  provocar: {
    label: "Provocar",
    icon: "⚡",
    desc: "Quebrar crença, virar discussão. Engaja.",
    exemplos: ["Verdades Duras", "Contra-mão", "Mitos", "Polêmico"],
  },
  prova: {
    label: "Prova",
    icon: "🏆",
    desc: "Cases, resultados, depoimentos. Vende sem vender.",
    exemplos: ["Cases Reais", "Transformações", "Antes/Depois", "Clientes"],
  },
  converter: {
    label: "Converter",
    icon: "💰",
    desc: "Apresentar oferta, CTA direto. Fecha o ciclo.",
    exemplos: ["Trabalho Comigo", "Vaga Aberta", "Oferta", "Convite"],
  },
};

export const TIPO_ORDEM: TipoObjetivo[] = [
  "autoridade",
  "conectar",
  "provocar",
  "prova",
  "converter",
];
