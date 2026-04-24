"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { useUserStore } from "@/hooks/use-user-store";
import type { ICP } from "@/types";

type ICPRow = ICP & { id: string; user_id: string };

type FormState = {
  id?: string;
  name: string;
  niche: string;
  age_range: string;
  gender: string;
  location: string;
  pain_points: string;
  desires: string;
  objections: string;
  language_style: string;
  tone_keywords: string;
};

const EMPTY: FormState = {
  name: "",
  niche: "",
  age_range: "",
  gender: "",
  location: "",
  pain_points: "",
  desires: "",
  objections: "",
  language_style: "",
  tone_keywords: "",
};

export default function ICPPage() {
  const user = useUserStore((s) => s.user)!;
  const updateProgress = useUserStore((s) => s.updateProgress);

  const [icps, setIcps] = useState<ICPRow[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadICPs = async () => {
    try {
      const resp = await fetch(`/api/icp?userId=${user.id}`);
      const data = await resp.json();
      setIcps(data.icps || []);
      if (data.icps?.length > 0) updateProgress("icp", true);
    } catch {
      toast.error("Erro ao carregar ICPs");
    }
  };

  useEffect(() => {
    loadICPs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const handleSuggest = async () => {
    if (!form.name.trim() || !form.niche.trim()) {
      toast.error("Preencha Nome e Nicho antes de sugerir.");
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch("/api/icp/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          name: form.name,
          niche: form.niche,
          demographics: {
            age_range: form.age_range,
            gender: form.gender,
            location: form.location,
          },
        }),
      });
      if (!resp.ok) throw new Error();
      const data = await resp.json();
      setForm((f) => ({
        ...f,
        pain_points: (data.pain_points || []).join("\n"),
        desires: (data.desires || []).join("\n"),
        objections: (data.objections || []).join("\n"),
        language_style: data.language_style || f.language_style,
        tone_keywords: (data.tone_keywords || []).join(", "),
      }));
      toast.success("Preenchido com IA! Pode editar o que quiser.");
    } catch {
      toast.error("Erro ao sugerir com IA.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.niche.trim()) {
      toast.error("Nome e Nicho são obrigatórios.");
      return;
    }

    const payload = {
      name: form.name,
      niche: form.niche,
      demographics: {
        age_range: form.age_range,
        gender: form.gender,
        location: form.location,
      },
      pain_points: splitLines(form.pain_points),
      desires: splitLines(form.desires),
      objections: splitLines(form.objections),
      language_style: form.language_style,
      tone_keywords: form.tone_keywords
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    setLoading(true);
    try {
      const url = form.id ? `/api/icp/${form.id}` : "/api/icp";
      const method = form.id ? "PUT" : "POST";
      const body = form.id ? payload : { userId: user.id, icp: payload };
      const resp = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!resp.ok) throw new Error();
      toast.success(form.id ? "ICP atualizado!" : "ICP criado!");
      setForm(EMPTY);
      setShowForm(false);
      updateProgress("icp", true);
      await loadICPs();
    } catch {
      toast.error("Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (icp: ICPRow) => {
    setForm({
      id: icp.id,
      name: icp.name,
      niche: icp.niche,
      age_range: icp.demographics?.age_range || "",
      gender: icp.demographics?.gender || "",
      location: icp.demographics?.location || "",
      pain_points: (icp.pain_points || []).join("\n"),
      desires: (icp.desires || []).join("\n"),
      objections: (icp.objections || []).join("\n"),
      language_style: icp.language_style || "",
      tone_keywords: (icp.tone_keywords || []).join(", "),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deletar esse ICP?")) return;
    try {
      await fetch(`/api/icp/${id}`, { method: "DELETE" });
      toast.success("ICP deletado.");
      await loadICPs();
    } catch {
      toast.error("Erro ao deletar.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🎯 ICP</h1>
          <p className="text-muted-foreground mt-1">
            Perfil de cliente ideal — quem você quer alcançar.
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => { setForm(EMPTY); setShowForm(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Novo ICP
          </Button>
        )}
      </div>

      <Separator />

      {showForm && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">
              {form.id ? "Editar ICP" : "Novo ICP"}
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Nome *">
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Consultor de vendas B2B"
                />
              </Field>
              <Field label="Nicho *">
                <Input
                  value={form.niche}
                  onChange={(e) => setForm({ ...form, niche: e.target.value })}
                  placeholder="Ex: SaaS B2B, Vendas consultivas"
                />
              </Field>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <Field label="Faixa etária">
                <Input
                  value={form.age_range}
                  onChange={(e) => setForm({ ...form, age_range: e.target.value })}
                  placeholder="25-45"
                />
              </Field>
              <Field label="Gênero">
                <Input
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  placeholder="todos | M | F"
                />
              </Field>
              <Field label="Localização">
                <Input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Brasil"
                />
              </Field>
            </div>

            <div className="pt-2 pb-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-[1px] bg-border" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  Conte pra mim o básico e eu preencho o resto
                </span>
                <div className="flex-1 h-[1px] bg-border" />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleSuggest}
                disabled={loading || !form.name.trim() || !form.niche.trim()}
                className="w-full"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {loading ? "Gerando com IA..." : "Preencher com IA a partir de Nome + Nicho"}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Depois você edita tudo o que quiser antes de salvar.
              </p>
            </div>

            <Field label="Dores (uma por linha)">
              <Textarea
                value={form.pain_points}
                onChange={(e) => setForm({ ...form, pain_points: e.target.value })}
                rows={3}
                placeholder={"Não consegue engajamento\nNão sabe o que postar"}
              />
            </Field>

            <Field label="Desejos (um por linha)">
              <Textarea
                value={form.desires}
                onChange={(e) => setForm({ ...form, desires: e.target.value })}
                rows={3}
                placeholder={"Crescer seguidores organicamente\nMonetizar o perfil"}
              />
            </Field>

            <Field label="Objeções (uma por linha)">
              <Textarea
                value={form.objections}
                onChange={(e) => setForm({ ...form, objections: e.target.value })}
                rows={3}
                placeholder={"Não tenho tempo\nÉ muito caro"}
              />
            </Field>

            <Field label="Estilo de linguagem">
              <Textarea
                value={form.language_style}
                onChange={(e) => setForm({ ...form, language_style: e.target.value })}
                rows={2}
                placeholder="Informal, direto, usa gírias, emojis moderados"
              />
            </Field>

            <Field label="Palavras-chave de tom (separadas por vírgula)">
              <Input
                value={form.tone_keywords}
                onChange={(e) => setForm({ ...form, tone_keywords: e.target.value })}
                placeholder="motivacional, educativo, provocativo"
              />
            </Field>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={loading}>
                {loading ? "Salvando..." : form.id ? "Atualizar" : "Criar ICP"}
              </Button>
              <Button
                variant="outline"
                onClick={() => { setShowForm(false); setForm(EMPTY); }}
                disabled={loading}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {icps.length === 0 && !showForm && (
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-muted-foreground">
              Nenhum ICP cadastrado ainda. Crie o primeiro!
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {icps.map((icp) => (
          <Card key={icp.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{icp.name}</h3>
                  <p className="text-sm text-muted-foreground">{icp.niche}</p>
                  {icp.pain_points?.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      <b>Dores:</b> {icp.pain_points.slice(0, 3).join(" · ")}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(icp)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(icp.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
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
