// Estágios de Consciência (Eugene Schwartz, "Breakthrough Advertising", 1966)
// Cada peça de conteúdo mira UM estágio dominante da audiência.

export type Estagio =
  | "inconsciente"
  | "problema"
  | "solucao"
  | "produto"
  | "pronto";

export const ESTAGIOS: Record<
  Estagio,
  {
    label: string;
    icon: string;
    desc: string;
    tom: string;
    exemploHook: string;
  }
> = {
  inconsciente: {
    label: "Inconsciente",
    icon: "🌫️",
    desc: "Não sabe que tem o problema",
    tom: "Provoca, abre os olhos, gera tomada de consciência",
    exemploHook: "Você está perdendo dinheiro toda semana e nem percebe",
  },
  problema: {
    label: "Consciente do Problema",
    icon: "⚠️",
    desc: "Sente a dor mas acha que é normal/sem solução",
    tom: "Educa sobre a causa, valida a dor, planta a ideia de que existe saída",
    exemploHook: "Por que sua reunião de venda nunca avança?",
  },
  solucao: {
    label: "Consciente da Solução",
    icon: "🔍",
    desc: "Busca soluções mas não te conhece ainda",
    tom: "Compara abordagens, mostra o método ideal, posiciona expertise",
    exemploHook: "Os 3 caminhos pra escalar vendas (e qual é o certo)",
  },
  produto: {
    label: "Consciente do Produto",
    icon: "📋",
    desc: "Conhece você/seu método, ainda não decidiu",
    tom: "Diferencia, mostra prova, ataca objeções específicas",
    exemploHook: "Por que o Método D3 supera o BANT em vendas complexas",
  },
  pronto: {
    label: "Pronto pra Comprar",
    icon: "🛒",
    desc: "Só falta o gatilho final",
    tom: "Urgência, escassez, oferta clara, CTA direto",
    exemploHook: "Última semana com desconto — vagas se encerram sexta",
  },
};

export const ESTAGIO_ORDEM: Estagio[] = [
  "inconsciente",
  "problema",
  "solucao",
  "produto",
  "pronto",
];
