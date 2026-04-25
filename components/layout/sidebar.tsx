"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Lock, LogOut, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { OfertaFocoSelector } from "@/components/layout/oferta-foco-selector";
import { PerfilCard } from "@/components/layout/perfil-card";
import { useUserStore } from "@/hooks/use-user-store";
import { buildNav, type NavGroup } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const user = useUserStore((s) => s.user);

  if (!user) return null;

  return (
    <>
      {/* Desktop sidebar — scroll na sidebar inteira (não em seções) */}
      <aside className="hidden md:flex md:flex-col md:w-72 md:h-screen md:sticky md:top-0 md:bg-card md:border-r md:overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* Mobile: trigger no topo + Sheet */}
      <div className="md:hidden sticky top-0 z-40 flex items-center gap-2 px-4 py-3 bg-card border-b">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80 overflow-y-auto">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <SidebarContent />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <span className="text-xl">🚀</span>
          <span className="font-semibold">Growth Studio</span>
        </div>
      </div>
    </>
  );
}

function SidebarContent() {
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
    <div className="flex flex-col">
      {/* Header com brand */}
      <div className="px-5 py-5 border-b">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚀</span>
          <div>
            <div className="font-semibold text-base leading-tight">
              Growth Studio
            </div>
            <p className="text-[11px] text-muted-foreground leading-tight">
              com iAbdo
            </p>
          </div>
        </div>
      </div>

      {/* Navegação com grupos colapsáveis */}
      <nav className="px-3 py-4 space-y-2">
        {groups.map((group) => (
          <NavGroupItem key={group.title} group={group} pathname={pathname} progress={progress} />
        ))}
      </nav>

      {/* Card integrado: perfil + oferta + sair (no rodapé) */}
      <div className="px-3 py-3 border-t bg-muted/30 mt-auto">
        <div className="rounded-lg bg-background border shadow-sm overflow-hidden">
          <PerfilCard />
          <div className="border-t">
            <OfertaFocoSelector />
          </div>
          <div className="border-t px-3 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground hover:text-foreground h-8 text-xs"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-3 w-3" />
              Sair
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Grupo de navegação colapsável ─────────────────────────────────────────

function NavGroupItem({
  group,
  pathname,
  progress,
}: {
  group: NavGroup;
  pathname: string;
  progress: Record<string, boolean | undefined>;
}) {
  // "Início" não tem header — renderiza só o(s) item(s) direto
  const isInicio = group.title === "Início";

  // Decide o estado inicial:
  // - Se a página atual está dentro deste grupo → abre
  // - Senão, heurística: estratégia completa → Conteúdo aberto; senão Estratégia aberto
  const containsActive = group.items.some((i) => pathname === i.href);

  const allEstrategiaDone = Boolean(
    progress.voz && progress.icp && progress.posicionamento && progress.territorio
  );

  const initialOpen = useMemo(() => {
    if (isInicio) return true;
    if (containsActive) return true;
    if (group.title === "Conteúdo" && allEstrategiaDone) return true;
    if (group.title === "Estratégia" && !allEstrategiaDone) return true;
    return false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const [open, setOpen] = useState(initialOpen);

  useEffect(() => {
    if (containsActive) setOpen(true);
  }, [containsActive]);

  return (
    <div>
      {/* Início: sem header — renderiza items direto */}
      {!isInicio && (
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center justify-between w-full px-3 py-2 rounded-md text-xs font-bold uppercase text-foreground tracking-wider bg-muted hover:bg-muted-foreground/15 transition-colors"
        >
          <span>{group.title}</span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform",
              open ? "rotate-0" : "-rotate-90"
            )}
          />
        </button>
      )}

      {open && (
        <ul className="space-y-0.5 mt-1">
          {group.items.map((item) => {
            const active = pathname === item.href;
            const disabled = item.locked || item.comingSoon;
            return (
              <li key={item.key}>
                {disabled ? (
                  <div
                    className={cn(
                      "flex items-center justify-between px-3 py-1.5 rounded-md text-sm text-muted-foreground/60 cursor-not-allowed"
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
                      "flex items-center px-3 py-1.5 rounded-md text-sm transition-colors",
                      active
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-foreground/80 hover:bg-accent hover:text-foreground"
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
      )}
    </div>
  );
}
