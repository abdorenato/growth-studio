"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { AuthBootstrap } from "@/components/auth-bootstrap";
import { useUserStore } from "@/hooks/use-user-store";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useUserStore((s) => s.user);

  // Middleware ja garante que so user logado+approved chega aqui.
  // AuthBootstrap hidrata o Zustand store a partir do /api/me.
  return (
    <AuthBootstrap>
      {/* Loading enquanto hidrata */}
      {!user ? (
        <div className="min-h-dvh flex items-center justify-center text-muted-foreground text-sm">
          Carregando…
        </div>
      ) : (
        // Block em mobile (sidebar = topbar acima) / flex em desktop
        <div className="min-h-screen md:flex">
          <Sidebar />
          <main className="flex-1 min-w-0 overflow-y-auto">
            <div className="container mx-auto px-4 py-8 max-w-5xl">{children}</div>
          </main>
        </div>
      )}
    </AuthBootstrap>
  );
}
