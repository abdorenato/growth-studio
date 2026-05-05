"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, Copy, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import { useUserStore } from "@/hooks/use-user-store";
import { ESTAGIOS, type Estagio } from "@/lib/estagios/constants";
import {
  FORMATOS,
  TONS,
  PLATAFORMAS,
  type FormatoKey,
  type TomKey,
  type PlataformaKey,
} from "@/lib/prompts/roteiros-video";

type Bloco = {
  tipo?: string;
  fala?: string;
  visual?: string;
  texto_tela?: string;
  duracao_s?: number;
};

type Roteiro = {
  formato?: FormatoKey;
  tom?: TomKey;
  plataforma?: PlataformaKey;
  duracao_estimada_s?: number;
  titulo_interno?: string;
  hook?: Bloco;
  blocos?: Bloco[];
  cta?: Bloco;
  audio_sugestao?: string;
  legenda_post?: string;
  hashtags?: string[];
};

const FORMATO_KEYS = Object.keys(FORMATOS) as FormatoKey[];
const TOM_KEYS = Object.keys(TONS) as TomKey[];
const PLATAFORMA_KEYS = Object.keys(PLATAFORMAS) as PlataformaKey[];

export default function RoteirosPage() {
  const searchParams = useSearchParams();
  const user = useUserStore((s) => s.user)!;

  const [icps, setIcps] = useState<{ id: string; name: string }[]>([]);
  const [icpId, setIcpId] = useState("");

  const [topic, setTopic] = useState("");
  const [hook, setHook] = useState("");
  const [angle, setAngle] = useState("");
  const [editoriaId, setEditoriaId] = useState<string>("");
  const [targetStage, setTargetStage] = useState<string>("");
  const [atrelarOferta, setAtrelarOferta] = useState(false);

  const [formato, setFormato] = useState<FormatoKey>("revelacao_retardada");
  const [tom, setTom] = useState<TomKey>("provocadora");
  const [plataforma, setPlataforma] = useState<PlataformaKey>("instagram");

  const [loading, setLoading] = useState(false);
  const [roteiro, setRoteiro] = useState<Roteiro | null>(null);

  // ── Bootstrap: ICPs + leitura de query string vinda de /ideias ───────────
  useEffect(() => {
    (async () => {
      const resp = await fetch(`/api/icp?userId=${user.id}`);
      const data = await resp.json();
      setIcps(data.icps || []);
      if (data.icps?.[0]) setIcpId(data.icps[0].id);
    })();

    const qTopic = searchParams.get("topic");
    const qHook = searchParams.get("hook");
    const qAngle = searchParams.get("angle");
    const qEditoriaId = searchParams.get("editoriaId");
    const qStage = searchParams.get("stage");
    if (qTopic || qHook) {
      setTopic(qTopic || "");
      setHook(qHook || "");
      setAngle(qAngle || "");
      if (qEditoriaId) setEditoriaId(qEditoriaId);
      if (qStage) setTargetStage(qStage);
      toast.success(`Ideia carregada: "${qTopic}"`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id, searchParams]);

  const handleGenerate = async () => {
    if (!icpId) return toast.error("Selecione um ICP.");
    if (!topic.trim()) return toast.error("Preencha o tema.");

    setLoading(true);
    setRoteiro(null);
    try {
      const resp = await fetch("/api/roteiros/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          icpId,
          topic,
          hook,
          angle,
          formato,
          tom,
          plataforma,
          atrelarOferta,
          editoriaId: editoriaId || null,
          targetStage: targetStage || null,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Erro ao gerar roteiro");
      }
      const data = await resp.json();
      setRoteiro(data.roteiro || null);
      toast.success("Roteiro gerado!");
      // Scroll suave pra parte do roteiro
      setTimeout(() => {
        document.getElementById("roteiro-output")?.scrollIntoView({
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

  if (icps.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">🎬 Roteiros de Milhões</h1>
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-muted-foreground mb-4">
              Cadastre um ICP primeiro pra gerar roteiros calibrados com sua estratégia.
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
        <h1 className="text-3xl font-bold">🎬 Roteiros de Milhões</h1>
        <p className="text-muted-foreground mt-1">
          1 ideia → 1 formato → 1 tom → 1 roteiro pronto pra gravar.
        </p>
      </div>

      <Separator />

      {/* ETAPA 1: BRIEFING */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">1️⃣ Briefing</h2>

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

          <Field label="Tema">
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex: 5 erros que matam seu engajamento"
            />
          </Field>

          <Field label="Hook (opcional — sugestão de gancho)">
            <Input
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              placeholder="Ex: Você está jogando seguidores fora"
            />
          </Field>

          <Field label="Ângulo (opcional)">
            <Input
              value={angle}
              onChange={(e) => setAngle(e.target.value)}
              placeholder="Ex: contraintuitivo / storytelling"
            />
          </Field>

          {targetStage && (
            <StageBadge stage={targetStage} onClear={() => setTargetStage("")} />
          )}
        </CardContent>
      </Card>

      {/* ETAPA 2: FORMATO */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">2️⃣ Formato do roteiro</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Escolha 1 estrutura. Cada uma serve a um objetivo diferente.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {FORMATO_KEYS.map((key) => {
              const f = FORMATOS[key];
              const selected = formato === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormato(key)}
                  className={
                    "text-left p-3 rounded-lg border transition-all " +
                    (selected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                      : "border-border hover:border-primary/40 hover:bg-accent/50")
                  }
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xl flex-shrink-0">{f.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm">{f.label}</div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {f.descricao}
                      </p>
                      <p className="text-[11px] text-muted-foreground/80 mt-1 italic">
                        {f.quandoUsar}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ETAPA 3: TOM + PLATAFORMA */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold">3️⃣ Tom e plataforma</h2>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Tom da fala
            </Label>
            <div className="flex flex-wrap gap-2">
              {TOM_KEYS.map((key) => {
                const t = TONS[key];
                const selected = tom === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTom(key)}
                    className={
                      "px-3 py-2 rounded-full border text-sm transition-all " +
                      (selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/40")
                    }
                    title={t.descricao}
                  >
                    <span className="mr-1">{t.icon}</span>
                    {t.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {TONS[tom].descricao}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Plataforma
            </Label>
            <div className="flex gap-2">
              {PLATAFORMA_KEYS.map((key) => {
                const p = PLATAFORMAS[key];
                const selected = plataforma === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPlataforma(key)}
                    className={
                      "flex-1 px-3 py-3 rounded-lg border text-sm transition-all " +
                      (selected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                        : "border-border hover:border-primary/40")
                    }
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-lg">{p.icon}</span>
                      <span className="font-medium">{p.label}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {p.duracaoPadrao}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BOTÃO GERAR */}
      <Button
        onClick={handleGenerate}
        disabled={loading || !topic.trim()}
        className="w-full"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Gerando roteiro...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Gerar roteiro
          </>
        )}
      </Button>

      {/* OUTPUT */}
      {roteiro && (
        <div id="roteiro-output">
          <RoteiroOutput
            roteiro={roteiro}
            onRegerar={handleGenerate}
            regenerating={loading}
          />
        </div>
      )}
    </div>
  );
}

// ─── Output do roteiro ──────────────────────────────────────────────────────
function RoteiroOutput({
  roteiro,
  onRegerar,
  regenerating,
}: {
  roteiro: Roteiro;
  onRegerar: () => void;
  regenerating: boolean;
}) {
  const fullText = formatRoteiroAsText(roteiro);

  return (
    <Card>
      <CardContent className="p-6 space-y-5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              ✅ Roteiro pronto
              {roteiro.duracao_estimada_s && (
                <span className="text-xs font-normal text-muted-foreground">
                  ~{roteiro.duracao_estimada_s}s
                </span>
              )}
            </h2>
            {roteiro.titulo_interno && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {roteiro.titulo_interno}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(fullText);
                toast.success("Roteiro copiado!");
              }}
            >
              <Copy className="mr-2 h-4 w-4" /> Copiar tudo
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onRegerar}
              disabled={regenerating}
            >
              {regenerating ? "..." : "Regerar"}
            </Button>
          </div>
        </div>

        <Separator />

        {/* HOOK */}
        {roteiro.hook && <BlocoCard label="🎣 Hook" bloco={roteiro.hook} highlight />}

        {/* BLOCOS */}
        {Array.isArray(roteiro.blocos) &&
          roteiro.blocos.map((b, i) => (
            <BlocoCard
              key={i}
              label={`${i + 1}. ${b.tipo ? capitalize(b.tipo) : "Bloco"}`}
              bloco={b}
            />
          ))}

        {/* CTA */}
        {roteiro.cta && <BlocoCard label="📣 CTA" bloco={roteiro.cta} highlight />}

        <Separator />

        {/* META */}
        {roteiro.audio_sugestao && (
          <div className="text-sm">
            <span className="font-medium">🎵 Áudio: </span>
            <span className="text-muted-foreground">{roteiro.audio_sugestao}</span>
          </div>
        )}

        {roteiro.legenda_post && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Legenda do post
              </Label>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(roteiro.legenda_post || "");
                  toast.success("Legenda copiada!");
                }}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-sm whitespace-pre-wrap rounded-md border bg-muted/30 p-3">
              {roteiro.legenda_post}
            </p>
          </div>
        )}

        {Array.isArray(roteiro.hashtags) && roteiro.hashtags.length > 0 && (
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Hashtags
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {roteiro.hashtags.map((h, i) => (
                <span
                  key={i}
                  className="text-xs bg-secondary px-2 py-1 rounded"
                >
                  {h}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BlocoCard({
  label,
  bloco,
  highlight,
}: {
  label: string;
  bloco: Bloco;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        "rounded-md border p-3 space-y-2 " +
        (highlight ? "border-primary/40 bg-primary/5" : "bg-muted/20")
      }
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
        {bloco.duracao_s != null && (
          <span className="text-[11px] text-muted-foreground">
            {bloco.duracao_s}s
          </span>
        )}
      </div>
      {bloco.fala && (
        <div>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Fala
          </span>
          <p className="text-sm mt-0.5">{bloco.fala}</p>
        </div>
      )}
      {bloco.visual && (
        <div>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Visual / B-roll
          </span>
          <p className="text-sm mt-0.5 text-muted-foreground italic">{bloco.visual}</p>
        </div>
      )}
      {bloco.texto_tela && (
        <div>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Texto na tela
          </span>
          <p className="text-sm mt-0.5 font-medium">{bloco.texto_tela}</p>
        </div>
      )}
    </div>
  );
}

function StageBadge({
  stage,
  onClear,
}: {
  stage: string;
  onClear: () => void;
}) {
  const info = ESTAGIOS[stage as Estagio];
  if (!info) return null;
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xl">{info.icon}</span>
        <div className="min-w-0">
          <p className="text-xs font-medium">
            Calibrado pra audiência: <b>{info.label}</b>
          </p>
          <p className="text-xs text-muted-foreground truncate">{info.tom}</p>
        </div>
      </div>
      <button
        onClick={onClear}
        className="text-xs text-muted-foreground hover:text-foreground flex-shrink-0"
        title="Remover estágio"
      >
        ✕
      </button>
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

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Renderiza o roteiro inteiro como texto pra colar no Notion/Docs/etc.
function formatRoteiroAsText(r: Roteiro): string {
  const lines: string[] = [];
  if (r.titulo_interno) lines.push(`# ${r.titulo_interno}`);
  if (r.duracao_estimada_s) lines.push(`Duração: ~${r.duracao_estimada_s}s`);
  lines.push("");

  const renderBloco = (label: string, b?: Bloco) => {
    if (!b) return;
    lines.push(`## ${label}${b.duracao_s != null ? ` (${b.duracao_s}s)` : ""}`);
    if (b.fala) lines.push(`Fala: ${b.fala}`);
    if (b.visual) lines.push(`Visual: ${b.visual}`);
    if (b.texto_tela) lines.push(`Texto na tela: ${b.texto_tela}`);
    lines.push("");
  };

  renderBloco("HOOK", r.hook);
  if (Array.isArray(r.blocos)) {
    r.blocos.forEach((b, i) =>
      renderBloco(`${i + 1}. ${b.tipo ? b.tipo.toUpperCase() : "BLOCO"}`, b)
    );
  }
  renderBloco("CTA", r.cta);

  if (r.audio_sugestao) {
    lines.push(`Áudio: ${r.audio_sugestao}`);
    lines.push("");
  }
  if (r.legenda_post) {
    lines.push(`---`);
    lines.push(`LEGENDA DO POST:`);
    lines.push(r.legenda_post);
    lines.push("");
  }
  if (Array.isArray(r.hashtags) && r.hashtags.length > 0) {
    lines.push(r.hashtags.join(" "));
  }
  return lines.join("\n").trim();
}
