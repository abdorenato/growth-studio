"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, Sparkles, RefreshCw, Save, Trash2 } from "lucide-react";

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
        body: JSON.stringify({ icpId, ofertaId }),
      });
      if (!resp.ok) throw new Error();
      const data = await resp.json();
      setAnswers(data.answers || []);
      setPitch(data.pitch || "");
      setCurrentPitchId(null); // não está editando um existente
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
        body: JSON.stringify({ icpId, ofertaId, mode: "final", answers }),
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
    if (sp.icp_id) setIcpId(sp.icp_id);
    toast.success("Pitch carregado pra edição.");
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
    </div>
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
