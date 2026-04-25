"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUserStore } from "@/hooks/use-user-store";

export function PerfilCard() {
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    instagram: "",
    atividade: "",
    atividade_descricao: "",
  });

  if (!user) return null;

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const startEdit = () => {
    setDraft({
      name: user.name || "",
      instagram: user.instagram || "",
      atividade: user.atividade || "",
      atividade_descricao: user.atividade_descricao || "",
    });
    setEditing(true);
  };

  const cancel = () => setEditing(false);

  const save = async () => {
    if (!draft.name.trim()) {
      toast.error("Nome é obrigatório.");
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!resp.ok) throw new Error();
      const data = await resp.json();
      setUser({ ...user, ...data.user });
      toast.success("Perfil atualizado!");
      setEditing(false);
    } catch {
      toast.error("Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  if (editing) {
    return (
      <div className="p-3 space-y-2.5">
        <div className="flex items-center justify-between mb-1">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Editando perfil
          </Label>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={cancel}
            disabled={loading}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        <Field label="Nome">
          <Input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="h-8 text-sm"
          />
        </Field>

        <Field label="Email">
          <Input value={user.email} disabled className="h-8 text-sm" />
        </Field>

        <Field label="@ Instagram">
          <Input
            value={draft.instagram}
            onChange={(e) => setDraft({ ...draft, instagram: e.target.value })}
            placeholder="seuinsta"
            className="h-8 text-sm"
          />
        </Field>

        <Field label="Atividade">
          <Input
            value={draft.atividade}
            onChange={(e) => setDraft({ ...draft, atividade: e.target.value })}
            placeholder="Ex: Consultor B2B"
            className="h-8 text-sm"
          />
        </Field>

        <Field label="O que entrega">
          <Textarea
            value={draft.atividade_descricao}
            onChange={(e) =>
              setDraft({ ...draft, atividade_descricao: e.target.value })
            }
            rows={2}
            className="text-sm resize-none"
          />
        </Field>

        <Button
          size="sm"
          className="w-full h-8 text-xs"
          onClick={save}
          disabled={loading}
        >
          <Check className="mr-1.5 h-3 w-3" />
          {loading ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-3 group/perfil">
      <div className="flex items-start gap-2.5">
        {/* Avatar com iniciais */}
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate leading-tight">
            {user.name}
          </div>
          <div className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
            {user.email}
          </div>
          {user.instagram && (
            <div className="text-[11px] text-primary leading-tight mt-0.5">
              @{user.instagram}
            </div>
          )}
        </div>

        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 opacity-0 group-hover/perfil:opacity-100 transition-opacity flex-shrink-0"
          onClick={startEdit}
          title="Editar perfil"
        >
          <Pencil className="h-3 w-3" />
        </Button>
      </div>

      {(user.atividade || user.atividade_descricao) && (
        <div className="mt-2.5 pt-2.5 border-t space-y-1.5">
          {user.atividade && (
            <div>
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                Atividade
              </div>
              <p className="text-xs font-medium leading-tight mt-0.5">
                {user.atividade}
              </p>
            </div>
          )}
          {user.atividade_descricao && (
            <p className="text-xs text-muted-foreground line-clamp-3 leading-snug">
              {user.atividade_descricao}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
