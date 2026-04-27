"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
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
          // Pede consent toda vez = sempre traz email atualizado + permite trocar conta
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });
      if (error) throw error;
      // Redireciona pro Google — o user vai sair daqui automaticamente
    } catch (err) {
      console.error(err);
      toast.error("Erro ao iniciar login com Google. Tente de novo.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-2">🚀</div>
          <h1 className="text-4xl font-bold">Growth Studio</h1>
          <p className="text-muted-foreground mt-2">
            Entre pra construir sua estratégia de marca com IA.
          </p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
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

            <p className="text-xs text-center text-muted-foreground pt-2">
              Acesso por convite. Após login, sua conta passa por aprovação
              manual antes de liberar o uso.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
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
