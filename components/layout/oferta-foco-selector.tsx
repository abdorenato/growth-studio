"use client";

import { useEffect, useState } from "react";
import { Target, ChevronDown, Plus } from "lucide-react";
import { toast } from "sonner";

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
        // silencia
      }
    })();
  }, [user?.id]);

  if (!user?.id) return null;

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
    <div className="px-3 py-2.5">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1 px-1">
        Oferta em foco
      </div>

      {/* Dropdown trigger */}
      <button
        onClick={() => setExpanded(!expanded)}
        disabled={loading}
        className="flex items-center justify-between gap-2 w-full text-left px-2.5 py-1.5 rounded-md border bg-background hover:border-primary/40 hover:bg-accent transition-all"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Target
            className={`h-3.5 w-3.5 flex-shrink-0 ${
              ofertaAtual ? "text-primary" : "text-muted-foreground"
            }`}
          />
          <span
            className={`text-xs truncate ${
              ofertaAtual ? "font-medium" : "text-muted-foreground"
            }`}
          >
            {ofertaAtual?.name || "Conteúdo livre"}
          </span>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-foreground transition-transform flex-shrink-0 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown content */}
      {expanded && (
        <div className="mt-1.5 border rounded-md bg-background overflow-hidden shadow-sm">
          <button
            onClick={() => setFoco(null)}
            disabled={loading}
            className={`flex items-center justify-between w-full text-left text-xs px-2.5 py-1.5 transition ${
              !focoId
                ? "bg-primary/10 text-primary font-medium"
                : "hover:bg-accent"
            }`}
          >
            <span>— Conteúdo livre</span>
            {!focoId && <span className="text-[10px]">✓</span>}
          </button>
          {ofertas.length > 0 && (
            <div className="border-t">
              {ofertas.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setFoco(o.id)}
                  disabled={loading}
                  className={`flex items-center justify-between w-full text-left text-xs px-2.5 py-1.5 transition ${
                    focoId === o.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-accent"
                  }`}
                >
                  <span className="truncate">{o.name}</span>
                  {focoId === o.id && (
                    <span className="text-[10px] flex-shrink-0">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
          <div className="border-t">
            <a
              href="/produto/oferta"
              className="flex items-center gap-1.5 w-full text-[11px] px-2.5 py-1.5 hover:bg-accent transition text-muted-foreground"
            >
              <Plus className="h-3 w-3" />
              {ofertas.length > 0 ? "Gerenciar ofertas" : "Criar primeira oferta"}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
