"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sparkles, Save, Trash2, ArrowUp, ArrowDown, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { useUserStore } from "@/hooks/use-user-store";
import type { Destaque } from "@/types";

type ICPRow = { id: string; name: string; niche: string };

type LocalDestaque = Destaque & {
  _isNew?: boolean; // ainda nao salvo no banco
  _saving?: boolean;
};

// Normaliza conteudo_sugerido pra exibicao/storage: quebra "; " em linhas.
// Cobre dados gerados antes do prompt novo, que usavam separador ;.
function normalizeStoriesPure(raw: string | undefined | null): string {
  if (!raw) return "";
  if (raw.includes("\n")) return raw; // ja esta em linhas
  return raw
    .replace(/;\s*(Story\s*\d+\s*:)/gi, "\n$1")
    .replace(/;\s*(\d+\.\s)/g, "\n$1")
    .replace(/;\s+/g, "\n");
}

export default function DestaquesPage() {
  const user = useUserStore((s) => s.user)!;
  const updateProgress = useUserStore((s) => s.updateProgress);

  const [icps, setIcps] = useState<ICPRow[]>([]);
  const [selectedICP, setSelectedICP] = useState("");
  const [items, setItems] = useState<LocalDestaque[]>([]);
  const [loadingGen, setLoadingGen] = useState(false);
  const [savingAll, setSavingAll] = useState(false);

  // Carrega ICPs + destaques existentes
  useEffect(() => {
    (async () => {
      try {
        const [icpResp, dResp] = await Promise.all([
          fetch(`/api/icp?userId=${user.id}`),
          fetch(`/api/destaques?userId=${user.id}`),
        ]);
        const icpData = await icpResp.json();
        const dData = await dResp.json();

        const icpList: ICPRow[] = icpData.icps || [];
        setIcps(icpList);
        if (icpList[0]) setSelectedICP(icpList[0].id);

        // Normaliza conteudo_sugerido na carga: dados antigos vem com "; " separador,
        // converte pra \n pra ficar legivel direto e auto-limpar no proximo save.
        const loaded = ((dData.destaques || []) as LocalDestaque[]).map((d) => ({
          ...d,
          conteudo_sugerido: normalizeStoriesPure(d.conteudo_sugerido),
        }));
        setItems(loaded);
      } catch {
        // silencia
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const handleGenerate = async () => {
    if (!selectedICP) return toast.error("Selecione um ICP.");

    if (items.length > 0) {
      const ok = confirm(
        "Você já tem destaques salvos. Gerar novos vai SUBSTITUIR os existentes (após você confirmar e salvar). Continuar?"
      );
      if (!ok) return;
    }

    setLoadingGen(true);
    try {
      const resp = await fetch("/api/destaques/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, icpId: selectedICP }),
      });
      if (!resp.ok) throw new Error();
      const data = await resp.json();
      const generated = (data.destaques || []) as Destaque[];
      // marca como _isNew (nao salvos ainda) + normaliza stories
      setItems(
        generated.map((d, i) => ({
          ...d,
          conteudo_sugerido: normalizeStoriesPure(d.conteudo_sugerido),
          ordem: typeof d.ordem === "number" ? d.ordem : i + 1,
          _isNew: true,
        }))
      );
      toast.success(`${generated.length} destaques gerados! Edite e clique em "Salvar todos" pra persistir.`);
    } catch {
      toast.error("Erro ao gerar destaques.");
    } finally {
      setLoadingGen(false);
    }
  };

  const updateField = (index: number, field: keyof Destaque, value: string | number) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };


  const moveItem = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    setItems((prev) => {
      const copy = [...prev];
      const [a, b] = [copy[index], copy[target]];
      copy[index] = b;
      copy[target] = a;
      // re-numera ordem
      return copy.map((d, i) => ({ ...d, ordem: i + 1 }));
    });
  };

  const removeItem = async (index: number) => {
    const item = items[index];
    if (!confirm(`Apagar "${item.nome}"?`)) return;
    if (item._isNew || !item.id) {
      setItems((prev) => prev.filter((_, i) => i !== index));
      return;
    }
    try {
      const resp = await fetch(`/api/destaques/${item.id}`, { method: "DELETE" });
      if (!resp.ok) throw new Error();
      setItems((prev) => prev.filter((_, i) => i !== index));
      toast.success("Destaque apagado.");
    } catch {
      toast.error("Erro ao apagar.");
    }
  };

  const addManual = () => {
    setItems((prev) => [
      ...prev,
      {
        nome: "",
        descricao: "",
        conteudo_sugerido: "",
        capa_sugerida: "",
        ordem: prev.length + 1,
        _isNew: true,
      },
    ]);
  };

  const handleSaveAll = async () => {
    if (items.length === 0) return toast.error("Nada pra salvar.");

    // Valida: todos precisam ter nome
    const semNome = items.find((i) => !i.nome?.trim());
    if (semNome) return toast.error("Todos os destaques precisam de nome.");

    setSavingAll(true);
    try {
      // Estratégia simples: replace=true → apaga todos do user e re-cria.
      // Para essa qtd pequena (8-12) é OK e elimina problemas de sync.
      const resp = await fetch("/api/destaques", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          replace: true,
          items: items.map((d, i) => ({
            nome: d.nome,
            descricao: d.descricao,
            conteudo_sugerido: d.conteudo_sugerido,
            capa_sugerida: d.capa_sugerida,
            ordem: typeof d.ordem === "number" ? d.ordem : i + 1,
          })),
        }),
      });
      if (!resp.ok) throw new Error();
      const data = await resp.json();
      setItems((data.destaques || []) as LocalDestaque[]);
      updateProgress("destaques", true);
      toast.success("Destaques salvos!");
    } catch {
      toast.error("Erro ao salvar.");
    } finally {
      setSavingAll(false);
    }
  };

  if (icps.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">⭐ Destaques</h1>
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-muted-foreground mb-4">
              Você precisa criar um ICP primeiro.
            </p>
            <Button asChild>
              <a href="/produto/icp">Criar ICP</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasUnsaved = items.some((i) => i._isNew);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">⭐ Destaques de Instagram</h1>
        <p className="text-muted-foreground mt-1">
          Estrutura de destaques (highlights) sugerida com base no seu posicionamento,
          território e editorias. Edite, reordene e salve.
        </p>
      </div>

      <Separator />

      <Card>
        <CardContent className="p-4 space-y-3">
          <Label>ICP</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={selectedICP}
            onChange={(e) => setSelectedICP(e.target.value)}
          >
            {icps.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} — {i.niche}
              </option>
            ))}
          </select>

          <Button
            onClick={handleGenerate}
            disabled={loadingGen}
            className="w-full"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {loadingGen
              ? "Gerando..."
              : items.length > 0
              ? "Regerar com IA (substitui)"
              : "Gerar com IA"}
          </Button>
        </CardContent>
      </Card>

      {items.length > 0 && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Label className="text-base">
              {items.length} destaque{items.length === 1 ? "" : "s"}
              {hasUnsaved && (
                <span className="ml-2 text-amber-600 text-sm font-normal">
                  · alterações não salvas
                </span>
              )}
            </Label>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={addManual}>
                <Plus className="mr-2 h-4 w-4" /> Adicionar
              </Button>
              <Button size="sm" onClick={handleSaveAll} disabled={savingAll}>
                <Save className="mr-2 h-4 w-4" />
                {savingAll ? "Salvando..." : "Salvar todos"}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {items.map((d, i) => (
              <Card key={d.id || `new-${i}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-muted-foreground w-6">
                        #{i + 1}
                      </span>
                      <Input
                        value={d.nome}
                        onChange={(e) => updateField(i, "nome", e.target.value)}
                        placeholder="Nome curto (cabe no balão, ~12 char)"
                        className="font-semibold"
                        maxLength={20}
                      />
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveItem(i, -1)}
                        disabled={i === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveItem(i, 1)}
                        disabled={i === items.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeItem(i)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        O que vai dentro
                      </Label>
                      <Textarea
                        value={d.descricao || ""}
                        onChange={(e) => updateField(i, "descricao", e.target.value)}
                        rows={2}
                        placeholder="Descrição curta do que esse destaque cobre"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Stories sugeridos (1 por linha)
                      </Label>
                      <Textarea
                        value={d.conteudo_sugerido || ""}
                        onChange={(e) =>
                          updateField(i, "conteudo_sugerido", e.target.value)
                        }
                        rows={5}
                        placeholder={"1. Tela do CRM antes/depois\n2. Print de mensagem do cliente\n3. ..."}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Ideia de capa
                    </Label>
                    <Input
                      value={d.capa_sugerida || ""}
                      onChange={(e) => updateField(i, "capa_sugerida", e.target.value)}
                      placeholder="Cor + ícone + conceito visual"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSaveAll} disabled={savingAll}>
              <Save className="mr-2 h-4 w-4" />
              {savingAll ? "Salvando..." : "Salvar todos"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
