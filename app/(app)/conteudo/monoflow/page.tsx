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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import { ImageRender } from "@/components/monoflow/image-render";
import { useUserStore } from "@/hooks/use-user-store";
import { ESTAGIOS, type Estagio } from "@/lib/estagios/constants";

type Platform = "reels" | "post" | "carousel" | "stories" | "linkedin" | "tiktok";

const PLATFORMS: { key: Platform; label: string; icon: string }[] = [
  { key: "reels", label: "Reels", icon: "📹" },
  { key: "post", label: "Post", icon: "📸" },
  { key: "carousel", label: "Carrossel", icon: "🎠" },
  { key: "stories", label: "Stories", icon: "📱" },
  { key: "linkedin", label: "LinkedIn", icon: "💼" },
  { key: "tiktok", label: "TikTok", icon: "🎵" },
];

export default function MonoflowPage() {
  const searchParams = useSearchParams();
  const user = useUserStore((s) => s.user)!;
  const updateProgress = useUserStore((s) => s.updateProgress);

  const [icps, setIcps] = useState<any[]>([]);
  const [icpId, setIcpId] = useState("");

  const [topic, setTopic] = useState("");
  const [hook, setHook] = useState("");
  const [angle, setAngle] = useState("");
  const [motherText, setMotherText] = useState("");
  const [loadingMother, setLoadingMother] = useState(false);

  const [selectedPlatforms, setSelectedPlatforms] = useState<Record<Platform, boolean>>({
    reels: true,
    post: true,
    carousel: true,
    stories: true,
    linkedin: true,
    tiktok: true,
  });
  const [generating, setGenerating] = useState<Record<Platform, boolean>>({} as any);
  const [contents, setContents] = useState<Record<string, any>>({});
  const [activePlatform, setActivePlatform] = useState<Platform>("reels");
  const [atrelarOferta, setAtrelarOferta] = useState(false);
  const [ofertaEmFoco, setOfertaEmFoco] = useState<any>(null);
  const [editoriaId, setEditoriaId] = useState<string>("");
  const [targetStage, setTargetStage] = useState<string>("");
  const [contentIds, setContentIds] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const [icpResp, focoResp] = await Promise.all([
        fetch(`/api/icp?userId=${user.id}`),
        fetch(`/api/users/oferta-foco?userId=${user.id}`),
      ]);
      const data = await icpResp.json();
      const focoData = await focoResp.json();
      setIcps(data.icps || []);
      setOfertaEmFoco(focoData.oferta || null);
      if (data.icps?.[0]) setIcpId(data.icps[0].id);
    })();

    // Carrega ideia selecionada via URL (vinda da página de Ideias)
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
    } else {
      // Fallback: lê sessionStorage (compatibilidade com fluxo antigo)
      const stored = sessionStorage.getItem("selected_idea");
      if (stored) {
        try {
          const idea = JSON.parse(stored);
          setTopic(idea.topic || "");
          setHook(idea.hook || "");
          setAngle(idea.angle || "");
          sessionStorage.removeItem("selected_idea");
        } catch {}
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id, searchParams]);

  const handleGenerateMother = async () => {
    if (!icpId || !topic.trim() || !hook.trim()) {
      return toast.error("Preencha ICP, tema e hook.");
    }
    setLoadingMother(true);
    try {
      const resp = await fetch("/api/monoflow/mother-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          icpId,
          topic,
          hook,
          angle,
          atrelarOferta,
          editoriaId: editoriaId || null,
          targetStage: targetStage || null,
        }),
      });
      if (!resp.ok) throw new Error();
      const data = await resp.json();
      setMotherText(data.motherText || "");
    } catch {
      toast.error("Erro ao gerar texto-mãe.");
    } finally {
      setLoadingMother(false);
    }
  };

  const handleGenerateAll = async () => {
    if (!motherText.trim()) return toast.error("Gere o texto-mãe primeiro.");

    const active = PLATFORMS.filter((p) => selectedPlatforms[p.key]);
    if (active.length === 0) return toast.error("Selecione ao menos uma plataforma.");

    // Gera em paralelo
    setGenerating(
      active.reduce((acc, p) => ({ ...acc, [p.key]: true }), {} as Record<Platform, boolean>)
    );

    const results = await Promise.all(
      active.map(async (p) => {
        try {
          const resp = await fetch("/api/monoflow/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              icpId,
              atrelarOferta,
              editoriaId: editoriaId || null,
              targetStage: targetStage || null,
              motherText,
              platform: p.key,
              numSlides: p.key === "carousel" ? 5 : undefined,
            }),
          });
          if (!resp.ok) throw new Error();
          const data = await resp.json();
          return [p.key, data] as const;
        } catch {
          toast.error(`Erro em ${p.label}`);
          return [p.key, null] as const;
        }
      })
    );

    const newContents: Record<string, any> = {};
    for (const [key, data] of results) {
      if (data) newContents[key] = data;
    }
    setContents(newContents);
    setGenerating({} as any);
    updateProgress("conteudos", true);

    // Persistir tudo no Supabase pra poder editar/salvar depois
    try {
      const items = Object.entries(newContents).map(([platform, data]) => ({
        platform,
        data,
      }));
      const saveResp = await fetch("/api/conteudos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, items }),
      });
      if (saveResp.ok) {
        const saveData = await saveResp.json();
        const ids: Record<string, string> = {};
        for (const row of saveData.items || []) {
          ids[row.platform] = row.id;
        }
        setContentIds(ids);
      }
    } catch {
      // não bloqueia — usuário ainda vê os conteúdos
    }

    toast.success(`${Object.keys(newContents).length} conteúdos gerados!`);
    // Foca na primeira aba gerada
    const firstKey = Object.keys(newContents)[0] as Platform;
    if (firstKey) setActivePlatform(firstKey);
  };

  const togglePlatform = (key: Platform) => {
    setSelectedPlatforms((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Atualiza conteúdo no estado (sem salvar ainda)
  const updateContent = (platform: string, newData: any) => {
    setContents((prev) => ({ ...prev, [platform]: newData }));
  };

  // Salva edições do conteúdo no Supabase
  const saveContent = async (platform: string) => {
    const id = contentIds[platform];
    const data = contents[platform];
    if (!id || !data) {
      toast.error("Esse conteúdo não foi salvo automaticamente. Regere.");
      return;
    }
    try {
      const resp = await fetch(`/api/conteudos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      if (!resp.ok) throw new Error();
      toast.success("Edições salvas!");
    } catch {
      toast.error("Erro ao salvar.");
    }
  };

  if (icps.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">🔄 Monoflow</h1>
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">🔄 Monoflow</h1>
        <p className="text-muted-foreground mt-1">
          Um tema → conteúdos para todas as plataformas.
        </p>
      </div>

      <Separator />

      {/* ETAPA 1: INPUT */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">1️⃣ Tema e hook</h2>

          <Field label="ICP">
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={icpId}
              onChange={(e) => setIcpId(e.target.value)}
            >
              {icps.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
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

          <Field label="Hook">
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

          {/* Indicador de estágio carregado da ideia */}
          {targetStage && (
            <StageBadge stage={targetStage} onClear={() => setTargetStage("")} />
          )}

          {/* Toggle: atrelar à oferta em foco */}
          {ofertaEmFoco && (
            <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 p-3">
              <div className="flex-1">
                <p className="text-sm font-medium">Atrelar à oferta em foco?</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Se sim, o conteúdo vai aquecer/vender{" "}
                  <b>{ofertaEmFoco.name}</b>. Se não, fica livre (branding).
                </p>
              </div>
              <button
                onClick={() => setAtrelarOferta(!atrelarOferta)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  atrelarOferta ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-background transition ${
                    atrelarOferta ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          )}
          {!ofertaEmFoco && (
            <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
              💡 Sem oferta em foco. Conteúdo será gerado no modo livre
              (branding/posicionamento).{" "}
              <a href="/produto/oferta" className="text-primary underline">
                Gerenciar ofertas
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ETAPA 2: TEXTO-MÃE */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">2️⃣ Texto-mãe</h2>
          <p className="text-sm text-muted-foreground">
            A IA gera um texto base. Ele é a fonte de todos os formatos depois.
          </p>
          <Button onClick={handleGenerateMother} disabled={loadingMother} variant="outline">
            <Sparkles className="mr-2 h-4 w-4" />
            {loadingMother ? "Gerando..." : "Gerar texto-mãe"}
          </Button>
          <Textarea
            value={motherText}
            onChange={(e) => setMotherText(e.target.value)}
            rows={6}
            placeholder="O texto-mãe aparece aqui depois de gerado. Você pode editar antes de gerar os conteúdos."
          />
        </CardContent>
      </Card>

      {/* ETAPA 3: PLATAFORMAS */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">3️⃣ Plataformas</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p.key}
                onClick={() => togglePlatform(p.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition ${
                  selectedPlatforms[p.key]
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-accent"
                }`}
              >
                <span>{p.icon}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>
          <Button
            onClick={handleGenerateAll}
            disabled={!motherText || Object.values(generating).some(Boolean)}
            className="w-full"
            size="lg"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {Object.values(generating).some(Boolean) ? "Gerando..." : "Gerar tudo"}
          </Button>
        </CardContent>
      </Card>

      {/* ETAPA 4: CONTEÚDOS */}
      {Object.keys(contents).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">4️⃣ Conteúdos gerados</h2>
          <Tabs value={activePlatform} onValueChange={(v) => setActivePlatform(v as Platform)}>
            <TabsList className="w-full flex-wrap h-auto">
              {PLATFORMS.filter((p) => contents[p.key]).map((p) => (
                <TabsTrigger key={p.key} value={p.key}>
                  {p.icon} {p.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {PLATFORMS.filter((p) => contents[p.key]).map((p) => (
              <TabsContent key={p.key} value={p.key}>
                <PlatformCard
                  platform={p.key}
                  data={contents[p.key]}
                  onChange={(newData) => updateContent(p.key, newData)}
                  onSave={() => saveContent(p.key)}
                  saved={Boolean(contentIds[p.key])}
                />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}
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

function PlatformCard({
  platform,
  data,
  onChange,
  onSave,
  saved,
}: {
  platform: Platform;
  data: any;
  onChange: (newData: any) => void;
  onSave: () => void;
  saved: boolean;
}) {
  const copyText = formatCopyText(platform, data);
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            ✏️ Edite qualquer campo abaixo. Salve quando terminar.
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(copyText);
                toast.success("Copiado!");
              }}
            >
              <Copy className="mr-2 h-4 w-4" /> Copiar
            </Button>
            {saved && (
              <Button size="sm" onClick={onSave}>
                💾 Salvar edições
              </Button>
            )}
          </div>
        </div>

        <Separator />

        {platform === "reels" && <ReelsView data={data} onChange={onChange} />}
        {platform === "post" && <PostView data={data} onChange={onChange} />}
        {platform === "carousel" && <CarouselView data={data} onChange={onChange} />}
        {platform === "stories" && <StoriesView data={data} onChange={onChange} />}
        {platform === "linkedin" && <LinkedInView data={data} onChange={onChange} />}
        {platform === "tiktok" && <TiktokView data={data} onChange={onChange} />}
      </CardContent>
    </Card>
  );
}

// Helper: small label
function MiniLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
      {children}
    </Label>
  );
}

function HashtagsField({
  hashtags,
  onChange,
}: {
  hashtags: string[];
  onChange: (h: string[]) => void;
}) {
  return (
    <div className="space-y-1">
      <MiniLabel>Hashtags (separadas por vírgula)</MiniLabel>
      <Input
        value={(hashtags || []).join(", ")}
        onChange={(e) =>
          onChange(
            e.target.value
              .split(",")
              .map((h) => h.trim().replace(/^#/, ""))
              .filter(Boolean)
          )
        }
        placeholder="hashtag1, hashtag2"
      />
    </div>
  );
}

function ReelsView({
  data,
  onChange,
}: {
  data: any;
  onChange: (d: any) => void;
}) {
  const set = (patch: any) => onChange({ ...data, ...patch });
  const updateScene = (i: number, patch: any) => {
    const scenes = [...(data.scenes || [])];
    scenes[i] = { ...scenes[i], ...patch };
    set({ scenes });
  };
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">📹 Reels</h3>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <MiniLabel>Título interno</MiniLabel>
          <Input value={data.title || ""} onChange={(e) => set({ title: e.target.value })} />
        </div>
        <div className="space-y-1">
          <MiniLabel>Duração</MiniLabel>
          <Input value={data.duration || ""} onChange={(e) => set({ duration: e.target.value })} />
        </div>
      </div>

      <div className="space-y-1">
        <MiniLabel>Hook (3s iniciais)</MiniLabel>
        <Textarea rows={2} value={data.hook || ""} onChange={(e) => set({ hook: e.target.value })} />
      </div>

      <div className="space-y-2">
        <MiniLabel>Cenas</MiniLabel>
        {(data.scenes || []).map((s: any, i: number) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-[100px_1fr_1fr] gap-2 p-2 border rounded">
            <Input
              value={s.time || ""}
              onChange={(e) => updateScene(i, { time: e.target.value })}
              placeholder="0-3s"
              className="text-xs font-mono"
            />
            <Textarea
              rows={2}
              value={s.action || ""}
              onChange={(e) => updateScene(i, { action: e.target.value })}
              placeholder="Ação"
              className="text-sm"
            />
            <Textarea
              rows={2}
              value={s.text_overlay || ""}
              onChange={(e) => updateScene(i, { text_overlay: e.target.value })}
              placeholder="Texto na tela"
              className="text-sm"
            />
          </div>
        ))}
      </div>

      <div className="space-y-1">
        <MiniLabel>CTA</MiniLabel>
        <Input value={data.cta || ""} onChange={(e) => set({ cta: e.target.value })} />
      </div>

      <div className="space-y-1">
        <MiniLabel>Legenda</MiniLabel>
        <Textarea rows={4} value={data.caption || ""} onChange={(e) => set({ caption: e.target.value })} />
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <MiniLabel>Áudio sugerido</MiniLabel>
          <Input value={data.audio_suggestion || ""} onChange={(e) => set({ audio_suggestion: e.target.value })} />
        </div>
        <div className="space-y-1">
          <MiniLabel>Dica de trend</MiniLabel>
          <Input value={data.trend_tip || ""} onChange={(e) => set({ trend_tip: e.target.value })} />
        </div>
      </div>
    </div>
  );
}

function PostView({
  data,
  onChange,
}: {
  data: any;
  onChange: (d: any) => void;
}) {
  const set = (patch: any) => onChange({ ...data, ...patch });
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">📸 Post Instagram</h3>

      <div className="space-y-1">
        <MiniLabel>Legenda (até 2200 chars)</MiniLabel>
        <Textarea
          rows={8}
          value={data.caption || ""}
          onChange={(e) => set({ caption: e.target.value })}
        />
        <p className="text-[10px] text-muted-foreground text-right">
          {(data.caption || "").length} / 2200
        </p>
      </div>

      <HashtagsField
        hashtags={data.hashtags || []}
        onChange={(h) => set({ hashtags: h })}
      />

      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <MiniLabel>Melhor horário</MiniLabel>
          <Input value={data.best_time || ""} onChange={(e) => set({ best_time: e.target.value })} />
        </div>
        <div className="space-y-1">
          <MiniLabel>Título na imagem</MiniLabel>
          <Input
            value={data.headline_on_image || ""}
            onChange={(e) => set({ headline_on_image: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-1">
        <MiniLabel>Sugestão de imagem (briefing)</MiniLabel>
        <Textarea
          rows={2}
          value={data.image_suggestion || ""}
          onChange={(e) => set({ image_suggestion: e.target.value })}
        />
      </div>

      {data.image_keywords?.length > 0 && (
        <>
          <Separator />
          <p className="text-xs text-muted-foreground">
            🖼️ A imagem se atualiza ao vivo com o título acima.
          </p>
          <ImageRender
            kind="post"
            keywords={data.image_keywords}
            singleHeadline={
              data.headline_on_image || (data.caption || "").slice(0, 60)
            }
            singleBody=""
          />
        </>
      )}
    </div>
  );
}

function CarouselView({
  data,
  onChange,
}: {
  data: any;
  onChange: (d: any) => void;
}) {
  const set = (patch: any) => onChange({ ...data, ...patch });
  const updateSlide = (i: number, patch: any) => {
    const slides = [...(data.slides || [])];
    slides[i] = { ...slides[i], ...patch };
    set({ slides });
  };
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">🎠 Carrossel</h3>

      <div className="space-y-3">
        <MiniLabel>Slides (edite o texto, a imagem regera automaticamente)</MiniLabel>
        {(data.slides || []).map((slide: any, i: number) => (
          <div key={i} className="p-3 border rounded space-y-2">
            <p className="text-xs text-muted-foreground">
              Slide {(slide.index ?? i) + 1} • {slide.slide_type}
            </p>
            <Input
              value={slide.headline || ""}
              onChange={(e) => updateSlide(i, { headline: e.target.value })}
              placeholder="Headline do slide"
              className="font-semibold"
            />
            <Textarea
              rows={2}
              value={slide.body || ""}
              onChange={(e) => updateSlide(i, { body: e.target.value })}
              placeholder="Body (opcional)"
              className="text-sm"
            />
          </div>
        ))}
      </div>

      <div className="space-y-1">
        <MiniLabel>Legenda do carrossel</MiniLabel>
        <Textarea
          rows={5}
          value={data.caption || ""}
          onChange={(e) => set({ caption: e.target.value })}
        />
      </div>

      <HashtagsField
        hashtags={data.hashtags || []}
        onChange={(h) => set({ hashtags: h })}
      />

      {data.image_keywords?.length > 0 && (
        <>
          <Separator />
          <p className="text-xs text-muted-foreground">
            🎨 Os slides se atualizam ao vivo com os textos acima.
          </p>
          <ImageRender
            kind="carousel"
            keywords={data.image_keywords}
            slides={data.slides || []}
          />
        </>
      )}
    </div>
  );
}

function StoriesView({
  data,
  onChange,
}: {
  data: any;
  onChange: (d: any) => void;
}) {
  const set = (patch: any) => onChange({ ...data, ...patch });
  const updateStory = (i: number, patch: any) => {
    const stories = [...(data.stories || [])];
    stories[i] = { ...stories[i], ...patch };
    set({ stories });
  };
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">📱 Stories</h3>

      <div className="space-y-1">
        <MiniLabel>Estratégia geral da sequência</MiniLabel>
        <Textarea
          rows={2}
          value={data.strategy || ""}
          onChange={(e) => set({ strategy: e.target.value })}
        />
      </div>

      {(data.stories || []).map((s: any, i: number) => (
        <div key={i} className="border rounded p-3 space-y-2">
          <p className="text-xs text-muted-foreground">
            Story {s.order ?? i + 1} • {s.type?.toUpperCase() || "TEXTO"}
          </p>
          <Textarea
            rows={2}
            value={s.text || ""}
            onChange={(e) => updateStory(i, { text: e.target.value })}
            placeholder="Texto principal"
          />
          {s.sticker && (
            <div className="space-y-1">
              <MiniLabel>Sticker — pergunta/enquete</MiniLabel>
              <Input
                value={s.sticker.question || ""}
                onChange={(e) =>
                  updateStory(i, {
                    sticker: { ...s.sticker, question: e.target.value },
                  })
                }
                placeholder="Pergunta"
              />
              {s.sticker.options && (
                <Input
                  value={(s.sticker.options || []).join(", ")}
                  onChange={(e) =>
                    updateStory(i, {
                      sticker: {
                        ...s.sticker,
                        options: e.target.value
                          .split(",")
                          .map((o) => o.trim())
                          .filter(Boolean),
                      },
                    })
                  }
                  placeholder="Opções (separadas por vírgula)"
                />
              )}
            </div>
          )}
          <Input
            value={s.visual_tip || ""}
            onChange={(e) => updateStory(i, { visual_tip: e.target.value })}
            placeholder="Dica visual"
            className="text-xs"
          />
        </div>
      ))}
    </div>
  );
}

function LinkedInView({
  data,
  onChange,
}: {
  data: any;
  onChange: (d: any) => void;
}) {
  const set = (patch: any) => onChange({ ...data, ...patch });
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">💼 LinkedIn</h3>

      <div className="space-y-1">
        <MiniLabel>Post completo</MiniLabel>
        <Textarea
          rows={12}
          value={data.post || ""}
          onChange={(e) => set({ post: e.target.value })}
        />
      </div>

      <HashtagsField
        hashtags={data.hashtags || []}
        onChange={(h) => set({ hashtags: h })}
      />
    </div>
  );
}

function TiktokView({
  data,
  onChange,
}: {
  data: any;
  onChange: (d: any) => void;
}) {
  const set = (patch: any) => onChange({ ...data, ...patch });
  const updateScene = (i: number, patch: any) => {
    const scenes = [...(data.scenes || [])];
    scenes[i] = { ...scenes[i], ...patch };
    set({ scenes });
  };
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">🎵 TikTok</h3>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <MiniLabel>Título interno</MiniLabel>
          <Input value={data.title || ""} onChange={(e) => set({ title: e.target.value })} />
        </div>
        <div className="space-y-1">
          <MiniLabel>Duração</MiniLabel>
          <Input value={data.duration || ""} onChange={(e) => set({ duration: e.target.value })} />
        </div>
      </div>

      <div className="space-y-1">
        <MiniLabel>Hook (2s iniciais)</MiniLabel>
        <Textarea rows={2} value={data.hook || ""} onChange={(e) => set({ hook: e.target.value })} />
      </div>

      <div className="space-y-2">
        <MiniLabel>Cenas</MiniLabel>
        {(data.scenes || []).map((s: any, i: number) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-[100px_1fr_1fr] gap-2 p-2 border rounded">
            <Input
              value={s.time || ""}
              onChange={(e) => updateScene(i, { time: e.target.value })}
              placeholder="0-2s"
              className="text-xs font-mono"
            />
            <Textarea
              rows={2}
              value={s.action || ""}
              onChange={(e) => updateScene(i, { action: e.target.value })}
              placeholder="Ação"
              className="text-sm"
            />
            <Textarea
              rows={2}
              value={s.text_overlay || ""}
              onChange={(e) => updateScene(i, { text_overlay: e.target.value })}
              placeholder="Texto na tela"
              className="text-sm"
            />
          </div>
        ))}
      </div>

      <div className="space-y-1">
        <MiniLabel>CTA</MiniLabel>
        <Input value={data.cta || ""} onChange={(e) => set({ cta: e.target.value })} />
      </div>

      <div className="space-y-1">
        <MiniLabel>Legenda</MiniLabel>
        <Textarea rows={4} value={data.caption || ""} onChange={(e) => set({ caption: e.target.value })} />
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <MiniLabel>Som sugerido</MiniLabel>
          <Input value={data.sound_suggestion || ""} onChange={(e) => set({ sound_suggestion: e.target.value })} />
        </div>
        <div className="space-y-1">
          <MiniLabel>Dicas TikTok</MiniLabel>
          <Input value={data.tiktok_tips || ""} onChange={(e) => set({ tiktok_tips: e.target.value })} />
        </div>
      </div>
    </div>
  );
}

function formatCopyText(platform: Platform, data: any): string {
  const lines: string[] = [];
  switch (platform) {
    case "reels":
      lines.push(`🎬 ROTEIRO DE REELS — ${data.title || ""}`);
      lines.push(`Duração: ${data.duration || ""}`);
      lines.push("");
      lines.push(`🪝 HOOK: ${data.hook || ""}`);
      (data.scenes || []).forEach((s: any) => {
        lines.push(`[${s.time}] ${s.action}`);
        if (s.text_overlay) lines.push(`   📝 ${s.text_overlay}`);
      });
      lines.push("");
      lines.push(`📢 CTA: ${data.cta || ""}`);
      lines.push("");
      lines.push(`📝 LEGENDA:\n${data.caption || ""}`);
      break;
    case "post":
      lines.push("📸 POST INSTAGRAM");
      lines.push("");
      lines.push(data.caption || "");
      if (data.hashtags) lines.push(`\n${data.hashtags.map((h: string) => `#${h}`).join(" ")}`);
      break;
    case "carousel":
      lines.push("🎠 CARROSSEL");
      (data.slides || []).forEach((s: any) => {
        lines.push(`\n— Slide ${s.index + 1} (${s.slide_type}) —`);
        lines.push(`${s.headline}`);
        if (s.body) lines.push(`${s.body}`);
      });
      lines.push(`\n📝 LEGENDA:\n${data.caption || ""}`);
      break;
    case "stories":
      lines.push("📱 STORIES");
      (data.stories || []).forEach((s: any) => {
        lines.push(`\nStory ${s.order} (${s.type}): ${s.text}`);
      });
      break;
    case "linkedin":
      lines.push("💼 LINKEDIN");
      lines.push("");
      lines.push(data.post || "");
      break;
    case "tiktok":
      lines.push(`🎵 TIKTOK — ${data.title}`);
      lines.push(`Hook: ${data.hook}`);
      (data.scenes || []).forEach((s: any) => {
        lines.push(`[${s.time}] ${s.action}`);
      });
      lines.push(`\n📝 ${data.caption || ""}`);
      break;
  }
  return lines.join("\n");
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
