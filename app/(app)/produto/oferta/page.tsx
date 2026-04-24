"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sparkles, ArrowLeft, RotateCcw, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { useUserStore } from "@/hooks/use-user-store";
import type { Offer } from "@/types";

type ICPRow = {
  id: string;
  name: string;
  niche: string;
};

type Step = "input" | "review" | "saved";

type Generated = Omit<Offer, "id" | "icp_id" | "user_id"> & {
  name: string;
};

export default function OfertaPage() {
  const user = useUserStore((s) => s.user)!;
  const updateProgress = useUserStore((s) => s.updateProgress);

  const [step, setStep] = useState<Step>("input");
  const [icps, setIcps] = useState<ICPRow[]>([]);
  const [selectedICP, setSelectedICP] = useState("");
  const [product, setProduct] = useState("");
  const [differentiator, setDifferentiator] = useState("");
  const [priceRange, setPriceRange] = useState("R$100-500");
  const [generated, setGenerated] = useState<Generated | null>(null);
  const [loading, setLoading] = useState(false);
  const [ofertas, setOfertas] = useState<any[]>([]);
  const [focoId, setFocoId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [icpResp, ofResp, focoResp] = await Promise.all([
        fetch(`/api/icp?userId=${user.id}`),
        fetch(`/api/oferta?userId=${user.id}`),
        fetch(`/api/users/oferta-foco?userId=${user.id}`),
      ]);
      const icpData = await icpResp.json();
      const ofData = await ofResp.json();
      const focoData = await focoResp.json();
      setIcps(icpData.icps || []);
      setOfertas(ofData.ofertas || []);
      setFocoId(focoData.oferta?.id || null);
      if (icpData.icps?.length > 0 && !selectedICP) {
        setSelectedICP(icpData.icps[0].id);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const handleGenerate = async () => {
    if (!selectedICP) return toast.error("Selecione um ICP.");
    if (!product.trim() || !differentiator.trim()) {
      return toast.error("Preencha produto e diferencial.");
    }
    setLoading(true);
    try {
      const resp = await fetch("/api/oferta/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          icpId: selectedICP,
          product,
          differentiator,
          priceRange,
        }),
      });
      if (!resp.ok) throw new Error();
      const data = await resp.json();
      setGenerated(data);
      setStep("review");
    } catch {
      toast.error("Erro ao gerar oferta.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!generated) return;
    setLoading(true);
    try {
      const resp = await fetch("/api/oferta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          oferta: { ...generated, icp_id: selectedICP },
        }),
      });
      if (!resp.ok) throw new Error();
      updateProgress("oferta", true);
      toast.success("Oferta salva!");
      setStep("saved");
      // Recarregar ofertas
      const ofResp = await fetch(`/api/oferta?userId=${user.id}`);
      const ofData = await ofResp.json();
      setOfertas(ofData.ofertas || []);
    } catch {
      toast.error("Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  if (icps.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">💰 Oferta</h1>
          <p className="text-muted-foreground mt-1">
            Construção de oferta irresistível a partir do ICP.
          </p>
        </div>
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-muted-foreground mb-4">
              Você precisa cadastrar um ICP primeiro.
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
        <h1 className="text-3xl font-bold">💰 Oferta</h1>
        <p className="text-muted-foreground mt-1">
          Construção de oferta irresistível com IA.
        </p>
      </div>

      <Separator />

      {/* ETAPA: INPUT */}
      {step === "input" && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">3 perguntas pra começar</h2>

            <Field label="ICP">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedICP}
                onChange={(e) => setSelectedICP(e.target.value)}
              >
                {icps.map((icp) => (
                  <option key={icp.id} value={icp.id}>
                    {icp.name} — {icp.niche}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="O que você vende?">
              <Textarea
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                rows={2}
                placeholder="Ex: Mentoria de 3 meses em vendas B2B"
              />
            </Field>

            <Field label="Qual é o diferencial?">
              <Textarea
                value={differentiator}
                onChange={(e) => setDifferentiator(e.target.value)}
                rows={2}
                placeholder="Ex: Único método brasileiro com foco em mercado enterprise"
              />
            </Field>

            <Field label="Faixa de preço">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
              >
                <option>Gratuito</option>
                <option>Até R$100</option>
                <option>R$100-500</option>
                <option>R$500-2000</option>
                <option>R$2000+</option>
              </select>
            </Field>

            <Button onClick={handleGenerate} disabled={loading} className="w-full" size="lg">
              <Sparkles className="mr-2 h-4 w-4" />
              {loading ? "Gerando oferta..." : "Gerar oferta com IA"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ETAPA: REVIEW */}
      {step === "review" && generated && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">Revise e ajuste</h2>

              <Field label="Nome da oferta">
                <Input
                  value={generated.name}
                  onChange={(e) => setGenerated({ ...generated, name: e.target.value })}
                />
              </Field>

              <Field label="🎯 Core Promise (o que entrego)">
                <Textarea
                  value={generated.core_promise}
                  onChange={(e) => setGenerated({ ...generated, core_promise: e.target.value })}
                  rows={2}
                />
              </Field>

              <Field label="✨ Método (nome forte)">
                <Input
                  value={generated.method_name}
                  onChange={(e) => setGenerated({ ...generated, method_name: e.target.value })}
                />
              </Field>

              <Field label="💭 Sonho do cliente">
                <Textarea
                  value={generated.dream}
                  onChange={(e) => setGenerated({ ...generated, dream: e.target.value })}
                  rows={2}
                />
              </Field>

              <Field label="🎁 Bônus (uma por linha)">
                <Textarea
                  value={(generated.bonuses || []).join("\n")}
                  onChange={(e) =>
                    setGenerated({ ...generated, bonuses: splitLines(e.target.value) })
                  }
                  rows={4}
                />
              </Field>

              <Field label="⏰ Escassez & Urgência">
                <Textarea
                  value={generated.scarcity}
                  onChange={(e) => setGenerated({ ...generated, scarcity: e.target.value })}
                  rows={2}
                />
              </Field>

              <Field label="🛡️ Garantia">
                <Textarea
                  value={generated.guarantee}
                  onChange={(e) => setGenerated({ ...generated, guarantee: e.target.value })}
                  rows={2}
                />
              </Field>

              <Field label="📊 Provas de sucesso (uma por linha)">
                <Textarea
                  value={(generated.success_proofs || []).join("\n")}
                  onChange={(e) =>
                    setGenerated({ ...generated, success_proofs: splitLines(e.target.value) })
                  }
                  rows={3}
                />
              </Field>

              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Tempo para resultado">
                  <Input
                    value={generated.time_to_result}
                    onChange={(e) => setGenerated({ ...generated, time_to_result: e.target.value })}
                  />
                </Field>
                <Field label="Esforço necessário">
                  <Input
                    value={generated.effort_level}
                    onChange={(e) => setGenerated({ ...generated, effort_level: e.target.value })}
                  />
                </Field>
              </div>

              <Field label="Resumo (3 bullets)">
                <Textarea
                  value={generated.summary}
                  onChange={(e) => setGenerated({ ...generated, summary: e.target.value })}
                  rows={4}
                />
              </Field>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep("input")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
            <Button variant="outline" onClick={handleGenerate} disabled={loading}>
              <RotateCcw className="mr-2 h-4 w-4" /> Regerar
            </Button>
            <Button onClick={handleSave} disabled={loading} className="ml-auto">
              <Check className="mr-2 h-4 w-4" />
              {loading ? "Salvando..." : "Salvar oferta"}
            </Button>
          </div>
        </div>
      )}

      {/* ETAPA: SAVED */}
      {step === "saved" && (
        <Card>
          <CardContent className="p-6 text-center space-y-3">
            <div className="text-4xl">🎉</div>
            <h2 className="text-xl font-semibold">Oferta salva!</h2>
            <p className="text-muted-foreground">
              Pitch agora tá liberado. Bora pro próximo passo?
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setStep("input")}>
                Nova oferta
              </Button>
              <Button asChild>
                <a href="/produto/pitch">Criar Pitch →</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de ofertas salvas */}
      {ofertas.length > 0 && (
        <OfertasSalvas
          ofertas={ofertas}
          userId={user.id}
          focoId={focoId}
          onFocoChange={setFocoId}
        />
      )}
    </div>
  );
}

function OfertasSalvas({
  ofertas,
  userId,
  focoId,
  onFocoChange,
}: {
  ofertas: any[];
  userId: string;
  focoId: string | null;
  onFocoChange: (id: string | null) => void;
}) {
  const [loading, setLoading] = useState<string | null>(null);

  const setFoco = async (ofertaId: string) => {
    setLoading(ofertaId);
    try {
      const resp = await fetch("/api/users/oferta-foco", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ofertaId }),
      });
      if (!resp.ok) throw new Error();
      onFocoChange(ofertaId);
      toast.success("Oferta colocada em foco!");
    } catch {
      toast.error("Erro ao atualizar foco.");
    } finally {
      setLoading(null);
    }
  };

  const removerFoco = async () => {
    setLoading("remove");
    try {
      const resp = await fetch("/api/users/oferta-foco", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ofertaId: null }),
      });
      if (!resp.ok) throw new Error();
      onFocoChange(null);
      toast.success("Foco removido. Conteúdo voltou pro modo livre.");
    } catch {
      toast.error("Erro.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3 pt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Ofertas salvas</h2>
        {focoId && (
          <Button size="sm" variant="ghost" onClick={removerFoco} disabled={!!loading}>
            Remover foco
          </Button>
        )}
      </div>
      {ofertas.map((o) => {
        const emFoco = focoId === o.id;
        return (
          <Card key={o.id} className={emFoco ? "border-primary ring-2 ring-primary/20" : ""}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{o.name}</h3>
                    {emFoco && (
                      <span className="text-[10px] uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded">
                        EM FOCO
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {o.core_promise}
                  </p>
                  {o.method_name && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Método: <b>{o.method_name}</b>
                    </p>
                  )}
                </div>
                {!emFoco && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setFoco(o.id)}
                    disabled={!!loading}
                  >
                    Colocar em foco
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
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

function splitLines(s: string): string[] {
  return s.split("\n").map((l) => l.trim()).filter(Boolean);
}
