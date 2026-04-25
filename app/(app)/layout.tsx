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

  useEffect(() => {
    if (!user) router.replace("/");
  }, [user, router]);

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
