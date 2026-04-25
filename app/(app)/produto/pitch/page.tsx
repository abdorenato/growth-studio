"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, Sparkles, RefreshCw, Save, Trash2, Mic, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { useUserStore } from "@/hooks/use-user-store";

type Answer = { question: string; answer: string };

type SavedPitch = {
  id: string;
  oferta_id: string;
  icp_id: string | null;
  answers: Answer[];
  pitch_text: string;
  elevator_pitch_text?: string | null;
  carta_vendas_text?: string | null;
  created_at?: string;
  updated_at?: string;
};

type ICP = { id: string; name: string };
type Oferta = { id: string; name: string };

export default function PitchPage() {
  const user = useUserStore((s) => s.user)!;

  const [icps, setIcps] = useState<ICP[]>([]);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [icpId, setIcpId] = useState("");
  const [ofertaId, setOfertaId] = useState("");

  const [answers, setAnswers] = useState<Answer[]>([]);
  const [pitch, setPitch] = useState("");
  const [loading, setLoading] = useState(false);

  const [savedPitches, setSavedPitches] = useState<SavedPitch[]>([]);
  const [currentPitchId, setCurrentPitchId] = useState<string | null>(null);

  // Artefatos derivados do pitch salvo (so visiveis quando ha pitch salvo)
  const [elevatorText, setElevatorText] = useState("");
  const [cartaText, setCartaText] = useState("");
  const [loadingElevator, setLoadingElevator] = useState(false);
  const [loadingCarta, setLoadingCarta] = useState(false);
  const [savingElevator, setSavingElevator] = useState(false);
  const [savingCarta, setSavingCarta] = useState(false);

  // ── Carregar ICPs + Ofertas ─────
  useEffect(() => {
    (async () => {
      const [icpResp, ofResp] = await Promise.all([
        fetch(`/api/icp?userId=${user.id}`),
        fetch(`/api/oferta?userId=${user.id}`),
      ]);
      const ic = (await icpResp.json()).icps || [];
      const of = (await ofResp.json()).ofertas || [];
      setIcps(ic);
      setOfertas(of);
      if (ic[0]) setIcpId(ic[0].id);
      if (of[0]) setOfertaId(of[0].id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  // ── Carregar pitches salvos da oferta selecionada ─────
  useEffect(() => {
    if (!ofertaId) return;
    (async () => {
      try {
        const resp = await fetch(
          `/api/pitch?userId=${user.id}&ofertaId=${ofertaId}`
        );
        const data = await resp.json();
        setSavedPitches(data.pitches || []);
      } catch {
        // silencia
      }
    })();
  }, [ofertaId, user.id]);

  // ── Gerar pitch ─────
  const handleGenerate = async () => {
    if (!icpId || !ofertaId) return toast.error("Selecione ICP e Oferta.");
    setLoading(true);
    try {
      const resp = await fetch("/api/pitch/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, icpId, ofertaId }),
      });
      if (!resp.ok) throw new Error();
      const data = await resp.json();
      setAnswers(data.answers || []);
      setPitch(data.pitch || "");
      setCurrentPitchId(null); // não está editando um existente
      setElevatorText(""); // novo pitch -> reseta artefatos
      setCartaText("");
    } catch {
      toast.error("Erro ao gerar pitch.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateFinal = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/pitch/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, icpId, ofertaId, mode: "final", answers }),
      });
      if (!resp.ok) throw new Error();
      const data = await resp.json();
      setPitch(data.pitch || "");
      toast.success("Pitch regerado!");
    } catch {
      toast.error("Erro.");
    } finally {
      setLoading(false);
    }
  };

  // ── Salvar pitch ─────
  const handleSave = async () => {
    if (!pitch.trim()) return toast.error("Nada pra salvar.");
    setLoading(true);
    try {
      if (currentPitchId) {
        // Atualiza existente
        const resp = await fetch(`/api/pitch/${currentPitchId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pitch_text: pitch, answers }),
        });
        if (!resp.ok) throw new Error();
        const data = await resp.json();
        setSavedPitches((prev) =>
          prev.map((p) => (p.id === currentPitchId ? data.pitch : p))
        );
        toast.success("Pitch atualizado!");
      } else {
        // Cria novo
        const resp = await fetch("/api/pitch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            ofertaId,
            icpId,
            answers,
            pitch_text: pitch,
          }),
        });
        if (!resp.ok) throw new Error();
        const data = await resp.json();
        setSavedPitches((prev) => [data.pitch, ...prev]);
        setCurrentPitchId(data.pitch.id);
        toast.success("Pitch salvo!");
      }
    } catch {
      toast.error("Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  // ── Carregar pitch salvo na edição ─────
  const loadPitch = (sp: SavedPitch) => {
    setCurrentPitchId(sp.id);
    setAnswers(sp.answers || []);
    setPitch(sp.pitch_text || "");
    setElevatorText(sp.elevator_pitch_text || "");
    setCartaText(sp.carta_vendas_text || "");
    if (sp.icp_id) setIcpId(sp.icp_id);
    toast.success("Pitch carregado pra edição.");
  };

  // ── Gerar elevator pitch / carta de vendas ─────
  const handleDerive = async (kind: "elevator" | "carta") => {
    if (!currentPitchId) {
      return toast.error("Salve o pitch principal antes de gerar derivados.");
    }
    if (kind === "elevator") setLoadingElevator(true);
    else setLoadingCarta(true);
    try {
      const resp = await fetch(`/api/pitch/${currentPitchId}/derive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      if (!resp.ok) throw new Error();
      const data = await resp.json();
      if (kind === "elevator") setElevatorText(data.text || "");
      else setCartaText(data.text || "");
      toast.success(
        kind === "elevator" ? "Elevator pitch gerado!" : "Carta de vendas gerada!"
      );
    } catch {
      toast.error("Erro ao gerar.");
    } finally {
      if (kind === "elevator") setLoadingElevator(false);
      else setLoadingCarta(false);
    }
  };

  // ── Salvar elevator / carta no banco ─────
  const handleSaveDerived = async (kind: "elevator" | "carta") => {
    if (!currentPitchId) return;
    const text = kind === "elevator" ? elevatorText : cartaText;
    if (!text.trim()) return toast.error("Nada pra salvar.");
    if (kind === "elevator") setSavingElevator(true);
    else setSavingCarta(true);
    try {
      const body =
        kind === "elevator"
          ? { elevator_pitch_text: text }
          : { carta_vendas_text: text };
      const resp = await fetch(`/api/pitch/${currentPitchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!resp.ok) throw new Error();
      const data = await resp.json();
      // sincroniza lista
      setSavedPitches((prev) =>
        prev.map((p) => (p.id === currentPitchId ? data.pitch : p))
      );
      toast.success("Salvo!");
    } catch {
      toast.error("Erro ao salvar.");
    } finally {
      if (kind === "elevator") setSavingElevator(false);
      else setSavingCarta(false);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  // ── Deletar ─────
  const deletePitch = async (id: string) => {
    if (!confirm("Apagar esse pitch?")) return;
    try {
      const resp = await fetch(`/api/pitch/${id}`, { method: "DELETE" });
      if (!resp.ok) throw new Error();
      setSavedPitches((prev) => prev.filter((p) => p.id !== id));
      if (currentPitchId === id) {
        setCurrentPitchId(null);
        setPitch("");
        setAnswers([]);
        setElevatorText("");
        setCartaText("");
      }
      toast.success("Pitch apagado.");
    } catch {
      toast.error("Erro ao apagar.");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(pitch);
    toast.success("Copiado!");
  };

  if (ofertas.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">🎤 Pitch</h1>
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-muted-foreground mb-4">
              Você precisa criar uma Oferta primeiro.
            </p>
            <Button asChild>
              <a href="/produto/oferta">Criar Oferta</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">🎤 Pitch</h1>
        <p className="text-muted-foreground mt-1">
          Discurso de venda baseado em ICP + Oferta. Salve e revise quando quiser.
        </p>
      </div>

      <Separator />

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="ICP">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={icpId}
                onChange={(e) => setIcpId(e.target.value)}
              >
                {icps.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Oferta">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={ofertaId}
                onChange={(e) => setOfertaId(e.target.value)}
              >
                {ofertas.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {loading ? "Gerando..." : "Gerar novo pitch com IA"}
          </Button>
        </CardContent>
      </Card>

      {/* Pitches salvos da oferta */}
      {savedPitches.length > 0 && (
        <div className="space-y-2">
          <Label className="text-base">
            💾 Pitches salvos pra essa oferta ({savedPitches.length})
          </Label>
          {savedPitches.map((sp) => (
            <Card
              key={sp.id}
              className={
                currentPitchId === sp.id
                  ? "border-primary ring-2 ring-primary/20"
                  : ""
              }
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {sp.created_at
                        ? new Date(sp.created_at).toLocaleString("pt-BR")
                        : ""}
                      {sp.updated_at &&
                        sp.updated_at !== sp.created_at &&
                        " · editado"}
                    </p>
                    <p className="text-sm mt-1 line-clamp-2 text-muted-foreground">
                      {sp.pitch_text?.slice(0, 200)}
                      {(sp.pitch_text?.length || 0) > 200 ? "..." : ""}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => loadPitch(sp)}
                    >
                      Abrir
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deletePitch(sp.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {answers.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            {currentPitchId ? "Editando pitch" : "5 perguntas do pitch"}
          </h2>
          {answers.map((a, i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-2">
                <p className="text-sm font-medium text-primary">
                  {i + 1}. {a.question}
                </p>
                <Textarea
                  value={a.answer}
                  onChange={(e) => {
                    const copy = [...answers];
                    copy[i] = { ...copy[i], answer: e.target.value };
                    setAnswers(copy);
                  }}
                  rows={3}
                />
              </CardContent>
            </Card>
          ))}

          <Button
            onClick={handleRegenerateFinal}
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Gerar pitch final com minhas edições
          </Button>
        </div>
      )}

      {pitch && (
        <div className="space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg font-semibold">🎯 Pitch final</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="mr-2 h-4 w-4" /> Copiar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {currentPitchId ? "Atualizar" : "Salvar pitch"}
              </Button>
            </div>
          </div>
          <Card>
            <CardContent className="p-6">
              <Textarea
                value={pitch}
                onChange={(e) => setPitch(e.target.value)}
                rows={12}
                className="text-sm leading-relaxed"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Artefatos derivados ── */}
      {pitch && (
        <>
          <Separator />

          <div>
            <h2 className="text-lg font-semibold">📦 Versões deste pitch</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Geradas a partir do pitch acima. Edite e salve cada uma separadamente.
            </p>
          </div>

          {!currentPitchId && (
            <Card className="border-amber-500/40 bg-amber-500/5">
              <CardContent className="p-4 text-sm">
                <span className="font-medium text-amber-700 dark:text-amber-400">
                  ⚠️ Salve o pitch principal primeiro
                </span>
                <p className="text-muted-foreground mt-1">
                  Pra gerar o elevator pitch e a carta de vendas, clique em{" "}
                  <b>Salvar pitch</b> acima. Isso cria o registro no banco que serve
                  de âncora pras versões derivadas.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Elevator pitch */}
          <DerivedBlock
            icon={<Mic className="h-4 w-4" />}
            title="Elevator pitch"
            subtitle="Versão curta pra falar em ~30 segundos (70-100 palavras)."
            text={elevatorText}
            onChange={setElevatorText}
            onGenerate={() => handleDerive("elevator")}
            onSave={() => handleSaveDerived("elevator")}
            onCopy={() => copyText(elevatorText)}
            generating={loadingElevator}
            saving={savingElevator}
            disabled={!currentPitchId}
            rows={6}
          />

          {/* Carta de vendas */}
          <DerivedBlock
            icon={<Mail className="h-4 w-4" />}
            title="Carta de vendas"
            subtitle="Long form (800-1500 palavras) — base pra email longo ou roteiro de VSL."
            text={cartaText}
            onChange={setCartaText}
            onGenerate={() => handleDerive("carta")}
            onSave={() => handleSaveDerived("carta")}
            onCopy={() => copyText(cartaText)}
            generating={loadingCarta}
            saving={savingCarta}
            disabled={!currentPitchId}
            rows={20}
          />
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Bloco visual reutilizado pra elevator e carta de vendas
// ─────────────────────────────────────────────────────────
function DerivedBlock({
  icon,
  title,
  subtitle,
  text,
  onChange,
  onGenerate,
  onSave,
  onCopy,
  generating,
  saving,
  rows,
  disabled = false,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  text: string;
  onChange: (v: string) => void;
  onGenerate: () => void;
  onSave: () => void;
  onCopy: () => void;
  generating: boolean;
  saving: boolean;
  rows: number;
  disabled?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-6 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-2 min-w-0">
            <div className="mt-0.5 text-primary">{icon}</div>
            <div className="min-w-0">
              <h3 className="font-semibold">{title}</h3>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={onGenerate}
              disabled={generating || saving || disabled}
            >
              {text ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {generating ? "Regerando..." : "Regerar"}
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {generating ? "Gerando..." : "Gerar com IA"}
                </>
              )}
            </Button>
            {text && (
              <>
                <Button size="sm" variant="ghost" onClick={onCopy}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={onSave} disabled={saving || generating || disabled}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
              </>
            )}
          </div>
        </div>

        {text && (
          <Textarea
            value={text}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            className="text-sm leading-relaxed"
          />
        )}
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
