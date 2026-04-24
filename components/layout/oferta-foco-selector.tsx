"use client";

import { useEffect, useState } from "react";
import { Target } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useUserStore } from "@/hooks/use-user-store";

type Oferta = {
  id: string;
  name: string;
};

export function OfertaFocoSelector() {
  const user = useUserStore((s) => s.user);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [focoId, setFocoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const [listResp, focoResp] = await Promise.all([
          fetch(`/api/oferta?userId=${user.id}`),
          fetch(`/api/users/oferta-foco?userId=${user.id}`),
        ]);
        const listData = await listResp.json();
        const focoData = await focoResp.json();
        setOfertas(listData.ofertas || []);
        setFocoId(focoData.oferta?.id || null);
      } catch {
        // silencia — se falhar, só não mostra seletor
      }
    })();
  }, [user?.id]);

  if (!user?.id || ofertas.length === 0) return null;

  const ofertaAtual = ofertas.find((o) => o.id === focoId);

  const setFoco = async (ofertaId: string | null) => {
    setLoading(true);
    try {
      const resp = await fetch("/api/users/oferta-foco", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, ofertaId }),
      });
      if (!resp.ok) throw new Error();
      setFocoId(ofertaId);
      toast.success(
        ofertaId
          ? `Foco: ${ofertas.find((o) => o.id === ofertaId)?.name}`
          : "Foco removido"
      );
      setExpanded(false);
    } catch {
      toast.error("Erro ao atualizar foco.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-2">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
        Oferta em foco
      </div>
      <button
        onClick={() => setExpanded(!expanded)}
        disabled={loading}
        className="flex items-center gap-2 w-full text-left text-sm font-medium px-2 py-1.5 rounded hover:bg-accent transition"
      >
        <Target className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
        <span className="truncate">
          {ofertaAtual?.name || "Nenhuma (conteúdo livre)"}
        </span>
      </button>

      {expanded && (
        <div className="mt-2 space-y-1">
          <button
            onClick={() => setFoco(null)}
            disabled={loading}
            className={`block w-full text-left text-xs px-2 py-1.5 rounded transition ${
              !focoId
                ? "bg-primary/10 text-primary font-medium"
                : "hover:bg-accent"
            }`}
          >
            — Nenhuma (conteúdo livre)
          </button>
          {ofertas.map((o) => (
            <button
              key={o.id}
              onClick={() => setFoco(o.id)}
              disabled={loading}
              className={`block w-full text-left text-xs px-2 py-1.5 rounded transition ${
                focoId === o.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-accent"
              }`}
            >
              {o.name}
            </button>
          ))}
          <Button
            size="sm"
            variant="ghost"
            className="w-full justify-start text-xs h-7"
            onClick={() => (window.location.href = "/produto/oferta")}
          >
            + Gerenciar ofertas
          </Button>
        </div>
      )}
    </div>
  );
}
