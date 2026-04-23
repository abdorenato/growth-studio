"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useUserStore } from "@/hooks/use-user-store";
import { firstName } from "@/lib/utils";

type NextStep = {
  icon: string;
  title: string;
  description: string;
  href?: string;
  comingSoon?: boolean;
};

export default function DashboardPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user)!;
  const progress = useUserStore((s) => s.progress);

  const nextStep = computeNextStep(progress);
  const totalSteps = 6;
  const completedKeys = [
    "voz",
    "posicionamento",
    "territorio",
    "editorias",
    "ideias",
    "conteudos",
  ] as const;
  const completed = completedKeys.filter(
    (k) => progress[k as keyof typeof progress]
  ).length;
  const pct = Math.round((completed / totalSteps) * 100);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">
          E aí, {firstName(user.name)}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Sou o iAbdo. Vamos construir sua máquina de conteúdo?
        </p>
      </div>

      <Separator />

      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">
              🎯 Próximo passo: {nextStep.icon} {nextStep.title}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {nextStep.description}
            </p>
          </div>
          {nextStep.href && !nextStep.comingSoon && (
            <Button onClick={() => router.push(nextStep.href!)}>
              Ir agora →
            </Button>
          )}
          {nextStep.comingSoon && (
            <p className="text-xs text-muted-foreground italic">
              Em breve. Enquanto isso, siga pelos módulos disponíveis.
            </p>
          )}
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Progresso geral</span>
          <span className="text-sm text-muted-foreground">
            {completed}/{totalSteps} etapas ({pct}%)
          </span>
        </div>
        <Progress value={pct} />
      </div>

      <Separator />

      <div>
        <h3 className="text-xl font-semibold mb-2">🧭 Como navegar</h3>
        <p className="text-sm text-muted-foreground mb-4">
          No menu lateral você vê os 3 grupos:
        </p>
        <ul className="space-y-2 text-sm">
          <li>
            <b>✨ Conteúdo</b> — voz, editorias, ideias e geração de conteúdo
          </li>
          <li>
            <b>📦 Produto</b> — ICP, Oferta e Pitch (pra quando for oferecer algo)
          </li>
        </ul>
        <p className="text-sm text-muted-foreground mt-4">
          Vou liberar as etapas à medida que você for completando. Bora pelo
          primeiro passo?
        </p>
      </div>
    </div>
  );
}

function computeNextStep(progress: Record<string, boolean | undefined>): NextStep {
  if (!progress.voz) {
    return {
      icon: "🎙️",
      title: "Voz da Marca",
      description: "Tudo começa descobrindo como você soa de verdade.",
      href: "/conteudo/voz",
    };
  }
  if (!progress.posicionamento) {
    return {
      icon: "📍",
      title: "Posicionamento",
      description: "Vou te ajudar a cravar sua frase de posicionamento.",
      comingSoon: true,
    };
  }
  if (!progress.territorio) {
    return {
      icon: "🗺️",
      title: "Território",
      description: "Definir o território principal de conteúdo.",
      comingSoon: true,
    };
  }
  if (!progress.editorias) {
    return {
      icon: "📚",
      title: "Editorias",
      description: "Macro-temas do seu território.",
      comingSoon: true,
    };
  }
  if (!progress.ideias) {
    return {
      icon: "💡",
      title: "Ideias",
      description: "Bora gerar ideias a partir das suas editorias.",
      href: "/conteudo/ideias",
    };
  }
  return {
    icon: "🔄",
    title: "Monoflow",
    description: "Transformar ideias em conteúdos pra todas as plataformas.",
    href: "/conteudo/monoflow",
  };
}
