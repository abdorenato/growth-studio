"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Instagram } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import { createClient } from "@/lib/supabase/client";

const INSTAGRAM_HANDLE = "renatoabdo";

export default function LoginPage() {
  // useSearchParams precisa de Suspense boundary pra build estatico
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center text-muted-foreground">
          Carregando…
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";
  const [loading, setLoading] = useState(false);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error(err);
      toast.error("Erro ao iniciar login com Google. Tente de novo.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-2">🚀</div>
          <h1 className="text-4xl font-bold">Growth Studio</h1>
          <p className="text-muted-foreground mt-2">
            Construa sua estratégia de marca com IA.
          </p>
        </div>

        {/* Login Google (acesso por convite) */}
        <Card>
          <CardContent className="p-6 space-y-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground text-center">
              Já tem acesso?
            </p>
            <Button
              onClick={signInWithGoogle}
              disabled={loading}
              size="lg"
              variant="outline"
              className="w-full h-12 text-base font-medium"
            >
              {loading ? (
                "Redirecionando..."
              ) : (
                <>
                  <GoogleIcon />
                  <span className="ml-3">Entrar com Google</span>
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Lista de espera */}
        <div className="my-4 flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            ou
          </span>
          <Separator className="flex-1" />
        </div>

        <WaitlistCard />

        {/* Footer Instagram */}
        <a
          href={`https://instagram.com/${INSTAGRAM_HANDLE}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Instagram className="w-4 h-4" />
          <span>
            Mais informações no Instagram{" "}
            <span className="font-medium text-foreground">@{INSTAGRAM_HANDLE}</span>
          </span>
        </a>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Card da lista de espera
// ─────────────────────────────────────────────────────────────────────
function WaitlistCard() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return toast.error("Preciso do seu nome.");
    if (!email.includes("@")) return toast.error("Email inválido.");
    if (phone.replace(/\D/g, "").length < 10) {
      return toast.error("Celular inválido. Inclua DDD.");
    }

    setSubmitting(true);
    try {
      const resp = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          instagram: instagram.trim().replace(/^@/, ""),
        }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.error || "Falha");

      setSubmitted(true);
      if (data.alreadyExisted) {
        toast.info("Você já estava na lista! Atualizamos seus dados.");
      } else {
        toast.success("Você está na lista! Te avisamos em breve.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/10">
        <CardContent className="p-6 text-center space-y-3">
          <div className="text-5xl">✅</div>
          <h3 className="font-semibold text-lg">Você está na lista!</h3>
          <p className="text-sm text-muted-foreground">
            Vou te avisar por email e WhatsApp assim que liberar seu acesso.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground text-center mb-1">
            Ainda não tem acesso?
          </p>
          <h3 className="font-semibold text-center">Entre na lista de espera</h3>
          <p className="text-xs text-muted-foreground text-center mt-1">
            Estamos liberando aos poucos. Te aviso quando chegar sua vez.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="wl-name">Seu nome</Label>
            <Input
              id="wl-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Renato Abdo"
              disabled={submitting}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wl-email">Email</Label>
            <Input
              id="wl-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              disabled={submitting}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wl-phone">Celular (com DDD)</Label>
            <Input
              id="wl-phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 91234-5678"
              disabled={submitting}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wl-ig" className="text-muted-foreground">
              Instagram (opcional)
            </Label>
            <Input
              id="wl-ig"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="@seuinsta"
              disabled={submitting}
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            size="lg"
            className="w-full"
          >
            {submitting ? "Enviando..." : "Entrar na lista de espera"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
