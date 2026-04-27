"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useUserStore } from "@/hooks/use-user-store";
import { createClient } from "@/lib/supabase/client";

/**
 * Hidrata o Zustand store com o profile do user logado (via Supabase Auth).
 * Tambem escuta mudanças de auth state — se logout em outra aba, sincroniza.
 *
 * Renderizado dentro do app/(app)/layout.tsx, ou seja, so roda em rotas
 * autenticadas (depois do middleware aprovar).
 */
export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const setUser = useUserStore((s) => s.setUser);
  const setProgress = useUserStore((s) => s.setProgress);
  const clear = useUserStore((s) => s.clear);

  useEffect(() => {
    let cancelled = false;

    // Carrega profile inicial do /api/me
    fetch("/api/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        if (cancelled) return;
        if (data.user) setUser(data.user);
        if (data.progress) setProgress(data.progress);
      })
      .catch((status) => {
        if (status === 401) {
          // Nao logado — middleware vai redirecionar, mas garante limpeza
          clear();
          router.replace("/login");
        }
      });

    // Escuta mudanças de auth (logout em outra aba, refresh de token, etc.)
    const supabase = createClient();
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "SIGNED_OUT") {
          clear();
          router.replace("/login");
        }
      }
    );

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
