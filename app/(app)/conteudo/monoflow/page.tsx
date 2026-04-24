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
    if (qTopic || qHook) {
      setTopic(qTopic || "");
      setHook(qHook || "");
      setAngle(qAngle || "");
      if (qEditoriaId) setEditoriaId(qEditoriaId);
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
    toast.success(`${Object.keys(newContents).length} conteúdos gerados!`);
    // Foca na primeira aba gerada
    const firstKey = Object.keys(newContents)[0] as Platform;
    if (firstKey) setActivePlatform(firstKey);
  };

  const togglePlatform = (key: Platform) => {
    setSelectedPlatforms((prev) => ({ ...prev, [key]: !prev[key] }));
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
                <PlatformCard platform={p.key} data={contents[p.key]} />
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

function PlatformCard({ platform, data }: { platform: Platform; data: any }) {
  const copyText = formatCopyText(platform, data);
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {platform === "reels" && <ReelsView data={data} />}
        {platform === "post" && <PostView data={data} />}
        {platform === "carousel" && <CarouselView data={data} />}
        {platform === "stories" && <StoriesView data={data} />}
        {platform === "linkedin" && <LinkedInView data={data} />}
        {platform === "tiktok" && <TiktokView data={data} />}

        <Separator />

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>📋 Copiar tudo</Label>
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
          </div>
          <Textarea value={copyText} readOnly rows={8} className="font-mono text-xs" />
        </div>
      </CardContent>
    </Card>
  );
}

function ReelsView({ data }: { data: any }) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold">📹 {data.title}</h3>
      <p><b>Duração:</b> {data.duration}</p>
      <p><b>🪝 Hook:</b> {data.hook}</p>
      <div>
        <p className="font-medium mb-2">Cenas:</p>
        <div className="space-y-2">
          {(data.scenes || []).map((s: any, i: number) => (
            <div key={i} className="grid grid-cols-[80px_1fr_1fr] gap-2 text-sm">
              <code className="text-xs">{s.time}</code>
              <div>{s.action}</div>
              <div className="text-muted-foreground">📝 {s.text_overlay}</div>
            </div>
          ))}
        </div>
      </div>
      <p><b>📢 CTA:</b> {data.cta}</p>
      <p><b>🎵 Áudio:</b> {data.audio_suggestion}</p>
      {data.trend_tip && <p className="text-sm bg-muted p-2 rounded">💡 {data.trend_tip}</p>}
    </div>
  );
}

function PostView({ data }: { data: any }) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold">📸 Post Instagram</h3>
      <div className="whitespace-pre-wrap bg-muted p-3 rounded text-sm">{data.caption}</div>
      {data.hashtags && (
        <p className="text-xs">#️⃣ {data.hashtags.map((h: string) => `#${h}`).join(" ")}</p>
      )}
      {data.best_time && <p className="text-sm"><b>⏰ Melhor horário:</b> {data.best_time}</p>}
      {data.headline_on_image && (
        <p className="text-sm"><b>📝 Título na imagem:</b> {data.headline_on_image}</p>
      )}
      {data.image_suggestion && (
        <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
          🖼️ {data.image_suggestion}
        </p>
      )}
      {data.image_keywords?.length > 0 && (
        <>
          <Separator />
          <ImageRender
            kind="post"
            keywords={data.image_keywords}
            singleHeadline={data.headline_on_image || (data.caption || "").slice(0, 60)}
            singleBody=""
          />
        </>
      )}
    </div>
  );
}

function CarouselView({ data }: { data: any }) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold">🎠 Carrossel</h3>
      <div className="grid md:grid-cols-2 gap-3">
        {(data.slides || []).map((slide: any, i: number) => (
          <div key={i} className="p-3 border rounded space-y-1">
            <p className="text-xs text-muted-foreground">
              Slide {slide.index + 1} • {slide.slide_type}
            </p>
            <p className="font-semibold">{slide.headline}</p>
            {slide.body && <p className="text-sm text-muted-foreground">{slide.body}</p>}
          </div>
        ))}
      </div>
      <p><b>📝 Legenda:</b></p>
      <div className="whitespace-pre-wrap bg-muted p-3 rounded text-sm">{data.caption}</div>
      {data.hashtags && (
        <p className="text-xs">#️⃣ {data.hashtags.map((h: string) => `#${h}`).join(" ")}</p>
      )}
      {data.image_keywords?.length > 0 && (
        <>
          <Separator />
          <ImageRender kind="carousel" keywords={data.image_keywords} slides={data.slides || []} />
        </>
      )}
    </div>
  );
}

function StoriesView({ data }: { data: any }) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold">📱 Stories</h3>
      {data.strategy && <p className="text-sm bg-muted p-2 rounded">🎯 {data.strategy}</p>}
      {(data.stories || []).map((s: any, i: number) => (
        <div key={i} className="border rounded p-3 space-y-1">
          <p className="text-xs text-muted-foreground">
            Story {s.order} • {s.type?.toUpperCase()}
          </p>
          <p>{s.text}</p>
          {s.sticker && (
            <p className="text-sm">
              <b>🏷️ {s.sticker.type}:</b> {s.sticker.question}
              {s.sticker.options && (
                <span className="ml-2 text-muted-foreground">
                  ({s.sticker.options.join(" | ")})
                </span>
              )}
            </p>
          )}
          {s.visual_tip && <p className="text-xs text-muted-foreground">🎨 {s.visual_tip}</p>}
        </div>
      ))}
    </div>
  );
}

function LinkedInView({ data }: { data: any }) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold">💼 LinkedIn</h3>
      <div className="whitespace-pre-wrap bg-muted p-3 rounded text-sm">{data.post}</div>
      {data.hashtags && (
        <p className="text-xs">#️⃣ {data.hashtags.map((h: string) => `#${h}`).join(" ")}</p>
      )}
    </div>
  );
}

function TiktokView({ data }: { data: any }) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold">🎵 {data.title}</h3>
      <p><b>Duração:</b> {data.duration}</p>
      <p><b>🪝 Hook:</b> {data.hook}</p>
      <div>
        <p className="font-medium mb-2">Cenas:</p>
        <div className="space-y-2">
          {(data.scenes || []).map((s: any, i: number) => (
            <div key={i} className="grid grid-cols-[80px_1fr_1fr] gap-2 text-sm">
              <code className="text-xs">{s.time}</code>
              <div>{s.action}</div>
              <div className="text-muted-foreground">📝 {s.text_overlay}</div>
            </div>
          ))}
        </div>
      </div>
      <p><b>📢 CTA:</b> {data.cta}</p>
      <p><b>🎵 Som:</b> {data.sound_suggestion}</p>
      {data.tiktok_tips && <p className="text-sm bg-muted p-2 rounded">💡 {data.tiktok_tips}</p>}
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
