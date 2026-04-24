"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Lock, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { OfertaFocoSelector } from "@/components/layout/oferta-foco-selector";
import { useUserStore } from "@/hooks/use-user-store";
import { buildNav } from "@/lib/nav";
import { cn, firstName } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const progress = useUserStore((s) => s.progress);
  const clear = useUserStore((s) => s.clear);

  if (!user) return null;

  const groups = buildNav(progress);

  const handleLogout = () => {
    clear();
    router.push("/");
  };

  return (
    <aside className="hidden md:flex md:flex-col md:w-72 md:border-r md:bg-background md:h-screen md:sticky md:top-0">
      <div className="p-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚀</span>
          <span className="font-semibold text-lg">Growth Studio</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">com iAbdo</p>
      </div>

      <Separator />

      <div className="p-4">
        <div className="text-sm font-medium">{firstName(user.name)}</div>
        <div className="text-xs text-muted-foreground truncate">{user.email}</div>
        {user.instagram && (
          <div className="text-xs text-muted-foreground">@{user.instagram}</div>
        )}
      </div>

      <Separator />

      <OfertaFocoSelector />

      <Separator />

      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {groups.map((group) => (
          <div key={group.title}>
            <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">
              {group.icon} {group.title}
            </div>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = pathname === item.href;
                const disabled = item.locked || item.comingSoon;
                return (
                  <li key={item.key}>
                    {disabled ? (
                      <div
                        className={cn(
                          "flex items-center justify-between px-3 py-2 rounded-md text-sm text-muted-foreground cursor-not-allowed opacity-60"
                        )}
                        title={
                          item.comingSoon
                            ? "Em breve"
                            : "Complete o passo anterior primeiro"
                        }
                      >
                        <span>
                          {item.icon} {item.title}
                        </span>
                        <Lock className="h-3 w-3" />
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center px-3 py-2 rounded-md text-sm transition-colors",
                          active
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-accent"
                        )}
                      >
                        <span>
                          {item.icon} {item.title}
                        </span>
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <Separator />

      <div className="p-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </aside>
  );
}
