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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { useUserStore } from "@/hooks/use-user-store";

type ICPRow = { id: string; name: string; niche: string };

type DiferencialCat = "metodo" | "filosofia" | "origem";

const CATEGORIAS: Record<DiferencialCat, { label: string; icon: string; desc: string }> = {
  metodo: {
    label: "Método / Sistema",
    icon: "🔧",
    desc: "O COMO técnico que só você faz.",
  },
  filosofia: {
    label: "Filosofia / Crença",
    icon: "💭",
    desc: "Uma visão contrária ao mercado.",
  },
  origem: {
    label: "Origem / História",
    icon: "📖",
    desc: "Uma credencial pessoal única.",
  },
};

type Step = 1 | 2 | 3 | 4 | 5;

type State = {
  icp_id: string;
  resultado: string;
  mecanismo_descricao: string;
  mecanismo_nome: string;
  diferencial_categoria: DiferencialCat | "";
  diferencial_frase: string;
  // Declaração polida pela IA
  declaracao_principal: string;
  declaracao_variacoes: string[];
  frase_apoio: string;
};

const EMPTY: State = {
  icp_id: "",
  resultado: "",
  mecanismo_descricao: "",
  mecanismo_nome: "",
  diferencial_categoria: "",
  diferencial_frase: "",
  declaracao_principal: "",
  declaracao_variacoes: [],
  frase_apoio: "",
};

export default function PosicionamentoPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user)!;
  const updateProgress = useUserStore((s) => s.updateProgress);

  const [step, setStep] = useState<Step>(1);
  const [state, setState] = useState<State>(EMPTY);
  const [icps, setIcps] = useState<ICPRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Sugestões carregadas
  const [sugestoesResultado, setSugestoesResultado] = useState<
    { resultado: string; por_que: string }[]
  >([]);
  const [sugestoesNome, setSugestoesNome] = useState<
    { nome: string; por_que: string }[]
  >([]);
  const [sugestoesDiferencial, setSugestoesDiferencial] = useState<
    { diferencial: string; por_que: string }[]
  >([]);

  // Carregar ICPs e posicionamento existente
  useEffect(() => {
    (async () => {
      try {
        const [icpResp, posResp] = await Promise.all([
          fetch(`/api/icp?userId=${user.id}`),
          fetch(`/api/posicionamento?userId=${user.id}`),
        ]);
        const ic = (await icpResp.json()).icps || [];
        setIcps(ic);

        const posData = (await posResp.json()).posicionamento;
        if (posData) {
          setState({
            icp_id: posData.icp_id || ic[0]?.id || "",
            resultado: posData.resultado || "",
            mecanismo_descricao: posData.mecanismo_descricao || "",
            mecanismo_nome: posData.mecanismo_nome || "",
            diferencial_categoria: posData.diferencial_categoria || "",
            diferencial_frase: posData.diferencial_frase || "",
            declaracao_principal: posData.frase || "",
            declaracao_variacoes: [],
            frase_apoio: posData.frase_apoio || "",
          });
          if (posData.frase) {
            updateProgress("posicionamento", true);
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

  // ── Frase montada ─────
  const icpName = icps.find((i) => i.id === state.icp_id)?.name || "";
  const mecanismoTxt = state.mecanismo_nome
    ? `${state.mecanismo_nome}${state.mecanismo_descricao ? ` — ${state.mecanismo_descricao}` : ""}`
    : state.mecanismo_descricao;

  const fraseMontada = `Eu ajudo ${icpName || "[ICP]"} a ${
    state.resultado || "[resultado]"
  } através de ${mecanismoTxt || "[mecanismo]"} e me diferencio porque ${
    state.diferencial_frase || "[diferencial]"
  }.`;

  // ── Actions ─────

  const suggestResultado = async () => {
    if (!state.icp_id) return toast.error("Selecione um ICP.");
    setLoading(true);
    try {
      const resp = await fetch("/api/posicionamento/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "resultado",
          userId: user.id,
          icpId: state.icp_id,
        }),
      });
      const data = await resp.json();
      setSugestoesResultado(data.options || []);
    } catch {
      toast.error("Erro.");
    } finally {
      setLoading(false);
    }
  };

  const suggestNomeMecanismo = async () => {
    if (!state.mecanismo_descricao.trim())
      return toast.error("Descreva o método primeiro.");
    setLoading(true);
    try {
      const resp = await fetch("/api/posicionamento/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "mecanismo-nome",
          userId: user.id,
          icpId: state.icp_id,
          descricao: state.mecanismo_descricao,
        }),
      });
      const data = await resp.json();
      setSugestoesNome(data.names || []);
    } catch {
      toast.error("Erro.");
    } finally {
      setLoading(false);
    }
  };

  const suggestDiferencial = async () => {
    if (!state.diferencial_categoria) return toast.error("Escolha uma categoria.");
    setLoading(true);
    try {
      const resp = await fetch("/api/posicionamento/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "diferencial",
          userId: user.id,
          icpId: state.icp_id,
          categoria: state.diferencial_categoria,
        }),
      });
      const data = await resp.json();
      setSugestoesDiferencial(data.options || []);
    } catch {
      toast.error("Erro.");
    } finally {
      setLoading(false);
    }
  };

  // Gera a declaração polida (1 principal + 2 variações + frase de apoio)
  const generateDeclaracao = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/posicionamento/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "declaracao",
          userId: user.id,
          icpId: state.icp_id,
          resultado: state.resultado,
          mecanismo_nome: state.mecanismo_nome,
          mecanismo_descricao: state.mecanismo_descricao,
          diferencial: state.diferencial_frase,
        }),
      });
      if (!resp.ok) throw new Error();
      const data = await resp.json();
      setState((s) => ({
        ...s,
        declaracao_principal: data.principal || "",
        declaracao_variacoes: data.variacoes || [],
        frase_apoio: data.frase_apoio || "",
      }));
      toast.success("Declaração gerada!");
    } catch {
      toast.error("Erro ao gerar declaração.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!state.declaracao_principal.trim()) {
      toast.error("Gere a declaração antes de salvar.");
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch("/api/posicionamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          frase: state.declaracao_principal,
          frase_apoio: state.frase_apoio,
          icp_id: state.icp_id,
          resultado: state.resultado,
          mecanismo_descricao: state.mecanismo_descricao,
          mecanismo_nome: state.mecanismo_nome,
          diferencial_categoria: state.diferencial_categoria,
          diferencial_frase: state.diferencial_frase,
        }),
      });
      if (!resp.ok) throw new Error();
      updateProgress("posicionamento", true);
      toast.success("🎉 Posicionamento salvo!");
      setStep(5);
    } catch {
      toast.error("Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  const renderURL = () =>
    `/api/posicionamento/render?${new URLSearchParams({
      declaracao: state.declaracao_principal,
      fraseApoio: state.frase_apoio,
      handle: user.instagram || "",
    }).toString()}`;

  const downloadImage = async () => {
    try {
      const resp = await fetch(renderURL());
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "meu-posicionamento.png";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Erro ao baixar.");
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

  // Precisa de ICP
  if (icps.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">📍 Posicionamento</h1>
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-muted-foreground mb-4">
              Você precisa cadastrar um <b>ICP</b> antes do posicionamento.
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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📍 Posicionamento</h1>
        <p className="text-muted-foreground mt-1">
          Monte sua frase de posicionamento em 4 passos.
        </p>
      </div>

      {/* Stepper */}
      <Stepper current={step} />

      <Separator />

      {/* ETAPA 1: ICP */}
      {step === 1 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">1. Pra quem você entrega?</h2>
            <p className="text-sm text-muted-foreground">
              Selecione o ICP que você vai posicionar-se para.
            </p>
            <div className="space-y-2">
              {icps.map((icp) => (
                <Card
                  key={icp.id}
                  className={`cursor-pointer transition ${
                    state.icp_id === icp.id
                      ? "border-primary ring-2 ring-primary/20"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setState((s) => ({ ...s, icp_id: icp.id }))}
                >
                  <CardContent className="p-4">
                    <p className="font-medium">{icp.name}</p>
                    <p className="text-sm text-muted-foreground">{icp.niche}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={!state.icp_id}
              >
                Continuar <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ETAPA 2: RESULTADO */}
      {step === 2 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">2. Qual é o resultado que você entrega?</h2>
            <p className="text-sm text-muted-foreground">
              Posso sugerir baseado no seu ICP, ou você preenche.
            </p>

            <Button
              variant="outline"
              onClick={suggestResultado}
              disabled={loading}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {loading ? "Gerando..." : "Sugerir com IA"}
            </Button>

            {sugestoesResultado.length > 0 && (
              <div className="space-y-2">
                {sugestoesResultado.map((s, i) => (
                  <Card
                    key={i}
                    className={`cursor-pointer transition ${
                      state.resultado === s.resultado
                        ? "border-primary ring-2 ring-primary/20"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => setState((st) => ({ ...st, resultado: s.resultado }))}
                  >
                    <CardContent className="p-4 space-y-1">
                      <p className="font-medium">&quot;{s.resultado}&quot;</p>
                      <p className="text-xs text-muted-foreground">{s.por_que}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Pencil className="h-3 w-3" /> Escrever ou editar
              </Label>
              <Textarea
                rows={2}
                placeholder="Ex: dobrar o faturamento em 12 meses sem virar infoprodutor"
                value={state.resultado}
                onChange={(e) => setState((st) => ({ ...st, resultado: e.target.value }))}
              />
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!state.resultado.trim()}
              >
                Continuar <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ETAPA 3: MECANISMO */}
      {step === 3 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">3. Como você entrega isso?</h2>
            <p className="text-sm text-muted-foreground">
              Descreva o seu método/processo com suas palavras. Depois eu sugiro um nome.
            </p>

            <div className="space-y-2">
              <Label>Descrição do método</Label>
              <Textarea
                rows={3}
                placeholder="Ex: faço reuniões de descoberta em 3 camadas: dor, contexto, urgência. Depois uso um framework de proposta com 7 pilares."
                value={state.mecanismo_descricao}
                onChange={(e) =>
                  setState((st) => ({ ...st, mecanismo_descricao: e.target.value }))
                }
              />
            </div>

            <Button
              variant="outline"
              onClick={suggestNomeMecanismo}
              disabled={loading || !state.mecanismo_descricao.trim()}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {loading ? "Gerando..." : "Sugerir nome do método com IA"}
            </Button>

            {sugestoesNome.length > 0 && (
              <div className="grid md:grid-cols-3 gap-2">
                {sugestoesNome.map((n, i) => (
                  <Card
                    key={i}
                    className={`cursor-pointer transition ${
                      state.mecanismo_nome === n.nome
                        ? "border-primary ring-2 ring-primary/20"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => setState((st) => ({ ...st, mecanismo_nome: n.nome }))}
                  >
                    <CardContent className="p-3 space-y-1">
                      <p className="font-semibold">{n.nome}</p>
                      <p className="text-xs text-muted-foreground">{n.por_que}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Pencil className="h-3 w-3" /> Nome (opcional, pode deixar em branco)
              </Label>
              <Input
                placeholder="Ex: Método D3, Blueprint Consultivo"
                value={state.mecanismo_nome}
                onChange={(e) => setState((st) => ({ ...st, mecanismo_nome: e.target.value }))}
              />
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button
                onClick={() => setStep(4)}
                disabled={!state.mecanismo_descricao.trim()}
              >
                Continuar <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ETAPA 4: DIFERENCIAL */}
      {step === 4 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">4. Por que você e não outro?</h2>
            <p className="text-sm text-muted-foreground">
              Seu diferencial tem uma cara. Escolha a categoria que mais ressoa:
            </p>

            <div className="grid md:grid-cols-3 gap-2">
              {Object.entries(CATEGORIAS).map(([key, cat]) => (
                <Card
                  key={key}
                  className={`cursor-pointer transition ${
                    state.diferencial_categoria === key
                      ? "border-primary ring-2 ring-primary/20"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => {
                    setState((st) => ({
                      ...st,
                      diferencial_categoria: key as DiferencialCat,
                    }));
                    setSugestoesDiferencial([]);
                  }}
                >
                  <CardContent className="p-4 space-y-1">
                    <p className="text-2xl">{cat.icon}</p>
                    <p className="font-semibold">{cat.label}</p>
                    <p className="text-xs text-muted-foreground">{cat.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {state.diferencial_categoria && (
              <>
                <Button
                  variant="outline"
                  onClick={suggestDiferencial}
                  disabled={loading}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {loading ? "Gerando..." : "Sugerir 3 opções com IA"}
                </Button>

                {sugestoesDiferencial.length > 0 && (
                  <div className="space-y-2">
                    {sugestoesDiferencial.map((s, i) => (
                      <Card
                        key={i}
                        className={`cursor-pointer transition ${
                          state.diferencial_frase === s.diferencial
                            ? "border-primary ring-2 ring-primary/20"
                            : "hover:border-primary/50"
                        }`}
                        onClick={() =>
                          setState((st) => ({ ...st, diferencial_frase: s.diferencial }))
                        }
                      >
                        <CardContent className="p-4 space-y-1">
                          <p className="font-medium">&quot;{s.diferencial}&quot;</p>
                          <p className="text-xs text-muted-foreground">{s.por_que}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Pencil className="h-3 w-3" /> Escrever ou editar
                  </Label>
                  <Textarea
                    rows={2}
                    placeholder="Complete: e me diferencio porque..."
                    value={state.diferencial_frase}
                    onChange={(e) =>
                      setState((st) => ({ ...st, diferencial_frase: e.target.value }))
                    }
                  />
                </div>
              </>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button
                onClick={() => setStep(5)}
                disabled={!state.diferencial_frase.trim() || loading}
              >
                Continuar <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ETAPA 5: DECLARAÇÃO POLIDA + REVISÃO + IMAGEM */}
      {step === 5 && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">📍 Sua declaração de posicionamento</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Curta, clara, repetível em voz alta. Diferencial e método ficam separados em &quot;frase de apoio&quot;.
                  </p>
                </div>
              </div>

              {/* Botão pra gerar (ou regerar) */}
              <Button
                onClick={generateDeclaracao}
                disabled={loading}
                variant={state.declaracao_principal ? "outline" : "default"}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {loading
                  ? "Gerando..."
                  : state.declaracao_principal
                    ? "Regerar declaração"
                    : "Gerar declaração com IA"}
              </Button>

              {/* Declaração principal + variações */}
              {state.declaracao_principal && (
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                      Declaração principal
                    </Label>
                    <Textarea
                      value={state.declaracao_principal}
                      onChange={(e) =>
                        setState((s) => ({ ...s, declaracao_principal: e.target.value }))
                      }
                      rows={2}
                      className="text-base font-medium"
                    />
                  </div>

                  {state.declaracao_variacoes.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                        Variações alternativas (clique pra usar)
                      </Label>
                      {state.declaracao_variacoes.map((v, i) => (
                        <Card
                          key={i}
                          className="cursor-pointer hover:border-primary/50 transition"
                          onClick={() =>
                            setState((s) => ({ ...s, declaracao_principal: v }))
                          }
                        >
                          <CardContent className="p-3 text-sm italic">
                            &ldquo;{v}&rdquo;
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                      Frase de apoio (diferencial / autoridade — usa depois da principal)
                    </Label>
                    <Textarea
                      value={state.frase_apoio}
                      onChange={(e) =>
                        setState((s) => ({ ...s, frase_apoio: e.target.value }))
                      }
                      rows={2}
                      className="text-sm"
                      placeholder="Ex: Faço isso através do Método D3, que combina diagnóstico em 3 camadas..."
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-2">
                    <Button variant="outline" onClick={() => setStep(4)}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                      <Check className="mr-2 h-4 w-4" />
                      {loading ? "Salvando..." : "Confirmar e salvar"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Story visual — só aparece após salvar */}
              {state.declaracao_principal && (
                <>
                  <Separator />

                  <h3 className="text-sm font-semibold">🖼️ Seu story pra postar</h3>
                  <div className="max-w-xs mx-auto">
                    <Image
                      src={renderURL()}
                      alt="Meu posicionamento"
                      width={320}
                      height={569}
                      className="w-full rounded-xl border shadow-lg"
                      unoptimized
                    />
                  </div>

                  <div className="flex gap-3 justify-center flex-wrap">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      <RotateCcw className="mr-2 h-4 w-4" /> Refazer
                    </Button>
                    <Button onClick={downloadImage}>
                      <Download className="mr-2 h-4 w-4" /> Baixar imagem
                    </Button>
                    <Button variant="outline" onClick={() => router.push("/dashboard")}>
                      Voltar ao Dashboard
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function Stepper({ current }: { current: Step }) {
  const labels = ["ICP", "Resultado", "Mecanismo", "Diferencial", "Revisão"];
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
