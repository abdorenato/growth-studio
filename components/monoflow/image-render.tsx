"use client";

import { useState } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { Search, Sparkles, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

type UnsplashPhoto = {
  id: string;
  url: string;
  thumb: string;
  full: string;
  author: string;
  author_url: string;
  alt: string;
};

type Slide = {
  index: number;
  slide_type: string;
  headline: string;
  body?: string;
};

type Props = {
  keywords: string[];
  slides?: Slide[];
  singleHeadline?: string;
  singleBody?: string;
  kind: "carousel" | "post";
};

export function ImageRender({ keywords, slides, singleHeadline, singleBody, kind }: Props) {
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<UnsplashPhoto | null>(null);
  const [style, setStyle] = useState("dark_bold");
  const [textBox, setTextBox] = useState<"dark" | "light">("dark");

  const query = keywords.slice(0, 3).join(" ");

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error("Sem keywords pra buscar.");
      return;
    }
    setSearching(true);
    try {
      const resp = await fetch(`/api/unsplash?query=${encodeURIComponent(query)}&count=6`);
      const data = await resp.json();
      setPhotos(data.results || []);
    } catch {
      toast.error("Erro ao buscar.");
    } finally {
      setSearching(false);
    }
  };

  const renderURL = (headline: string, body: string) => {
    const params = new URLSearchParams({
      headline,
      body,
      style,
      ...(selected ? { bg: selected.url, textBox } : {}),
    });
    return `/api/render-slide?${params.toString()}`;
  };

  const downloadImage = async (url: string, filename: string) => {
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      toast.error("Erro ao baixar.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>🎨 Renderizar com imagem</Label>
      </div>

      {/* Buscar fotos */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground">
              Busca sugerida: <code className="bg-muted px-1 rounded">{query}</code>
            </div>
            <Button size="sm" variant="outline" onClick={handleSearch} disabled={searching}>
              <Search className="mr-2 h-4 w-4" />
              {searching ? "Buscando..." : "Buscar fotos"}
            </Button>
          </div>

          {photos.length > 0 && (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {photos.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => setSelected(photo)}
                  className={`relative rounded overflow-hidden border-2 transition ${
                    selected?.id === photo.id ? "border-primary" : "border-transparent"
                  }`}
                >
                  <Image
                    src={photo.thumb}
                    alt={photo.alt}
                    width={200}
                    height={250}
                    className="w-full h-32 object-cover"
                    unoptimized
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1 py-0.5">
                    📷 {photo.author}
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estilo */}
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Estilo visual</Label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm mt-1"
          >
            <option value="dark_bold">Dark Bold</option>
            <option value="light_minimal">Light Minimal</option>
            <option value="gradient_pop">Gradient Pop</option>
          </select>
        </div>
        {selected && (
          <div>
            <Label className="text-xs">Caixa de texto (sobre imagem)</Label>
            <select
              value={textBox}
              onChange={(e) => setTextBox(e.target.value as "dark" | "light")}
              className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm mt-1"
            >
              <option value="dark">Texto branco, fundo escuro</option>
              <option value="light">Texto preto, fundo claro</option>
            </select>
          </div>
        )}
      </div>

      {/* Preview */}
      {kind === "carousel" && slides && slides.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Preview dos slides</Label>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                for (const [i, s] of slides.entries()) {
                  await downloadImage(
                    renderURL(s.headline, s.body || ""),
                    `slide_${i + 1}.png`
                  );
                }
                toast.success("Todos os slides baixados!");
              }}
            >
              <Download className="mr-2 h-4 w-4" /> Baixar todos
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {slides.map((s, i) => (
              <div key={i} className="space-y-1">
                <div className="relative">
                  <Image
                    src={renderURL(s.headline, s.body || "")}
                    alt={`Slide ${i + 1}`}
                    width={300}
                    height={375}
                    className="w-full rounded border"
                    unoptimized
                  />
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full text-xs"
                  onClick={() =>
                    downloadImage(
                      renderURL(s.headline, s.body || ""),
                      `slide_${i + 1}.png`
                    )
                  }
                >
                  <Download className="mr-1 h-3 w-3" /> Slide {i + 1}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {kind === "post" && singleHeadline && (
        <div className="space-y-2">
          <Label>Preview</Label>
          <div className="max-w-sm mx-auto">
            <Image
              src={renderURL(singleHeadline, singleBody || "")}
              alt="Post"
              width={400}
              height={500}
              className="w-full rounded border"
              unoptimized
            />
            <Button
              size="sm"
              variant="outline"
              className="w-full mt-2"
              onClick={() =>
                downloadImage(renderURL(singleHeadline, singleBody || ""), "post.png")
              }
            >
              <Download className="mr-2 h-4 w-4" /> Baixar post
            </Button>
          </div>
        </div>
      )}

      {selected && (
        <p className="text-[10px] text-muted-foreground text-center">
          📷 Foto de {selected.author} via Unsplash
        </p>
      )}
    </div>
  );
}
