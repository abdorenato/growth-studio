"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { useUserStore } from "@/hooks/use-user-store";

export default function HomePage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const hasHydrated = useUserStore((s) => s.hasHydrated);
  const setUser = useUserStore((s) => s.setUser);
  const setProgress = useUserStore((s) => s.setProgress);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [atividade, setAtividade] = useState("");
  const [atividadeDescricao, setAtividadeDescricao] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Só redireciona depois da hidratação
    if (hasHydrated && user) router.replace("/dashboard");
  }, [user, hasHydrated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      toast.error("Preciso do seu nome e email pra começar.");
      return;
    }
    if (!email.includes("@")) {
      toast.error("Esse email não parece válido. Dá uma olhadinha.");
      return;
    }
    if (!atividade.trim() || !atividadeDescricao.trim()) {
      toast.error("Me conta também sua atividade e o que você resolve.");
      return;
    }

    setLoading(true);
    try {
      const ig = instagram.trim().replace(/^@/, "");
      const response = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          instagram: ig,
          atividade: atividade.trim(),
          atividade_descricao: atividadeDescricao.trim(),
        }),
      });

      if (!response.ok) throw new Error("Falha ao registrar");
      const data = await response.json();

      setUser(data.user);
      if (data.progress) setProgress(data.progress);
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error("Deu ruim no login. Tenta de novo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="text-6xl mb-2">🚀</div>
          <h1 className="text-4xl font-bold">Growth Studio</h1>
          <p className="text-muted-foreground mt-2">
            Comigo, você sai daqui com voz, posicionamento e ideias prontas.
          </p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <h2 className="text-xl font-semibold">
                👋 Oi, eu sou o <span className="text-primary">iAbdo</span>.
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                Vou te guiar pra sair daqui com:
              </p>
              <ul className="text-sm space-y-1 mt-3 text-muted-foreground">
                <li>🎙️ Sua <b>voz autêntica</b> (arquétipo + mapa de voz)</li>
                <li>📍 Um <b>posicionamento</b> claro em 1 frase</li>
                <li>🗺️ Seu <b>território</b> de conteúdo</li>
                <li>📚 Suas <b>editorias</b> (macro-temas)</li>
                <li>💡 <b>Ideias</b> prontas pra postar</li>
                <li>🔄 <b>Conteúdos</b> em múltiplos formatos</li>
              </ul>
              <p className="text-sm mt-3">Topa? Me conta quem é você:</p>
            </div>

            <Separator />

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Seu nome</Label>
                <Input
                  id="name"
                  placeholder="Ex: Renato Abdo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Seu email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="voce@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram">Seu @ do Instagram (opcional)</Label>
                <Input
                  id="instagram"
                  placeholder="@seuinsta"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  disabled={loading}
                />
              </div>

              <Separator />

              <p className="text-sm text-muted-foreground">
                Pra IA te conhecer antes de gerar qualquer coisa:
              </p>

              <div className="space-y-2">
                <Label htmlFor="atividade">O que você faz?</Label>
                <Input
                  id="atividade"
                  placeholder="Ex: Consultor de vendas B2B"
                  value={atividade}
                  onChange={(e) => setAtividade(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="atividade_descricao">
                  Em 1-2 linhas, o que você resolve pros seus clientes?
                </Label>
                <textarea
                  id="atividade_descricao"
                  rows={3}
                  placeholder="Ex: Ajudo empresas de SaaS a escalarem prospecção enterprise usando discovery em 3 camadas."
                  value={atividadeDescricao}
                  onChange={(e) => setAtividadeDescricao(e.target.value)}
                  disabled={loading}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? "Entrando..." : "🚀 Começar minha jornada"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
