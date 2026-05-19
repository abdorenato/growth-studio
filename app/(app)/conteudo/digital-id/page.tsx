"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sparkles, Copy, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import { useUserStore } from "@/hooks/use-user-store";

// Shape do digitalId retornado por /api/digital-id/generate.
type DigitalId = {
  who?: {
    name?: string;
    tagline?: string;
    archetype_primary?: string;
    archetype_secondary?: string;
    relationship?: string;
  };
  voice?: {
    tone?: string[];
    words_use?: string[];
    words_avoid?: string[];
  };
  stance?: {
    domain?: string;
    flag?: string;
    boundaries?: string[];
  };
  audience?: {
    icp_name?: string;
    icp_summary?: string;
    reflection?: string;
    pains?: string[];
  };
  support_note?: string;
  coherence_check?: {
    status?: "ok" | "issues";
    issues?: string[];
  };
};

const ARQUETIPO_LABEL: Record<string, string> = {
  especialista: "Especialista",
  protetor: "Protetor",
  proximo: "Próximo",
  desbravador: "Desbravador",
};

export default function DigitalIdPage() {
  const user = useUserStore((s) => s.user)!;

  const [icps, setIcps] = useState<{ id: string; name: string }[]>([]);
  const [icpId, setIcpId] = useState("");
  const [loading, setLoading] = useState(false);
  const [digitalId, setDigitalId] = useState<DigitalId | null>(null);

  useEffect(() => {
    (async () => {
      const resp = await fetch(`/api/icp?userId=${user.id}`);
      const data = await resp.json();
      setIcps(data.icps || []);
      if (data.icps?.[0]) setIcpId(data.icps[0].id);
    })();
  }, [user.id]);

  const handleGenerate = async () => {
    if (!icpId) return toast.error("Selecione um ICP.");
    setLoading(true);
    setDigitalId(null);
    try {
      const resp = await fetch("/api/digital-id/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, icpId }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || "Erro ao gerar Digital ID");
      }
      setDigitalId(data.digitalId || null);
      toast.success("Digital ID gerado!");
      setTimeout(() => {
        document.getElementById("digital-id-output")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  };

  // Feature em rollout — só admins por enquanto.
  if (!user.is_admin) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">🪪 Digital ID</h1>
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-muted-foreground">
              Esse módulo ainda não está disponível.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (icps.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">🪪 Digital ID</h1>
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-muted-foreground mb-4">
              Cadastre um ICP primeiro. O Digital ID consolida sua fundação de
              marca — e precisa dos 4 módulos prontos.
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
        <h1 className="text-3xl font-bold">🪪 Digital ID</h1>
        <p className="text-muted-foreground mt-1">
          O documento único que consolida sua fundação de marca — Voz, ICP,
          Posicionamento e Território num só lugar.
        </p>
      </div>

      <Separator />

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Gerar</h2>
          <p className="text-sm text-muted-foreground">
            O Digital ID é uma <b>síntese</b> — não cria nada novo, consolida o
            que seus 4 módulos de fundação já produziram.
          </p>

          <div className="space-y-1.5">
            <Label>ICP</Label>
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
          </div>

          <Button onClick={handleGenerate} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Consolidando...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {digitalId ? "Regerar Digital ID" : "Gerar Digital ID"}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {digitalId && (
        <div id="digital-id-output">
          <BrandBoard
            digitalId={digitalId}
            avatarUrl={user.avatar_url || null}
          />
        </div>
      )}
    </div>
  );
}

// ─── BRAND BOARD ────────────────────────────────────────────────────────────
function BrandBoard({
  digitalId: d,
  avatarUrl,
}: {
  digitalId: DigitalId;
  avatarUrl: string | null;
}) {
  const fullText = formatAsText(d);
  const nome = d.who?.name || "Sua Marca";
  const arquetipos = [d.who?.archetype_primary, d.who?.archetype_secondary]
    .filter(Boolean)
    .map((a) => ARQUETIPO_LABEL[a as string] || a)
    .join(" · ");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            navigator.clipboard.writeText(fullText);
            toast.success("Copiado!");
          }}
        >
          <Copy className="mr-2 h-4 w-4" /> Copiar tudo
        </Button>
      </div>

      {/* O board inteiro num card só */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* ── HEADER / IDENTIDADE ── */}
          <div className="bg-muted/40 border-b px-6 py-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">
              🪪 Digital ID
            </p>
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={nome}
                  className="h-16 w-16 rounded-full object-cover border-2 border-background shadow-sm flex-shrink-0"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-primary/15 flex items-center justify-center text-2xl font-bold text-primary flex-shrink-0">
                  {nome.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-2xl font-bold leading-tight truncate">
                  {nome}
                </h2>
                {arquetipos && (
                  <p className="text-xs font-medium text-primary mt-0.5">
                    {arquetipos}
                  </p>
                )}
                {d.who?.tagline && (
                  <p className="text-sm text-muted-foreground italic mt-1">
                    {d.who.tagline}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── HERO / BANDEIRA ── */}
          {d.stance?.flag && (
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 py-8 text-center border-b">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70 mb-3">
                A Bandeira — o que defendo
              </p>
              <p className="text-xl md:text-2xl font-bold leading-snug max-w-2xl mx-auto">
                &ldquo;{d.stance.flag}&rdquo;
              </p>
            </div>
          )}

          {/* ── GRID 2×2 ── */}
          <div className="grid grid-cols-1 md:grid-cols-2">
            <Quadrante
              icon="🗣"
              titulo="Como soa"
              cor="sky"
              className="border-b md:border-r"
            >
              {d.voice?.tone && d.voice.tone.length > 0 && (
                <ChipCampo label="Tom" itens={d.voice.tone} />
              )}
              {d.voice?.words_use && d.voice.words_use.length > 0 && (
                <ChipCampo label="Palavras que usa" itens={d.voice.words_use} />
              )}
              {d.voice?.words_avoid && d.voice.words_avoid.length > 0 && (
                <ChipCampo
                  label="Palavras que evita"
                  itens={d.voice.words_avoid}
                  tom="vermelho"
                />
              )}
            </Quadrante>

            <Quadrante
              icon="🎯"
              titulo="O que defende"
              cor="amber"
              className="border-b"
            >
              {d.stance?.domain && (
                <Campo label="Domínio" valor={d.stance.domain} />
              )}
              {d.stance?.boundaries && d.stance.boundaries.length > 0 && (
                <ListaCampo
                  label="Fronteiras — o que recusa"
                  itens={d.stance.boundaries}
                />
              )}
            </Quadrante>

            <Quadrante
              icon="👤"
              titulo="Pra quem fala"
              cor="violet"
              className="border-b md:border-r md:border-b-0"
            >
              {d.audience?.icp_name && (
                <Campo label="ICP" valor={d.audience.icp_name} />
              )}
              {d.audience?.icp_summary && (
                <Campo label="Resumo" valor={d.audience.icp_summary} />
              )}
              {d.audience?.reflection && (
                <Campo label="Reflexo" valor={d.audience.reflection} />
              )}
              {d.audience?.pains && d.audience.pains.length > 0 && (
                <ListaCampo label="Dores principais" itens={d.audience.pains} />
              )}
            </Quadrante>

            <Quadrante icon="💛" titulo="Relação & Essência" cor="emerald">
              {d.who?.relationship && (
                <Campo label="Vínculo que cria" valor={d.who.relationship} />
              )}
              {d.support_note && (
                <Campo label="O que me move" valor={d.support_note} italico />
              )}
            </Quadrante>
          </div>

          {/* ── RODAPÉ / COERÊNCIA ── */}
          <CoherenceFooter check={d.coherence_check} />
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Quadrante do grid ──────────────────────────────────────────────────────
const COR_MAP: Record<string, string> = {
  sky: "text-sky-600 dark:text-sky-400",
  amber: "text-amber-600 dark:text-amber-400",
  violet: "text-violet-600 dark:text-violet-400",
  emerald: "text-emerald-600 dark:text-emerald-400",
};

function Quadrante({
  icon,
  titulo,
  cor,
  className,
  children,
}: {
  icon: string;
  titulo: string;
  cor: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={"p-5 space-y-3 " + (className || "")}>
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <h3
          className={
            "text-xs font-bold uppercase tracking-wider " + (COR_MAP[cor] || "")
          }
        >
          {titulo}
        </h3>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function CoherenceFooter({
  check,
}: {
  check?: { status?: "ok" | "issues"; issues?: string[] };
}) {
  const isOk = check?.status === "ok" || !check?.issues?.length;
  return (
    <div
      className={
        "border-t px-6 py-4 " +
        (isOk
          ? "bg-emerald-50/60 dark:bg-emerald-950/20"
          : "bg-amber-50/60 dark:bg-amber-950/20")
      }
    >
      <span className="text-xs font-bold uppercase tracking-wider">
        {isOk ? "✅ Coerência da fundação" : "⚠️ Coerência da fundação"}
      </span>
      {isOk ? (
        <p className="text-sm mt-1 text-muted-foreground">
          Sem contradições — fundação alinhada.
        </p>
      ) : (
        <ul className="text-sm mt-1 space-y-1 list-disc list-inside">
          {(check?.issues || []).map((iss, i) => (
            <li key={i}>{iss}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Componentes de campo ───────────────────────────────────────────────────
function Campo({
  label,
  valor,
  italico,
}: {
  label: string;
  valor: string;
  italico?: boolean;
}) {
  return (
    <div>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <p className={"text-sm mt-0.5 " + (italico ? "italic" : "")}>{valor}</p>
    </div>
  );
}

function ChipCampo({
  label,
  itens,
  tom,
}: {
  label: string;
  itens: string[];
  tom?: "vermelho";
}) {
  return (
    <div>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5 mt-1">
        {itens.map((it, i) => (
          <span
            key={i}
            className={
              "text-xs px-2 py-1 rounded " +
              (tom === "vermelho"
                ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                : "bg-secondary")
            }
          >
            {it}
          </span>
        ))}
      </div>
    </div>
  );
}

function ListaCampo({ label, itens }: { label: string; itens: string[] }) {
  return (
    <div>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <ul className="text-sm mt-1 space-y-1 list-disc list-inside">
        {itens.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

// Documento inteiro como texto pra copiar.
function formatAsText(d: DigitalId): string {
  const L: string[] = [];
  L.push("=== DIGITAL ID ===\n");

  L.push("1 · QUEM É");
  if (d.who?.name) L.push(`Nome: ${d.who.name}`);
  if (d.who?.tagline) L.push(`Tagline: ${d.who.tagline}`);
  if (d.who?.archetype_primary)
    L.push(
      `Arquétipo: ${[d.who.archetype_primary, d.who.archetype_secondary]
        .filter(Boolean)
        .join(" + ")}`
    );
  if (d.who?.relationship) L.push(`Relação: ${d.who.relationship}`);
  L.push("");

  if (d.stance?.flag) {
    L.push(`BANDEIRA: ${d.stance.flag}`);
    L.push("");
  }

  L.push("2 · COMO SOA");
  if (d.voice?.tone) L.push(`Tom: ${d.voice.tone.join(", ")}`);
  if (d.voice?.words_use) L.push(`Usa: ${d.voice.words_use.join(", ")}`);
  if (d.voice?.words_avoid) L.push(`Evita: ${d.voice.words_avoid.join(", ")}`);
  L.push("");

  L.push("3 · O QUE DEFENDE");
  if (d.stance?.domain) L.push(`Domínio: ${d.stance.domain}`);
  if (d.stance?.boundaries)
    L.push(`Fronteiras: ${d.stance.boundaries.join(" | ")}`);
  L.push("");

  L.push("4 · PRA QUEM FALA");
  if (d.audience?.icp_name) L.push(`ICP: ${d.audience.icp_name}`);
  if (d.audience?.icp_summary) L.push(`Resumo: ${d.audience.icp_summary}`);
  if (d.audience?.reflection) L.push(`Reflexo: ${d.audience.reflection}`);
  if (d.audience?.pains) L.push(`Dores: ${d.audience.pains.join(" | ")}`);
  L.push("");

  if (d.support_note) {
    L.push(`O QUE ME MOVE: ${d.support_note}`);
    L.push("");
  }

  if (d.coherence_check) {
    const ok =
      d.coherence_check.status === "ok" || !d.coherence_check.issues?.length;
    L.push("DIAGNÓSTICO DE COERÊNCIA");
    L.push(
      ok
        ? "Sem contradições — fundação alinhada."
        : (d.coherence_check.issues || []).map((i) => `- ${i}`).join("\n")
    );
  }

  return L.join("\n").trim();
}
