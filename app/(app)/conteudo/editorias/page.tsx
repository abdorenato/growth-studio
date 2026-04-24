"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, Check, RotateCcw, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { useUserStore } from "@/hooks/use-user-store";
import { OBJETIVOS, TIPO_ORDEM, type TipoObjetivo } from "@/lib/editorias/constants";

type Editoria = {
  nome: string;
  tipo_objetivo: TipoObjetivo | string;
  objetivo: string;
  descricao: string;
};

type ICPRow = { id: string; name: string; niche: string };

export default function EditoriasPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user)!;
  const updateProgress = useUserStore((s) => s.updateProgress);

  const [editorias, setEditorias] = useState<Editoria[]>([]);
  const [icps, setIcps] = useState<ICPRow[]>([]);
  const [icpId, setIcpId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [regenerating, setRegenerating] = useState<number | null>(null);

  // Carregar ICP + editorias existentes
  useEffect(() => {
    (async () => {
      try {
        const [icpResp, edResp] = await Promise.all([
          fetch(`/api/icp?userId=${user.id}`),
          fetch(`/api/editorias?userId=${user.id}`),
        ]);
        const ic = (await icpResp.json()).icps || [];
        setIcps(ic);
        if (ic[0]) setIcpId(ic[0].id);

        const existing = (await edResp.json()).editorias || [];
        if (existing.length > 0) {
          // Ordenar pela ordem canônica dos 5 objetivos
          const sorted = [...TIPO_ORDEM]
            .map((tipo) =>
              existing.find((e: Editoria) => e.tipo_objetivo === tipo)
            )
            .filter(Boolean) as Editoria[];

          // Se não conseguiu mapear todos, usa a lista crua
          setEditorias(sorted.length === 5 ? sorted : existing);
          updateProgress("editorias", true);
        }
      } finally {
        setLoadingInitial(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const handleGenerateAll = async () => {
    if (!icpId) return toast.error("Selecione um ICP.");
    setLoading(true);
    try {
      const resp = await fetch("/api/editorias/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "all", userId: user.id, icpId }),
      });
      if (!resp.ok) throw new Error();
      const data = await resp.json();
      setEditorias(data.editorias || []);
      toast.success("5 editorias geradas! Ajuste o que quiser.");
    } catch {
      toast.error("Erro ao gerar editorias.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateOne = async (index: number) => {
    if (!icpId) return;
    const atual = editorias[index];
    setRegenerating(index);
    try {
      const resp = await fetch("/api/editorias/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "one",
          userId: user.id,
          icpId,
          tipo_objetivo: atual.tipo_objetivo,
          nome_anterior: atual.nome,
        }),
      });
      if (!resp.ok) throw new Error();
      const data = await resp.json();
      const copy = [...editorias];
      copy[index] = data;
      setEditorias(copy);
      toast.success("Editoria regerada!");
    } catch {
      toast.error("Erro ao regerar.");
    } finally {
      setRegenerating(null);
    }
  };

  const handleSaveAll = async () => {
    if (editorias.length === 0) return;
    setLoading(true);
    try {
      const resp = await fetch("/api/editorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          editorias: editorias.filter((e) => e.nome?.trim()),
        }),
      });
      if (!resp.ok) throw new Error();
      updateProgress("editorias", true);
      toast.success("🎉 Editorias salvas!");
      setTimeout(() => router.push("/dashboard"), 1200);
    } catch {
      toast.error("Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (index: number, field: keyof Editoria, value: string) => {
    const copy = [...editorias];
    copy[index] = { ...copy[index], [field]: value };
    setEditorias(copy);
  };

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
        <h1 className="text-3xl font-bold">📚 Editorias</h1>
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-muted-foreground mb-4">
              Precisa de um <b>ICP</b> primeiro.
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
        <h1 className="text-3xl font-bold">📚 Editorias</h1>
        <p className="text-muted-foreground mt-1">
          Os 5 pilares recorrentes do seu conteúdo — um pra cada objetivo estratégico.
        </p>
      </div>

      <Separator />

      {editorias.length === 0 && (
        <Card>
          <CardContent className="p-10 text-center space-y-4">
            <div className="text-5xl">📚</div>
            <h2 className="text-xl font-semibold">
              Gerar minhas 5 editorias
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              A IA cria 5 pilares editoriais baseados no seu território, voz e ICP.
              Uma pra cada objetivo: autoridade, conexão, provocação, prova e conversão.
            </p>
            <Button
              onClick={handleGenerateAll}
              disabled={loading}
              size="lg"
              className="mt-4"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {loading ? "Gerando..." : "Gerar com IA"}
            </Button>
          </CardContent>
        </Card>
      )}

      {editorias.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {editorias.length} editorias • ajuste livremente antes de salvar
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateAll}
                disabled={loading}
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Gerar tudo de novo
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {editorias.map((ed, i) => {
              const tipoInfo = OBJETIVOS[ed.tipo_objetivo as TipoObjetivo];
              return (
                <Card key={i} className="relative">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{tipoInfo?.icon || "📚"}</span>
                        <div>
                          <div className="text-xs uppercase tracking-wider text-muted-foreground">
                            {tipoInfo?.label || ed.tipo_objetivo}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {tipoInfo?.desc || ""}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRegenerateOne(i)}
                        disabled={regenerating === i}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        {regenerating === i ? "Regerando..." : "Regerar só essa"}
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Nome</Label>
                      <Input
                        value={ed.nome}
                        onChange={(e) => updateField(i, "nome", e.target.value)}
                        className="text-lg font-semibold"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Objetivo estratégico</Label>
                      <Textarea
                        rows={2}
                        value={ed.objetivo}
                        onChange={(e) => updateField(i, "objetivo", e.target.value)}
                        placeholder="O que essa editoria faz estrategicamente"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Descrição (o que cobre)</Label>
                      <Textarea
                        rows={2}
                        value={ed.descricao}
                        onChange={(e) => updateField(i, "descricao", e.target.value)}
                        placeholder="Sobre o que fala"
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Separator />

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Cancelar
            </Button>
            <Button onClick={handleSaveAll} disabled={loading}>
              <Check className="mr-2 h-4 w-4" />
              {loading ? "Salvando..." : "Salvar as 5 editorias"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
