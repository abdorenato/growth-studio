"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, Copy, Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

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
import type { Bloco, RoteiroValidated } from "@/lib/roteiros/types";

// O endpoint sempre retorna RoteiroValidated (com word_count, duracao
// calculada e warnings). Aliasamos pra "Roteiro" pra manter resto do
// arquivo legivel.
type Roteiro = RoteiroValidated;

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
  // Id do roteiro persistido (depois do auto-save apos gerar). Quando existe,
  // edicoes do usuario podem ser salvas via PATCH.
  const [roteiroId, setRoteiroId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

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
    setRoteiroId(null);
    setDirty(false);
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
      const novoRoteiro = data.roteiro || null;
      setRoteiro(novoRoteiro);
      toast.success("Roteiro gerado!");
      // Scroll suave pra parte do roteiro
      setTimeout(() => {
        document.getElementById("roteiro-output")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);

      // Auto-save em background — nao bloqueia UI nem mostra erro se falhar
      if (novoRoteiro) {
        try {
          const saveResp = await fetch("/api/roteiros", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              topic,
              hook,
              angle,
              formato,
              tom,
              plataforma,
              targetStage: targetStage || null,
              editoriaId: editoriaId || null,
              atrelarOferta,
              data: novoRoteiro,
            }),
          });
          if (saveResp.ok) {
            const saveData = await saveResp.json();
            if (saveData.roteiro?.id) setRoteiroId(saveData.roteiro.id);
          }
        } catch {
          // silencioso — usuario ainda pode editar e salvar manualmente
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  };

  // Atualiza um campo do roteiro localmente e marca como modificado
  const handleUpdateRoteiro = (patch: Partial<Roteiro>) => {
    setRoteiro((prev) => (prev ? { ...prev, ...patch } : prev));
    setDirty(true);
  };

  // Persiste edicoes do usuario (PATCH no roteiro ja salvo)
  const handleSaveEdits = async () => {
    if (!roteiroId || !roteiro) {
      toast.error("Roteiro ainda não foi salvo. Tente regerar.");
      return;
    }
    setSaving(true);
    try {
      const resp = await fetch(`/api/roteiros/${roteiroId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: roteiro }),
      });
      if (!resp.ok) throw new Error();
      setDirty(false);
      toast.success("Edições salvas!");
    } catch {
      toast.error("Erro ao salvar edições.");
    } finally {
      setSaving(false);
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
            onChange={handleUpdateRoteiro}
            onSave={handleSaveEdits}
            saving={saving}
            dirty={dirty}
            saved={Boolean(roteiroId)}
          />
        </div>
      )}
    </div>
  );
}

// ─── Output do roteiro ──────────────────────────────────────────────────────
// Editavel inline. Toda alteracao chama onChange (que marca dirty no parent).
// Botao Salvar fica habilitado quando ha edicoes pendentes E o roteiro foi
// persistido (ou seja, tem id no servidor).
function RoteiroOutput({
  roteiro,
  onRegerar,
  regenerating,
  onChange,
  onSave,
  saving,
  dirty,
  saved,
}: {
  roteiro: Roteiro;
  onRegerar: () => void;
  regenerating: boolean;
  onChange: (patch: Partial<Roteiro>) => void;
  onSave: () => void;
  saving: boolean;
  dirty: boolean;
  saved: boolean;
}) {
  const fullText = formatRoteiroAsText(roteiro);

  // Helpers pra editar campos aninhados
  const updateHook = (patch: Partial<Bloco>) =>
    onChange({ hook: { ...roteiro.hook, ...patch } });
  const updateCta = (patch: Partial<Bloco>) =>
    onChange({ cta: { ...roteiro.cta, ...patch } });
  const updateBloco = (i: number, patch: Partial<Bloco>) => {
    const arr = [...(roteiro.blocos || [])];
    arr[i] = { ...arr[i], ...patch };
    onChange({ blocos: arr });
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2 flex-wrap">
              ✅ Roteiro pronto
              {dirty && (
                <span className="text-[11px] font-normal px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  edições não salvas
                </span>
              )}
            </h2>
            {roteiro.titulo_interno && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {roteiro.titulo_interno}
              </p>
            )}
            {/* Métricas calculadas pelo post-processador */}
            <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
              {roteiro.duracao_calculada_s != null && (
                <span>
                  ⏱️ <b>~{roteiro.duracao_calculada_s}s</b> falados
                </span>
              )}
              {roteiro.word_count != null && (
                <span>
                  📝 <b>{roteiro.word_count}</b> palavras
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              ✏️ Edite qualquer campo abaixo. Use Salvar pra persistir as alterações.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
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
            {saved && (
              <Button size="sm" onClick={onSave} disabled={!dirty || saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Salvando..." : "Salvar edições"}
              </Button>
            )}
          </div>
        </div>

        <Separator />

        {/* WARNINGS do post-processador (se houver) */}
        {Array.isArray(roteiro.warnings) && roteiro.warnings.length > 0 && (
          <div className="rounded-md border border-amber-300/50 bg-amber-50/60 dark:bg-amber-950/20 p-3 space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
              ⚠️ Observações do validador
            </p>
            <ul className="text-xs space-y-0.5 list-disc list-inside text-amber-900/80 dark:text-amber-200/80">
              {roteiro.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* HOOK */}
        {roteiro.hook && (
          <BlocoCard
            label="🎣 Hook"
            bloco={roteiro.hook}
            highlight
            onChange={updateHook}
          />
        )}

        {/* BLOCOS */}
        {Array.isArray(roteiro.blocos) &&
          roteiro.blocos.map((b, i) => (
            <BlocoCard
              key={i}
              label={`${i + 1}. ${b.tipo ? capitalize(b.tipo) : "Bloco"}`}
              bloco={b}
              onChange={(patch) => updateBloco(i, patch)}
            />
          ))}

        {/* FRASE MEMORÁVEL — campo editavel separado */}
        <div
          className={
            "rounded-md border p-3 space-y-2 border-yellow-300/50 bg-yellow-50/50 dark:bg-yellow-950/20"
          }
        >
          <span className="text-xs font-bold uppercase tracking-wider">
            💎 Frase memorável
          </span>
          <Textarea
            value={roteiro.frase_memoravel || ""}
            onChange={(e) => onChange({ frase_memoravel: e.target.value })}
            placeholder="Frase de impacto antes do CTA. Ex: 'Parecia crescimento. Era vazamento.'"
            rows={2}
            className="bg-background"
          />
        </div>

        {/* CTA */}
        {roteiro.cta && (
          <BlocoCard
            label="📣 CTA"
            bloco={roteiro.cta}
            highlight
            onChange={updateCta}
          />
        )}

        <Separator />

        {/* META */}
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            🎵 Áudio sugerido
          </Label>
          <Input
            value={roteiro.audio_sugestao || ""}
            onChange={(e) => onChange({ audio_sugestao: e.target.value })}
            placeholder="Tipo de áudio ou trend"
          />
        </div>

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
          <Textarea
            value={roteiro.legenda_post || ""}
            onChange={(e) => onChange({ legenda_post: e.target.value })}
            rows={5}
            placeholder="Legenda completa pra publicar."
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Hashtags (separadas por espaço)
          </Label>
          <Input
            value={(roteiro.hashtags || []).join(" ")}
            onChange={(e) =>
              onChange({
                hashtags: e.target.value
                  .split(/\s+/)
                  .map((h) => h.trim())
                  .filter(Boolean),
              })
            }
            placeholder="#tag1 #tag2 #tag3"
          />
          {Array.isArray(roteiro.hashtags) && roteiro.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {roteiro.hashtags.map((h, i) => (
                <span key={i} className="text-xs bg-secondary px-2 py-1 rounded">
                  {h}
                </span>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function BlocoCard({
  label,
  bloco,
  highlight,
  onChange,
}: {
  label: string;
  bloco: Bloco;
  highlight?: boolean;
  onChange: (patch: Partial<Bloco>) => void;
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
          <Input
            type="number"
            value={bloco.duracao_s}
            onChange={(e) =>
              onChange({ duracao_s: Number(e.target.value) || 0 })
            }
            className="w-16 h-6 text-[11px] px-1 text-right"
          />
        )}
      </div>
      <div className="space-y-1">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Fala
        </span>
        <Textarea
          value={bloco.fala || ""}
          onChange={(e) => onChange({ fala: e.target.value })}
          placeholder="O que falar"
          rows={2}
          className="bg-background"
        />
      </div>
      <div className="space-y-1">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Visual / B-roll
        </span>
        <Textarea
          value={bloco.visual || ""}
          onChange={(e) => onChange({ visual: e.target.value })}
          placeholder="O que aparece na tela"
          rows={2}
          className="bg-background italic"
        />
      </div>
      <div className="space-y-1">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Texto na tela (overlay)
        </span>
        <Input
          value={bloco.texto_tela || ""}
          onChange={(e) => onChange({ texto_tela: e.target.value })}
          placeholder="Overlay curto (3-6 palavras)"
          className="bg-background font-medium"
        />
      </div>
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
  if (r.frase_memoravel) {
    lines.push(`## FRASE MEMORÁVEL`);
    lines.push(r.frase_memoravel);
    lines.push("");
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
