"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, ArrowRight, Pencil, Trash2, Save, X, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { useUserStore } from "@/hooks/use-user-store";
import { OBJETIVOS, type TipoObjetivo } from "@/lib/editorias/constants";
import { ESTAGIOS, ESTAGIO_ORDEM, type Estagio } from "@/lib/estagios/constants";
import type { IdeaData } from "@/types";

const STYLE_LABELS: Record<string, string> = {
  educational: "Educativo",
  storytelling: "Storytelling",
  listicle: "Lista",
  myth_busting: "Quebrando mitos",
  before_after: "Antes e Depois",
};

const STYLE_OPTIONS = [
  "educational",
  "storytelling",
  "listicle",
  "myth_busting",
  "before_after",
];

type Editoria = {
  id: string;
  nome: string;
  tipo_objetivo: string;
  objetivo?: string;
  descricao?: string;
};

type ICP = { id: string; name: string };

type Ideia = IdeaData & {
  id: string;
  editoria_id?: string | null;
  user_id?: string;
  created_at?: string;
};

export default function IdeiasPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user)!;
  const updateProgress = useUserStore((s) => s.updateProgress);

  const [icps, setIcps] = useState<ICP[]>([]);
  const [icpId, setIcpId] = useState("");
  const [editorias, setEditorias] = useState<Editoria[]>([]);
  const [editoriaId, setEditoriaId] = useState("");
  const [count, setCount] = useState(3);
  const [savedIdeias, setSavedIdeias] = useState<Ideia[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<Ideia>>({});
  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // ── Inicial ─────
  useEffect(() => {
    (async () => {
      try {
        const [icpResp, edResp] = await Promise.all([
          fetch(`/api/icp?userId=${user.id}`),
          fetch(`/api/editorias?userId=${user.id}`),
        ]);
        const ic = (await icpResp.json()).icps || [];
        const ed = (await edResp.json()).editorias || [];
        setIcps(ic);
        setEditorias(ed);
        if (ic[0]) setIcpId(ic[0].id);
        if (ed[0]) setEditoriaId(ed[0].id);
      } finally {
        setLoadingInitial(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  // ── Carrega ideias salvas quando muda editoria ─────
  useEffect(() => {
    if (!editoriaId) return;
    (async () => {
      try {
        const resp = await fetch(
          `/api/ideias?userId=${user.id}&editoriaId=${editoriaId}`
        );
        const data = await resp.json();
        setSavedIdeias(data.ideias || []);
      } catch {
        // silencia
      }
    })();
  }, [editoriaId, user.id]);

  // ── Gerar e salvar ─────
  const handleGenerate = async () => {
    if (!icpId) return toast.error("Selecione um ICP.");
    if (!editoriaId) return toast.error("Selecione uma editoria.");
    setLoading(true);
    try {
      const resp = await fetch("/api/ideias/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          icpId,
          editoriaId,
          count,
        }),
      });
      if (!resp.ok) throw new Error();
      const data = await resp.json();
      const ideas: IdeaData[] = data.ideas || [];

      // Salva no banco automaticamente
      const saveResp = await fetch("/api/ideias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          editoriaId,
          ideias: ideas,
        }),
      });
      const saveData = await saveResp.json();
      const novas: Ideia[] = saveData.ideias || [];

      setSavedIdeias((prev) => [...novas, ...prev]);
      updateProgress("ideias", true);
      toast.success(`${novas.length} ideias geradas e salvas!`);
    } catch {
      toast.error("Erro ao gerar ideias.");
    } finally {
      setLoading(false);
    }
  };

  // ── Editar ─────
  const startEdit = (ideia: Ideia) => {
    setEditingId(ideia.id);
    setEditDraft({
      topic: ideia.topic,
      hook: ideia.hook,
      angle: ideia.angle,
      carousel_style: ideia.carousel_style,
      target_emotion: ideia.target_emotion,
      target_stage: ideia.target_stage,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft({});
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const resp = await fetch(`/api/ideias/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editDraft),
      });
      if (!resp.ok) throw new Error();
      const data = await resp.json();
      setSavedIdeias((prev) =>
        prev.map((i) => (i.id === editingId ? { ...i, ...data.ideia } : i))
      );
      toast.success("Ideia atualizada.");
      cancelEdit();
    } catch {
      toast.error("Erro ao salvar.");
    }
  };

  // ── Deletar ─────
  const deleteIdeia = async (id: string) => {
    if (!confirm("Apagar essa ideia?")) return;
    try {
      const resp = await fetch(`/api/ideias/${id}`, { method: "DELETE" });
      if (!resp.ok) throw new Error();
      setSavedIdeias((prev) => prev.filter((i) => i.id !== id));
      toast.success("Ideia apagada.");
    } catch {
      toast.error("Erro ao apagar.");
    }
  };

  // ── Usar (vai pro Monoflow) ─────
  const handleUseIdea = (idea: Ideia) => {
    const params = new URLSearchParams({
      topic: idea.topic || "",
      hook: idea.hook || "",
      angle: idea.angle || "",
      style: idea.carousel_style || "",
      editoriaId: editoriaId || "",
      stage: idea.target_stage || "",
    });
    toast.success(`Ideia selecionada: "${idea.topic}"`);
    router.push(`/conteudo/monoflow?${params.toString()}`);
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
        <h1 className="text-3xl font-bold">💡 Ideias</h1>
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-muted-foreground mb-4">Cadastre um ICP primeiro.</p>
            <Button asChild>
              <a href="/produto/icp">Criar ICP</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (editorias.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">💡 Ideias</h1>
        <Card>
          <CardContent className="p-10 text-center space-y-3">
            <div className="text-4xl">📚</div>
            <p className="text-muted-foreground">
              Ideias sempre partem de uma <b>editoria</b>.
            </p>
            <Button asChild>
              <a href="/conteudo/editorias">Criar editorias</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const editoriaAtual = editorias.find((e) => e.id === editoriaId);
  const tipoInfo = editoriaAtual
    ? OBJETIVOS[editoriaAtual.tipo_objetivo as TipoObjetivo]
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">💡 Ideias</h1>
        <p className="text-muted-foreground mt-1">
          Ideias salvas por editoria. Edite, regere ou use no Monoflow.
        </p>
      </div>

      <Separator />

      {/* 1. ICP + quantidade */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <Label className="text-base">1. Pra qual público e quantas gerar</Label>
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
            <Field label="Quantas novas ideias">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
              >
                {[3, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} ideias
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* 2. Editoria */}
      <div className="space-y-3">
        <Label className="text-base">2. Editoria</Label>
        <div className="grid md:grid-cols-2 gap-2">
          {editorias.map((e) => {
            const info = OBJETIVOS[e.tipo_objetivo as TipoObjetivo];
            const selected = editoriaId === e.id;
            return (
              <Card
                key={e.id}
                className={`cursor-pointer transition ${
                  selected
                    ? "border-primary ring-2 ring-primary/20"
                    : "hover:border-primary/50"
                }`}
                onClick={() => setEditoriaId(e.id)}
              >
                <CardContent className="p-4 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{info?.icon || "📚"}</span>
                    <p className="font-semibold">{e.nome}</p>
                  </div>
                  {info && (
                    <p className="text-xs text-muted-foreground">
                      {info.label} — {info.desc}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 3. Gerar */}
      <Card>
        <CardContent className="p-6 space-y-4">
          {editoriaAtual && tipoInfo && (
            <div className="bg-muted/30 rounded-lg p-3 text-xs space-y-1">
              <p className="text-muted-foreground">
                <b>Editoria:</b> {editoriaAtual.nome} ({tipoInfo.label})
              </p>
              {editoriaAtual.objetivo && (
                <p className="text-muted-foreground">
                  <b>Objetivo:</b> {editoriaAtual.objetivo}
                </p>
              )}
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={loading || !editoriaId}
            className="w-full"
            size="lg"
          >
            <Plus className="mr-2 h-4 w-4" />
            <Sparkles className="mr-1 h-4 w-4" />
            {loading
              ? "Gerando ideias..."
              : `Gerar ${count} novas ideias com IA`}
          </Button>
        </CardContent>
      </Card>

      {/* 4. Lista de ideias salvas */}
      {savedIdeias.length > 0 ? (
        <div className="space-y-3">
          <Label className="text-base">
            💾 {savedIdeias.length} ideias salvas nessa editoria
          </Label>
          {savedIdeias.map((idea) => (
            <Card key={idea.id} className="hover:border-primary/30 transition">
              <CardContent className="p-5">
                {editingId === idea.id ? (
                  /* MODO EDIÇÃO */
                  <div className="space-y-3">
                    <Field label="Tema">
                      <Input
                        value={editDraft.topic || ""}
                        onChange={(e) =>
                          setEditDraft({ ...editDraft, topic: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="Hook">
                      <Textarea
                        rows={2}
                        value={editDraft.hook || ""}
                        onChange={(e) =>
                          setEditDraft({ ...editDraft, hook: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="Ângulo">
                      <Input
                        value={editDraft.angle || ""}
                        onChange={(e) =>
                          setEditDraft({ ...editDraft, angle: e.target.value })
                        }
                      />
                    </Field>
                    <div className="grid md:grid-cols-2 gap-3">
                      <Field label="Estilo">
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={editDraft.carousel_style || ""}
                          onChange={(e) =>
                            setEditDraft({
                              ...editDraft,
                              carousel_style: e.target.value,
                            })
                          }
                        >
                          <option value="">—</option>
                          {STYLE_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {STYLE_LABELS[s] || s}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Estágio (Eugene Schwartz)">
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={editDraft.target_stage || ""}
                          onChange={(e) =>
                            setEditDraft({
                              ...editDraft,
                              target_stage: e.target.value,
                            })
                          }
                        >
                          <option value="">—</option>
                          {ESTAGIO_ORDEM.map((s) => (
                            <option key={s} value={s}>
                              {ESTAGIOS[s].icon} {ESTAGIOS[s].label}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                    <Field label="Emoção alvo">
                      <Input
                        value={editDraft.target_emotion || ""}
                        onChange={(e) =>
                          setEditDraft({
                            ...editDraft,
                            target_emotion: e.target.value,
                          })
                        }
                      />
                    </Field>
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="ghost" onClick={cancelEdit}>
                        <X className="mr-1 h-3 w-3" /> Cancelar
                      </Button>
                      <Button size="sm" onClick={saveEdit}>
                        <Save className="mr-1 h-3 w-3" /> Salvar edição
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* MODO VIEW */
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {idea.carousel_style && (
                          <span className="text-xs bg-secondary px-2 py-0.5 rounded">
                            {STYLE_LABELS[idea.carousel_style] ||
                              idea.carousel_style}
                          </span>
                        )}
                        {idea.target_stage && ESTAGIOS[idea.target_stage as Estagio] && (
                          <span
                            className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded inline-flex items-center gap-1"
                            title={ESTAGIOS[idea.target_stage as Estagio].desc}
                          >
                            {ESTAGIOS[idea.target_stage as Estagio].icon}{" "}
                            {ESTAGIOS[idea.target_stage as Estagio].label}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold">{idea.topic}</h3>
                      {idea.hook && (
                        <p className="text-sm text-primary italic">
                          🪝 {idea.hook}
                        </p>
                      )}
                      {idea.angle && (
                        <p className="text-sm text-muted-foreground">
                          <b>Ângulo:</b> {idea.angle}
                        </p>
                      )}
                      {idea.target_emotion && (
                        <p className="text-xs text-muted-foreground">
                          Emoção: {idea.target_emotion}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button size="sm" onClick={() => handleUseIdea(idea)}>
                        Usar <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit(idea)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteIdeia(idea.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Nenhuma ideia salva nessa editoria ainda. Gere as primeiras acima.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
