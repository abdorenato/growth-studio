"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, RotateCcw, Check, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { useUserStore } from "@/hooks/use-user-store";
import { ARCHETYPES, DISCOVERY_QUESTIONS } from "@/lib/voz/constants";
import { firstName } from "@/lib/utils";
import type { ArchetypeKey, MapaVoz } from "@/types";

type VozResult = {
  arquetipo_primario: ArchetypeKey;
  arquetipo_secundario: ArchetypeKey;
  justificativa: string;
  mapa_voz: MapaVoz;
};

type Step = "perguntas" | "revisao";

export default function VozPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user)!;
  const updateProgress = useUserStore((s) => s.updateProgress);

  const [step, setStep] = useState<Step>("perguntas");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<VozResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Carrega voz existente do Supabase (se já fez antes)
  useEffect(() => {
    const load = async () => {
      try {
        const resp = await fetch(`/api/voz?userId=${user.id}`);
        const data = await resp.json();
        if (data.voz) {
          setAnswers(data.voz.respostas || {});
          setResult({
            arquetipo_primario: data.voz.arquetipo_primario,
            arquetipo_secundario: data.voz.arquetipo_secundario,
            justificativa: data.voz.justificativa || "",
            mapa_voz: data.voz.mapa_voz || {},
          });
          setStep("revisao");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingInitial(false);
      }
    };
    load();
  }, [user.id]);

  const handleAnswerChange = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handleDiscover = async () => {
    const filled = Object.values(answers).filter((v) => v?.trim()).length;
    if (filled < 4) {
      toast.error(
        `Responde pelo menos 4 perguntas pra eu conseguir analisar. (${filled}/6)`
      );
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch("/api/voz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (!resp.ok) throw new Error("Erro ao gerar voz");
      const data = (await resp.json()) as VozResult;
      setResult(data);
      setStep("revisao");
    } catch (err) {
      console.error(err);
      toast.error("Deu ruim na análise. Tenta de novo.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setLoading(true);
    try {
      const resp = await fetch("/api/voz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          voz: { ...result, respostas: answers },
        }),
      });
      if (!resp.ok) throw new Error("Erro ao salvar");
      updateProgress("voz", true);
      toast.success("🎉 Voz salva! Vamos pro próximo passo.");
      setTimeout(() => router.push("/dashboard"), 1200);
    } catch (err) {
      console.error(err);
      toast.error("Deu ruim pra salvar. Tenta de novo.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegerar = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/voz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (!resp.ok) throw new Error("Erro");
      const data = (await resp.json()) as VozResult;
      setResult(data);
      toast.success("Regerada!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao regerar.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ETAPA: REVISÃO
  // ═══════════════════════════════════════════════════════════════════════

  if (step === "revisao" && result) {
    const prim = ARCHETYPES[result.arquetipo_primario] || ARCHETYPES.especialista;
    const sec = ARCHETYPES[result.arquetipo_secundario] || ARCHETYPES.especialista;
    const mapa = result.mapa_voz;

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">🎙️ Voz da Marca</h1>
          <p className="text-muted-foreground mt-1">
            Seu Mapa de Voz Autêntica — revise e ajuste.
          </p>
        </div>

        <Separator />

        {/* Arquétipos */}
        <div>
          <h2 className="text-xl font-semibold mb-4">🔮 Sua Identificação Arquetípica</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-xs uppercase text-muted-foreground tracking-wider mb-2">
                  Primário
                </div>
                <h3 className="text-xl font-bold">{prim.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{prim.subtitle}</p>
                <p className="text-sm mt-3">{prim.description}</p>
                <p className="text-xs text-muted-foreground mt-2 italic">
                  Energia: {prim.energy}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-xs uppercase text-muted-foreground tracking-wider mb-2">
                  Secundário
                </div>
                <h3 className="text-xl font-bold">{sec.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{sec.subtitle}</p>
                <p className="text-sm mt-3">{sec.description}</p>
                <p className="text-xs text-muted-foreground mt-2 italic">
                  Energia: {sec.energy}
                </p>
              </CardContent>
            </Card>
          </div>

          {result.justificativa && (
            <Card className="mt-4 bg-muted/50">
              <CardContent className="p-4 text-sm">
                <p className="font-medium mb-1">💭 Por que esses arquétipos?</p>
                <p className="text-muted-foreground">{result.justificativa}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <Separator />

        {/* Mapa de Voz */}
        <div>
          <h2 className="text-xl font-semibold mb-4">🎤 Seu Mapa de Voz</h2>
          <Card>
            <CardContent className="p-6 space-y-3">
              <Row label="Energia Arquetípica" value={mapa.energia_arquetipica} />
              <Row label="Tom de Voz" value={mapa.tom_de_voz} />
              <Row label="Frase de Essência" value={`"${mapa.frase_essencia}"`} italic />
              <Row label="Frase de Impacto" value={`"${mapa.frase_impacto}"`} italic />

              <div className="grid md:grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-sm font-medium mb-2">✅ Palavras que eu uso</p>
                  <div className="flex flex-wrap gap-1">
                    {mapa.palavras_usar?.map((w) => (
                      <span
                        key={w}
                        className="text-xs bg-primary/10 text-primary px-2 py-1 rounded"
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">🚫 Palavras que eu evito</p>
                  <div className="flex flex-wrap gap-1">
                    {mapa.palavras_evitar?.map((w) => (
                      <span
                        key={w}
                        className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded"
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={() => setStep("perguntas")}
            disabled={loading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Editar respostas
          </Button>
          <Button
            variant="outline"
            onClick={handleRegerar}
            disabled={loading}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Regerar análise
          </Button>
          <Button onClick={handleSave} disabled={loading} className="sm:ml-auto">
            <Check className="mr-2 h-4 w-4" />
            {loading ? "Salvando..." : "Essa é minha voz"}
          </Button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ETAPA: PERGUNTAS
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">🎙️ Voz da Marca</h1>
        <p className="text-muted-foreground mt-1">
          Antes de falar, precisamos descobrir <b>como</b> você fala.
        </p>
      </div>

      <Separator />

      <Card className="bg-muted/30">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold">
            Oi {firstName(user.name)}, aqui é o iAbdo 👋
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Vou te fazer <b>6 perguntas curtas</b> pra descobrir seu arquétipo de voz.
            Responde do jeito que te vier — <b>não precisa ser perfeito</b>, precisa
            ser verdadeiro.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {DISCOVERY_QUESTIONS.map((q, i) => (
          <div key={q.key} className="space-y-2">
            <Label htmlFor={q.key}>
              <span className="text-primary font-semibold">{i + 1}.</span>{" "}
              {q.question}
            </Label>
            {q.help && (
              <p className="text-xs text-muted-foreground">{q.help}</p>
            )}
            <Textarea
              id={q.key}
              value={answers[q.key] || ""}
              onChange={(e) => handleAnswerChange(q.key, e.target.value)}
              placeholder="Sua resposta..."
              rows={3}
              disabled={loading}
            />
          </div>
        ))}
      </div>

      <Button
        onClick={handleDiscover}
        disabled={loading}
        className="w-full"
        size="lg"
      >
        <Sparkles className="mr-2 h-4 w-4" />
        {loading ? "Analisando sua voz..." : "Descobrir minha voz"}
      </Button>
    </div>
  );
}

function Row({ label, value, italic }: { label: string; value: string; italic?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase text-muted-foreground tracking-wider mb-1">
        {label}
      </p>
      <p className={italic ? "italic" : ""}>{value}</p>
    </div>
  );
}
