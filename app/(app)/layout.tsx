"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Sidebar } from "@/components/layout/sidebar";
import { useUserStore } from "@/hooks/use-user-store";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const hasHydrated = useUserStore((s) => s.hasHydrated);

  useEffect(() => {
    // Só redireciona pra login se a hidratação já terminou e user é null
    if (hasHydrated && !user) router.replace("/");
  }, [user, hasHydrated, router]);

  // Enquanto hidrata, não renderiza nada nem redireciona (evita race condition)
  if (!hasHydrated) return null;
  if (!user) return null;

  return (
    // Block em mobile (sidebar = topbar acima) / flex em desktop (sidebar à esquerda)
    <div className="min-h-screen md:flex">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="container mx-auto px-4 py-8 max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
