"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { createClient } from "@/lib/supabase/client";

export default function BlockedPage() {
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

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-2">🚫</div>
          <h1 className="text-3xl font-bold">Acesso não autorizado</h1>
        </div>

        <Card className="border-red-500/40">
          <CardContent className="p-6 space-y-4 text-sm">
            <p>
              A conta <span className="font-mono text-xs">{email || "..."}</span>{" "}
              está bloqueada e não tem acesso à plataforma.
            </p>
            <p className="text-muted-foreground">
              Se você acha que isso é um engano, entre em contato.
            </p>
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="w-full"
              disabled={signingOut}
            >
              {signingOut ? "Saindo..." : "Sair"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
