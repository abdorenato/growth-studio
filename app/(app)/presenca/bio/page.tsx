"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sparkles, RefreshCw, Save, Copy, Instagram, Music, Linkedin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { useUserStore } from "@/hooks/use-user-store";
import type { Bio, BioPlatform } from "@/types";

type ICPRow = { id: string; name: string; niche: string };

const PLATFORMS: {
  key: BioPlatform;
  label: string;
  icon: React.ReactNode;
  charLimit: number;
  hint: string;
}[] = [
  {
    key: "instagram",
    label: "Instagram",
    icon: <Instagram className="h-4 w-4" />,
    charLimit: 150,
    hint: "150 caracteres. Quebras de linha permitidas. 1 link na bio (não cole URL aqui).",
  },
  {
    key: "tiktok",
    label: "TikTok",
    icon: <Music className="h-4 w-4" />,
    charLimit: 80,
    hint: "80 caracteres. Sem links no body. Foco em uma frase forte.",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: <Linkedin className="h-4 w-4" />,
    charLimit: 220,
    hint: "220 caracteres pra headline. Tom profissional mas humano. Foque em resultado + pra quem.",
  },
];

export default function BioPage() {
  const user = useUserStore((s) => s.user)!;
  const updateProgress = useUserStore((s) => s.updateProgress);

  const [icps, setIcps] = useState<ICPRow[]>([]);
  const [selectedICP, setSelectedICP] = useState("");
  const [bios, setBios] = useState<Record<BioPlatform, string>>({
    instagram: "",
    tiktok: "",
    linkedin: "",
  });
  const [loadingByPlat, setLoadingByPlat] = useState<Record<BioPlatform, boolean>>({
    instagram: false,
    tiktok: false,
    linkedin: false,
  });
  const [savingByPlat, setSavingByPlat] = useState<Record<BioPlatform, boolean>>({
    instagram: false,
    tiktok: false,
    linkedin: false,
  });

  // Carrega ICPs + bios existentes
  useEffect(() => {
    (async () => {
      try {
        const [icpResp, bioResp] = await Promise.all([
          fetch(`/api/icp?userId=${user.id}`),
          fetch(`/api/bio?userId=${user.id}`),
        ]);
        const icpData = await icpResp.json();
        const bioData = await bioResp.json();

        const icpList: ICPRow[] = icpData.icps || [];
        setIcps(icpList);
        if (icpList[0]) setSelectedICP(icpList[0].id);

        const map: Record<BioPlatform, string> = {
          instagram: "",
          tiktok: "",
          linkedin: "",
        };
        (bioData.bios || []).forEach((b: Bio) => {
          map[b.platform] = b.bio_text;
        });
        setBios(map);
      } catch {
        // silencia
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const handleGenerate = async (platform: BioPlatform) => {
    if (!selectedICP) return toast.error("Selecione um ICP.");
    setLoadingByPlat((s) => ({ ...s, [platform]: true }));
    try {
      const resp = await fetch("/api/bio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, icpId: selectedICP, platform }),
      });
      if (!resp.ok) throw new Error();
      const data = await resp.json();
      setBios((prev) => ({ ...prev, [platform]: data.text || "" }));
      toast.success(`Bio de ${platform} gerada!`);
    } catch {
      toast.error("Erro ao gerar bio.");
    } finally {
      setLoadingByPlat((s) => ({ ...s, [platform]: false }));
    }
  };

  const handleSave = async (platform: BioPlatform) => {
    if (!bios[platform].trim()) return toast.error("Bio vazia.");
    setSavingByPlat((s) => ({ ...s, [platform]: true }));
    try {
      const resp = await fetch("/api/bio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          platform,
          bio_text: bios[platform],
        }),
      });
      if (!resp.ok) throw new Error();
      updateProgress("bio", true);
      toast.success("Bio salva!");
    } catch {
      toast.error("Erro ao salvar.");
    } finally {
      setSavingByPlat((s) => ({ ...s, [platform]: false }));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  if (icps.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">🪪 Bio</h1>
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">🪪 Bio</h1>
        <p className="text-muted-foreground mt-1">
          Bio gerada a partir do seu posicionamento + território + voz, respeitando
          os limites e convenções de cada plataforma.
        </p>
      </div>

      <Separator />

      <Card>
        <CardContent className="p-4">
          <Label className="mb-2 block">ICP</Label>
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
        </CardContent>
      </Card>

      {PLATFORMS.map((p) => (
        <BioCard
          key={p.key}
          platform={p.key}
          label={p.label}
          icon={p.icon}
          charLimit={p.charLimit}
          hint={p.hint}
          text={bios[p.key]}
          onChange={(v) => setBios((prev) => ({ ...prev, [p.key]: v }))}
          onGenerate={() => handleGenerate(p.key)}
          onSave={() => handleSave(p.key)}
          onCopy={() => copyToClipboard(bios[p.key])}
          generating={loadingByPlat[p.key]}
          saving={savingByPlat[p.key]}
        />
      ))}
    </div>
  );
}

function BioCard({
  label,
  icon,
  charLimit,
  hint,
  text,
  onChange,
  onGenerate,
  onSave,
  onCopy,
  generating,
  saving,
}: {
  platform: BioPlatform;
  label: string;
  icon: React.ReactNode;
  charLimit: number;
  hint: string;
  text: string;
  onChange: (v: string) => void;
  onGenerate: () => void;
  onSave: () => void;
  onCopy: () => void;
  generating: boolean;
  saving: boolean;
}) {
  const charCount = text.length;
  const overLimit = charCount > charLimit;
  const nearLimit = !overLimit && charCount > charLimit * 0.9;

  return (
    <Card>
      <CardContent className="p-6 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-2 min-w-0">
            <div className="mt-0.5 text-primary">{icon}</div>
            <div className="min-w-0">
              <h3 className="font-semibold">{label}</h3>
              <p className="text-xs text-muted-foreground">{hint}</p>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={onGenerate}
              disabled={generating || saving}
            >
              {text ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {generating ? "Regerando..." : "Regerar"}
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {generating ? "Gerando..." : "Gerar com IA"}
                </>
              )}
            </Button>
            {text && (
              <>
                <Button size="sm" variant="ghost" onClick={onCopy}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={onSave} disabled={saving || generating}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
              </>
            )}
          </div>
        </div>

        {text && (
          <>
            <Textarea
              value={text}
              onChange={(e) => onChange(e.target.value)}
              rows={4}
              className="text-sm leading-relaxed font-mono"
            />
            <div
              className={
                "text-xs text-right " +
                (overLimit
                  ? "text-red-600 font-semibold"
                  : nearLimit
                  ? "text-amber-600"
                  : "text-muted-foreground")
              }
            >
              {charCount} / {charLimit} caracteres
              {overLimit && " — passou do limite!"}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
