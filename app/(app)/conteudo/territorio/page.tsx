"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import {
  Sparkles,
  Check,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Download,
  Pencil,
  Plus,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { useUserStore } from "@/hooks/use-user-store";
import { LENTES, type LenteKey } from "@/lib/territorio/constants";

type ICPRow = { id: string; name: string; niche: string };
type Step = 1 | 2 | 3 | 4 | 5;

type State = {
  icp_id: string;
  tema: string;
  lente: LenteKey | "";
  manifesto: string;
  fronteiras: string[];
};

const EMPTY: State = {
  icp_id: "",
  tema: "",
  lente: "",
  manifesto: "",
  fronteiras: [],
};

export default function TerritorioPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user)!;
  const updateProgress = useUserStore((s) => s.updateProgress);

  const [step, setStep] = useState<Step>(1);
  const [state, setState] = useState<State>(EMPTY);
  const [icps, setIcps] = useState<ICPRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const [sugestoesTema, setSugestoesTema] = useState<
    { tema: string; por_que: string }[]
  >([]);
  const [sugestoesManifesto, setSugestoesManifesto] = useState<
    { manifesto: string; por_que: string }[]
  >([]);
  const [sugestoesFronteiras, setSugestoesFronteiras] = useState<string[]>([]);
  const [posResultado, setPosResultado] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [icpResp, terResp, posResp] = await Promise.all([
          fetch(`/api/icp?userId=${user.id}`),
          fetch(`/api/territorio?userId=${user.id}`),
          fetch(`/api/posicionamento?userId=${user.id}`),
        ]);
        const ic = (await icpResp.json()).icps || [];
        setIcps(ic);

        const posData = (await posResp.json()).posicionamento;
        if (posData?.resultado) setPosResultado(posData.resultado);

        const ter = (await terResp.json()).territorio;
        if (ter) {
          setState({
            icp_id: ic[0]?.id || "",
            tema: ter.nome || "",
            lente: ter.lente || "",
            manifesto: ter.manifesto || "",
            fronteiras: ter.fronteiras || [],
          });
          if (ter.nome && ter.manifesto) {
            updateProgress("territorio", true);
            setStep(5);
          }
        } else if (ic[0]) {
          setState((s) => ({ ...s, icp_id: ic[0].id }));
        }
      } finally {
        setLoadingInitial(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const suggestTema = async () => {
    if (!state.icp_id) return toast.error("Selecione um ICP.");
    setLoading(true);
    try {
      const resp = await fetch("/api/territorio/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "tema",
          userId: user.id,
          icpId: state.icp_id,
        }),
      });
      if (!resp.ok) throw new Error();
      const data = await resp.json();
      setSugestoesTema(data.options || []);
    } catch {
      toast.error("Erro ao sugerir.");
    } finally {
      setLoading(false);
    }
  };

  const generateManifestos = async () => {
    if (!state.tema || !state.lente) return;
    setLoading(true);
    try {
      const resp = await fetch("/api/territorio/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "manifesto",
          userId: user.id,
          icpId: state.icp_id,
          tema: state.tema,
          lente: state.lente,
        }),
      });
      if (!resp.ok) throw new Error();
      const data = await resp.json();
      setSugestoesManifesto(data.options || []);
      if (data.options?.[data.recomendada || 0]) {
        setState((s) => ({
          ...s,
          manifesto: data.options[data.recomendada || 0].manifesto,
        }));
      }
    } catch {
      toast.error("Erro ao gerar manifestos.");
    } finally {
      setLoading(false);
    }
  };

  const suggestFronteiras = async () => {
    if (!state.tema || !state.lente || !state.manifesto) return;
    setLoading(true);
    try {
      const resp = await fetch("/api/territorio/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "fronteiras",
          userId: user.id,
          icpId: state.icp_id,
          tema: state.tema,
          lente: state.lente,
          manifesto: state.manifesto,
        }),
      });
      if (!resp.ok) throw new Error();
      const data = await resp.json();
      setSugestoesFronteiras(data.options || []);
      if ((data.options || []).length > 0 && state.fronteiras.length === 0) {
        setState((s) => ({ ...s, fronteiras: data.options }));
      }
    } catch {
      toast.error("Erro ao sugerir fronteiras.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/territorio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          nome: state.tema,
          lente: state.lente,
          manifesto: state.manifesto,
          fronteiras: state.fronteiras,
        }),
      });
      if (!resp.ok) throw new Error();
      updateProgress("territorio", true);
      toast.success("🎉 Território salvo!");
      setStep(5);
    } catch {
      toast.error("Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  const renderURL = (slide: number) =>
    `/api/territorio/render?${new URLSearchParams({
      tema: state.tema,
      lente: state.lente || "",
      manifesto: state.manifesto,
      fronteiras: JSON.stringify(state.fronteiras),
      handle: user.instagram || "",
      resultado: posResultado,
      slide: String(slide),
    }).toString()}`;

  const downloadSlide = async (slide: number) => {
    try {
      const resp = await fetch(renderURL(slide));
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `territorio-${slide + 1}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Erro ao baixar.");
    }
  };

  const downloadAll = async () => {
    toast.info("Baixando todos os slides...");
    for (let i = 0; i < 4; i++) {
      await downloadSlide(i);
      await new Promise((r) => setTimeout(r, 300));
    }
  };

  // ═══════════════════════════════════════════════════════════════════════

  if (loadingInitial) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (icps.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">🗺️ Território</h1>
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-muted-foreground mb-4">
              Você precisa cadastrar um <b>ICP</b> primeiro.
            </p>
            <Button asChild>
              <a href="/produto/icp">Criar ICP</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">🗺️ Território</h1>
        <p className="text-muted-foreground mt-1">
          O universo de significado que você vai ocupar com autoridade.
        </p>
      </div>

      <Stepper current={step} />

      <Separator />

      {/* ETAPA 1: TEMA */}
      {step === 1 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">1. Qual é o TEMA do seu território?</h2>
            <p className="text-sm text-muted-foreground">
              O domínio amplo. Amplo o suficiente pra falar por anos. Estreito o
              suficiente pra virar autoridade.
            </p>

            <Button variant="outline" onClick={suggestTema} disabled={loading}>
              <Sparkles className="mr-2 h-4 w-4" />
              {loading ? "Gerando..." : "Sugerir 3 temas com IA"}
            </Button>

            {sugestoesTema.length > 0 && (
              <div className="space-y-2">
                {sugestoesTema.map((s, i) => (
                  <Card
                    key={i}
                    className={`cursor-pointer transition ${
                      state.tema === s.tema
                        ? "border-primary ring-2 ring-primary/20"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => setState((st) => ({ ...st, tema: s.tema }))}
                  >
                    <CardContent className="p-4 space-y-1">
                      <p className="font-semibold text-lg">{s.tema}</p>
                      <p className="text-xs text-muted-foreground">{s.por_que}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Pencil className="h-3 w-3" /> Ou escreva o seu
              </Label>
              <Input
                placeholder="Ex: Vendas Consultivas B2B"
                value={state.tema}
                onChange={(e) => setState((s) => ({ ...s, tema: e.target.value }))}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!state.tema.trim()}>
                Continuar <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ETAPA 2: LENTE */}
      {step === 2 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">2. Qual LENTE você usa pra ver esse tema?</h2>
            <p className="text-sm text-muted-foreground">
              A lente é o modo único de enxergar. Define como tudo que você criar vai ter um sabor próprio.
            </p>

            <div className="grid md:grid-cols-2 gap-3">
              {Object.entries(LENTES).map(([key, lente]) => (
                <Card
                  key={key}
                  className={`cursor-pointer transition ${
                    state.lente === key
                      ? "border-primary ring-2 ring-primary/20"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => {
                    setState((s) => ({ ...s, lente: key as LenteKey }));
                    setSugestoesManifesto([]);
                  }}
                >
                  <CardContent className="p-5 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{lente.icon}</span>
                      <p className="font-semibold text-lg">{lente.label}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{lente.desc}</p>
                    <p className="text-xs italic text-muted-foreground">
                      Ex: &ldquo;{lente.exemplo}&rdquo;
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button onClick={() => setStep(3)} disabled={!state.lente}>
                Continuar <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ETAPA 3: MANIFESTO */}
      {step === 3 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">3. Seu MANIFESTO</h2>
            <p className="text-sm text-muted-foreground">
              Frase-bandeira que carrega tema + lente. Vira bio, topo de post, resumo do que você defende.
            </p>

            <Button variant="outline" onClick={generateManifestos} disabled={loading}>
              <Sparkles className="mr-2 h-4 w-4" />
              {loading
                ? "Gerando..."
                : sugestoesManifesto.length > 0
                  ? "Gerar outros manifestos"
                  : "Gerar 3 manifestos com IA"}
            </Button>

            {sugestoesManifesto.length > 0 && (
              <div className="space-y-2">
                {sugestoesManifesto.map((s, i) => (
                  <Card
                    key={i}
                    className={`cursor-pointer transition ${
                      state.manifesto === s.manifesto
                        ? "border-primary ring-2 ring-primary/20"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => setState((st) => ({ ...st, manifesto: s.manifesto }))}
                  >
                    <CardContent className="p-4 space-y-1">
                      <p className="font-medium italic text-lg">
                        &ldquo;{s.manifesto}&rdquo;
                      </p>
                      <p className="text-xs text-muted-foreground">{s.por_que}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Pencil className="h-3 w-3" /> Editar livremente
              </Label>
              <Textarea
                rows={2}
                placeholder="Seu manifesto em 1 frase forte..."
                value={state.manifesto}
                onChange={(e) =>
                  setState((s) => ({ ...s, manifesto: e.target.value }))
                }
              />
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button onClick={() => setStep(4)} disabled={!state.manifesto.trim()}>
                Continuar <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ETAPA 4: FRONTEIRAS */}
      {step === 4 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">4. Suas FRONTEIRAS</h2>
            <p className="text-sm text-muted-foreground">
              O que você <b>se recusa</b> a falar. Território sem fronteira vira genérico.
            </p>

            <Button variant="outline" onClick={suggestFronteiras} disabled={loading}>
              <Sparkles className="mr-2 h-4 w-4" />
              {loading ? "Gerando..." : "Sugerir 4 fronteiras com IA"}
            </Button>

            <div className="space-y-2">
              {state.fronteiras.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-destructive">🚫</span>
                  <Input
                    value={f}
                    onChange={(e) => {
                      const copy = [...state.fronteiras];
                      copy[i] = e.target.value;
                      setState((s) => ({ ...s, fronteiras: copy }));
                    }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      setState((s) => ({
                        ...s,
                        fronteiras: s.fronteiras.filter((_, idx) => idx !== i),
                      }))
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setState((s) => ({ ...s, fronteiras: [...s.fronteiras, ""] }))
                }
              >
                <Plus className="mr-2 h-4 w-4" /> Adicionar fronteira
              </Button>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button
                onClick={handleSave}
                disabled={
                  loading || state.fronteiras.filter((f) => f.trim()).length === 0
                }
              >
                <Check className="mr-2 h-4 w-4" />
                {loading ? "Salvando..." : "Salvar território"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ETAPA 5: REVISÃO */}
      {step === 5 && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-semibold">🎉 Seu Território</h2>

              <div className="space-y-3">
                <div>
                  <p className="text-xs uppercase text-muted-foreground tracking-wider">
                    Tema
                  </p>
                  <p className="text-2xl font-bold">{state.tema}</p>
                </div>

                {state.lente && (
                  <div>
                    <p className="text-xs uppercase text-muted-foreground tracking-wider">
                      Lente
                    </p>
                    <p className="text-lg">
                      {LENTES[state.lente]?.icon} {LENTES[state.lente]?.label}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs uppercase text-muted-foreground tracking-wider">
                    Manifesto
                  </p>
                  <p className="text-lg italic">&ldquo;{state.manifesto}&rdquo;</p>
                </div>

                <div>
                  <p className="text-xs uppercase text-muted-foreground tracking-wider mb-2">
                    Fronteiras
                  </p>
                  <ul className="space-y-1">
                    {state.fronteiras
                      .filter((f) => f.trim())
                      .map((f, i) => (
                        <li key={i} className="text-sm">
                          🚫 {f}
                        </li>
                      ))}
                  </ul>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">🎠 Seu carrossel pra postar</h3>
                <Button size="sm" variant="outline" onClick={downloadAll}>
                  <Download className="mr-2 h-4 w-4" /> Baixar todos
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                4 slides (1080×1350). Baixe individualmente ou todos de uma vez.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Image
                      src={renderURL(i)}
                      alt={`Slide ${i + 1}`}
                      width={216}
                      height={270}
                      className="w-full rounded-lg border shadow"
                      unoptimized
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full text-xs"
                      onClick={() => downloadSlide(i)}
                    >
                      <Download className="mr-1 h-3 w-3" /> Slide {i + 1}
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 justify-center flex-wrap pt-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <RotateCcw className="mr-2 h-4 w-4" /> Refazer
                </Button>
                <Button variant="outline" onClick={() => router.push("/dashboard")}>
                  Voltar ao Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function Stepper({ current }: { current: Step }) {
  const labels = ["Tema", "Lente", "Manifesto", "Fronteiras", "Revisão"];
  return (
    <div className="flex items-center justify-between gap-2">
      {labels.map((label, i) => {
        const num = (i + 1) as Step;
        const done = current > num;
        const active = current === num;
        return (
          <div key={i} className="flex-1 flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                active
                  ? "bg-primary text-primary-foreground"
                  : done
                    ? "bg-primary/30 text-primary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {done ? "✓" : num}
            </div>
            <span
              className={`text-xs whitespace-nowrap ${
                active ? "font-semibold" : "text-muted-foreground"
              } hidden md:inline`}
            >
              {label}
            </span>
            {i < labels.length - 1 && (
              <div className="flex-1 h-[2px] bg-muted min-w-4" />
            )}
          </div>
        );
      })}
    </div>
  );
}
