"use client";

import { useEffect, useMemo, useState } from "react";
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
type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

type State = {
  icp_id: string;
  dominio: string;
  ancora_mental: string;
  lente: LenteKey | "";
  tese: string;
  expansao: string;
  fronteiras: string[];
  fronteiras_positivas: string[];
  areas_atuacao: string[];
};

const EMPTY: State = {
  icp_id: "",
  dominio: "",
  ancora_mental: "",
  lente: "",
  tese: "",
  expansao: "",
  fronteiras: [],
  fronteiras_positivas: [],
  areas_atuacao: [],
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
  const [posResultado, setPosResultado] = useState("");

  // Sugestões
  const [sugDominios, setSugDominios] = useState<{ dominio: string; por_que: string }[]>([]);
  const [sugAncoras, setSugAncoras] = useState<{ ancora: string; por_que: string }[]>([]);
  const [sugManifestos, setSugManifestos] = useState<
    { tese: string; expansao: string; por_que: string }[]
  >([]);

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
            dominio: ter.dominio || "",
            ancora_mental: ter.ancora_mental || "",
            lente: ter.lente || "",
            tese: ter.tese || ter.manifesto || "",
            expansao: ter.expansao || "",
            fronteiras: ter.fronteiras || [],
            fronteiras_positivas: ter.fronteiras_positivas || [],
            areas_atuacao: ter.areas_atuacao || [],
          });
          if (ter.dominio && ter.ancora_mental) {
            updateProgress("territorio", true);
            setStep(7);
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

  // ── Sugestões da IA ─────

  const suggestDominio = async () => {
    if (!state.icp_id) return toast.error("Selecione um ICP.");
    setLoading(true);
    try {
      const resp = await fetch("/api/territorio/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "dominio", userId: user.id, icpId: state.icp_id }),
      });
      const data = await resp.json();
      setSugDominios(data.options || []);
    } catch {
      toast.error("Erro ao sugerir.");
    } finally {
      setLoading(false);
    }
  };

  const suggestAncora = async () => {
    if (!state.dominio || !state.lente) return;
    setLoading(true);
    try {
      const resp = await fetch("/api/territorio/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "ancora",
          userId: user.id,
          icpId: state.icp_id,
          dominio: state.dominio,
          lente: state.lente,
        }),
      });
      const data = await resp.json();
      setSugAncoras(data.options || []);
    } catch {
      toast.error("Erro.");
    } finally {
      setLoading(false);
    }
  };

  const suggestManifesto = async () => {
    if (!state.dominio || !state.ancora_mental || !state.lente) return;
    setLoading(true);
    try {
      const resp = await fetch("/api/territorio/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "manifesto",
          userId: user.id,
          icpId: state.icp_id,
          dominio: state.dominio,
          ancora: state.ancora_mental,
          lente: state.lente,
        }),
      });
      const data = await resp.json();
      setSugManifestos(data.options || []);
      if (data.options?.[data.recomendada || 0]) {
        const r = data.options[data.recomendada || 0];
        setState((s) => ({ ...s, tese: r.tese, expansao: r.expansao }));
      }
    } catch {
      toast.error("Erro.");
    } finally {
      setLoading(false);
    }
  };

  const suggestFronteiras = async () => {
    if (!state.tese) return;
    setLoading(true);
    try {
      const resp = await fetch("/api/territorio/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "fronteiras",
          userId: user.id,
          icpId: state.icp_id,
          dominio: state.dominio,
          ancora: state.ancora_mental,
          lente: state.lente,
          tese: state.tese,
        }),
      });
      const data = await resp.json();
      setState((s) => ({
        ...s,
        fronteiras: data.negativas || [],
        fronteiras_positivas: data.positivas || [],
      }));
    } catch {
      toast.error("Erro.");
    } finally {
      setLoading(false);
    }
  };

  const suggestAreas = async () => {
    if (!state.tese) return;
    setLoading(true);
    try {
      const resp = await fetch("/api/territorio/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "areas",
          userId: user.id,
          icpId: state.icp_id,
          dominio: state.dominio,
          ancora: state.ancora_mental,
          tese: state.tese,
        }),
      });
      const data = await resp.json();
      setState((s) => ({ ...s, areas_atuacao: data.areas || [] }));
    } catch {
      toast.error("Erro.");
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
          dominio: state.dominio,
          ancora_mental: state.ancora_mental,
          lente: state.lente,
          tese: state.tese,
          expansao: state.expansao,
          manifesto: state.tese, // legado
          fronteiras: state.fronteiras,
          fronteiras_positivas: state.fronteiras_positivas,
          areas_atuacao: state.areas_atuacao,
        }),
      });
      if (!resp.ok) throw new Error();
      updateProgress("territorio", true);
      toast.success("🎉 Território salvo!");
      setStep(7);
    } catch {
      toast.error("Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  const renderURL = (slide: number) =>
    `/api/territorio/render?${new URLSearchParams({
      ancora: state.ancora_mental,
      tese: state.tese,
      expansao: state.expansao,
      lente: state.lente || "",
      negativas: JSON.stringify(state.fronteiras),
      positivas: JSON.stringify(state.fronteiras_positivas),
      handle: user.instagram || "",
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

  // ─────────────────────────────────────────────────────────────────────────

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
              Cadastre um <b>ICP</b> primeiro.
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
          O espaço mental que sua marca vai dominar.
        </p>
      </div>

      <Stepper current={step} />
      <Separator />

      {/* ETAPA 1: DOMÍNIO */}
      {step === 1 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">
              1. Qual é o DOMÍNIO técnico?
            </h2>
            <p className="text-sm text-muted-foreground">
              Descritivo: o nicho que você atua. Ex: <i>&ldquo;Vendas Consultivas B2B&rdquo;</i>.
              Daqui a pouco transformamos isso numa âncora mental memorável.
            </p>

            <Button variant="outline" onClick={suggestDominio} disabled={loading}>
              <Sparkles className="mr-2 h-4 w-4" />
              {loading ? "Gerando..." : "Sugerir 3 domínios"}
            </Button>

            {sugDominios.length > 0 && (
              <div className="space-y-2">
                {sugDominios.map((s, i) => (
                  <Card
                    key={i}
                    className={`cursor-pointer transition ${
                      state.dominio === s.dominio
                        ? "border-primary ring-2 ring-primary/20"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => setState((st) => ({ ...st, dominio: s.dominio }))}
                  >
                    <CardContent className="p-4 space-y-1">
                      <p className="font-semibold">{s.dominio}</p>
                      <p className="text-xs text-muted-foreground">{s.por_que}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Field label="Ou escreva o seu" hint="Pencil">
              <Input
                placeholder="Ex: Vendas Consultivas B2B"
                value={state.dominio}
                onChange={(e) => setState((s) => ({ ...s, dominio: e.target.value }))}
              />
            </Field>

            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!state.dominio.trim()}>
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
            <h2 className="text-xl font-semibold">
              2. Qual LENTE você usa pra ver o domínio?
            </h2>
            <p className="text-sm text-muted-foreground">
              É como a sua marca enxerga. Define o sabor único da comunicação.
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
                    setSugAncoras([]);
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

            <Nav onBack={() => setStep(1)} onNext={() => setStep(3)} canNext={!!state.lente} />
          </CardContent>
        </Card>
      )}

      {/* ETAPA 3: ÂNCORA MENTAL */}
      {step === 3 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">3. ÂNCORA MENTAL</h2>
            <p className="text-sm text-muted-foreground">
              1-3 palavras emocionais que comunicam o ESPAÇO MENTAL da marca. Não
              descreve o que você faz — é a bandeira que entra na cabeça em 3
              segundos.
            </p>
            <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
              💡 Exemplos: &ldquo;Vender é leitura&rdquo; · &ldquo;A arte de cobrar&rdquo; ·
              &ldquo;Corpo é casa&rdquo;
            </div>

            <Button variant="outline" onClick={suggestAncora} disabled={loading}>
              <Sparkles className="mr-2 h-4 w-4" />
              {loading ? "Gerando..." : "Sugerir 5 âncoras"}
            </Button>

            {sugAncoras.length > 0 && (
              <div className="grid md:grid-cols-2 gap-2">
                {sugAncoras.map((s, i) => (
                  <Card
                    key={i}
                    className={`cursor-pointer transition ${
                      state.ancora_mental === s.ancora
                        ? "border-primary ring-2 ring-primary/20"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() =>
                      setState((st) => ({ ...st, ancora_mental: s.ancora }))
                    }
                  >
                    <CardContent className="p-4 space-y-1">
                      <p className="font-bold text-lg">&ldquo;{s.ancora}&rdquo;</p>
                      <p className="text-xs text-muted-foreground">{s.por_que}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Field label="Ou escreva a sua">
              <Input
                placeholder="Ex: Vender é leitura"
                value={state.ancora_mental}
                onChange={(e) =>
                  setState((s) => ({ ...s, ancora_mental: e.target.value }))
                }
              />
            </Field>

            <Nav
              onBack={() => setStep(2)}
              onNext={() => setStep(4)}
              canNext={!!state.ancora_mental.trim()}
            />
          </CardContent>
        </Card>
      )}

      {/* ETAPA 4: MANIFESTO (Tese + Expansão) */}
      {step === 4 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">4. MANIFESTO</h2>
            <p className="text-sm text-muted-foreground">
              Tese (1 frase forte, idealmente contraintuitiva) + Expansão (1-2
              frases que explicam).
            </p>

            <Button variant="outline" onClick={suggestManifesto} disabled={loading}>
              <Sparkles className="mr-2 h-4 w-4" />
              {loading
                ? "Gerando..."
                : sugManifestos.length > 0
                  ? "Gerar outros manifestos"
                  : "Gerar 3 manifestos"}
            </Button>

            {sugManifestos.length > 0 && (
              <div className="space-y-2">
                {sugManifestos.map((s, i) => (
                  <Card
                    key={i}
                    className={`cursor-pointer transition ${
                      state.tese === s.tese
                        ? "border-primary ring-2 ring-primary/20"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() =>
                      setState((st) => ({
                        ...st,
                        tese: s.tese,
                        expansao: s.expansao,
                      }))
                    }
                  >
                    <CardContent className="p-4 space-y-1">
                      <p className="font-bold italic">&ldquo;{s.tese}&rdquo;</p>
                      <p className="text-sm text-muted-foreground">
                        {s.expansao}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-2">
                        💭 {s.por_que}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Field label="Tese (1 frase forte)">
              <Textarea
                rows={2}
                value={state.tese}
                onChange={(e) => setState((s) => ({ ...s, tese: e.target.value }))}
                placeholder="Ex: Vender não é sorte. É leitura."
              />
            </Field>
            <Field label="Expansão (1-2 frases que explicam)">
              <Textarea
                rows={2}
                value={state.expansao}
                onChange={(e) => setState((s) => ({ ...s, expansao: e.target.value }))}
                placeholder="Ex: Quem fecha consistentemente lê padrões antes de pitch..."
              />
            </Field>

            <Nav
              onBack={() => setStep(3)}
              onNext={() => setStep(5)}
              canNext={!!state.tese.trim()}
            />
          </CardContent>
        </Card>
      )}

      {/* ETAPA 5: FRONTEIRAS (negativas + positivas) */}
      {step === 5 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">5. FRONTEIRAS</h2>
            <p className="text-sm text-muted-foreground">
              O que sua marca NÃO faz (recusa) e o que ela FAZ claramente. Em
              paralelo, dão identidade completa.
            </p>

            <Button variant="outline" onClick={suggestFronteiras} disabled={loading}>
              <Sparkles className="mr-2 h-4 w-4" />
              {loading ? "Gerando..." : "Sugerir fronteiras com IA"}
            </Button>

            <div className="grid md:grid-cols-2 gap-4">
              <ListEditor
                title="🚫 NÃO faz"
                items={state.fronteiras}
                onChange={(items) => setState((s) => ({ ...s, fronteiras: items }))}
                color="destructive"
              />
              <ListEditor
                title="✅ FAZ"
                items={state.fronteiras_positivas}
                onChange={(items) =>
                  setState((s) => ({ ...s, fronteiras_positivas: items }))
                }
                color="primary"
              />
            </div>

            <Nav
              onBack={() => setStep(4)}
              onNext={() => setStep(6)}
              canNext={
                state.fronteiras.filter((f) => f.trim()).length > 0 ||
                state.fronteiras_positivas.filter((f) => f.trim()).length > 0
              }
            />
          </CardContent>
        </Card>
      )}

      {/* ETAPA 6: ÁREAS DE ATUAÇÃO */}
      {step === 6 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">6. ÁREAS DE ATUAÇÃO</h2>
            <p className="text-sm text-muted-foreground">
              Onde o território vira NEGÓCIO. Aplicações práticas: processos,
              sistemas, abordagens, serviços. (Não confundir com editorias ou
              temas de conteúdo.)
            </p>

            <Button variant="outline" onClick={suggestAreas} disabled={loading}>
              <Sparkles className="mr-2 h-4 w-4" />
              {loading ? "Gerando..." : "Sugerir 5 áreas com IA"}
            </Button>

            <ListEditor
              title="Áreas de atuação"
              items={state.areas_atuacao}
              onChange={(items) => setState((s) => ({ ...s, areas_atuacao: items }))}
              color="primary"
              placeholder="Ex: Diagnóstico de Maturidade de Compra"
            />

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(5)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                <Check className="mr-2 h-4 w-4" />
                {loading ? "Salvando..." : "Salvar território"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ETAPA 7: REVISÃO + CARROSSEL */}
      {step === 7 && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-semibold">🎉 Seu Território</h2>

              <div className="space-y-3">
                <Block label="Domínio" value={state.dominio} />
                <Block
                  label="Âncora mental"
                  value={`"${state.ancora_mental}"`}
                  bold
                />
                {state.lente && (
                  <Block
                    label="Lente"
                    value={`${LENTES[state.lente]?.icon} ${LENTES[state.lente]?.label}`}
                  />
                )}
                <Block label="Tese" value={`"${state.tese}"`} italic />
                {state.expansao && (
                  <Block label="Expansão" value={state.expansao} />
                )}

                <div className="grid md:grid-cols-2 gap-4 pt-2">
                  {state.fronteiras.length > 0 && (
                    <div>
                      <p className="text-xs uppercase text-muted-foreground tracking-wider mb-2">
                        🚫 Não faz
                      </p>
                      <ul className="space-y-1">
                        {state.fronteiras.map((f, i) => (
                          <li key={i} className="text-sm">
                            • {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {state.fronteiras_positivas.length > 0 && (
                    <div>
                      <p className="text-xs uppercase text-muted-foreground tracking-wider mb-2">
                        ✅ Faz
                      </p>
                      <ul className="space-y-1">
                        {state.fronteiras_positivas.map((f, i) => (
                          <li key={i} className="text-sm">
                            • {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {state.areas_atuacao.length > 0 && (
                  <div>
                    <p className="text-xs uppercase text-muted-foreground tracking-wider mb-2">
                      Áreas de atuação
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {state.areas_atuacao.map((a, i) => (
                        <span
                          key={i}
                          className="text-xs bg-secondary px-2 py-1 rounded"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">🎠 Carrossel pra postar</h3>
                <Button size="sm" variant="outline" onClick={downloadAll}>
                  <Download className="mr-2 h-4 w-4" /> Baixar todos
                </Button>
              </div>

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

// ─── Helpers ──────────────────────────────────────────────────────────────

function Stepper({ current }: { current: Step }) {
  const labels = ["Domínio", "Lente", "Âncora", "Manifesto", "Fronteiras", "Atuação", "Revisão"];
  return (
    <div className="flex items-center justify-between gap-1 overflow-x-auto">
      {labels.map((label, i) => {
        const num = (i + 1) as Step;
        const done = current > num;
        const active = current === num;
        return (
          <div key={i} className="flex items-center gap-1 flex-shrink-0">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold ${
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
              className={`text-[11px] whitespace-nowrap ${
                active ? "font-semibold" : "text-muted-foreground"
              } hidden lg:inline`}
            >
              {label}
            </span>
            {i < labels.length - 1 && (
              <div className="w-3 lg:w-5 h-[2px] bg-muted" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-2">
        {hint === "Pencil" && <Pencil className="h-3 w-3" />}
        {label}
      </Label>
      {children}
    </div>
  );
}

function Nav({
  onBack,
  onNext,
  canNext,
}: {
  onBack: () => void;
  onNext: () => void;
  canNext: boolean;
}) {
  return (
    <div className="flex justify-between">
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>
      <Button onClick={onNext} disabled={!canNext}>
        Continuar <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

function ListEditor({
  title,
  items,
  onChange,
  color,
  placeholder,
}: {
  title: string;
  items: string[];
  onChange: (items: string[]) => void;
  color: "destructive" | "primary";
  placeholder?: string;
}) {
  const colorClass =
    color === "destructive" ? "text-destructive" : "text-primary";

  return (
    <div className="space-y-2">
      <Label className={colorClass}>{title}</Label>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            value={item}
            onChange={(e) => {
              const copy = [...items];
              copy[i] = e.target.value;
              onChange(copy);
            }}
            placeholder={placeholder}
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="ghost" size="sm" onClick={() => onChange([...items, ""])}>
        <Plus className="mr-2 h-4 w-4" /> Adicionar
      </Button>
    </div>
  );
}

function Block({
  label,
  value,
  bold,
  italic,
}: {
  label: string;
  value: string;
  bold?: boolean;
  italic?: boolean;
}) {
  return (
    <div>
      <p className="text-xs uppercase text-muted-foreground tracking-wider">
        {label}
      </p>
      <p
        className={`${bold ? "text-2xl font-bold" : "text-base"} ${italic ? "italic" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
