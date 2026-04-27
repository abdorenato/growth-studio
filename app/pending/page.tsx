"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { createClient } from "@/lib/supabase/client";

export default function PendingPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email);
    });
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const handleRefresh = () => {
    // Recarrega — middleware re-verifica access_status e redireciona se aprovado
    router.refresh();
    setTimeout(() => window.location.reload(), 100);
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-2">⏳</div>
          <h1 className="text-3xl font-bold">Aguardando aprovação</h1>
          <p className="text-muted-foreground mt-2">
            Seu acesso está em análise.
          </p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4 text-sm">
            <p>
              <strong>Olá!</strong> Recebemos seu cadastro com o email:
            </p>
            <p className="font-mono text-xs bg-muted px-3 py-2 rounded">
              {email || "..."}
            </p>
            <p className="text-muted-foreground">
              Estamos numa fase fechada — cada novo usuário passa por
              aprovação manual antes de ter acesso à plataforma.
            </p>
            <p className="text-muted-foreground">
              Você vai receber acesso em breve. Se for urgente, entra em
              contato direto.
            </p>

            <div className="pt-2 space-y-2">
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="w-full"
              >
                ↻ Verificar novamente
              </Button>
              <Button
                onClick={handleSignOut}
                variant="ghost"
                className="w-full"
                disabled={signingOut}
              >
                {signingOut ? "Saindo..." : "Sair"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
