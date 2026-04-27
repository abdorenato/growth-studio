import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

// Rotas publicas (nao exigem login)
const PUBLIC_PATHS = [
  "/login",
  "/auth/callback",
  "/pending",
  "/blocked",
  "/chat", // chat publico mantem entrada por email
];

const PUBLIC_API_PREFIXES = [
  "/api/auth",
  "/api/chat", // chat publico
  "/api/health",
  "/api/config",
  "/api/waitlist", // captura de leads (publico)
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Bypass: assets, _next, favicon, robots, etc.
  if (
    path.startsWith("/_next") ||
    path.startsWith("/favicon") ||
    path === "/icon" ||
    path === "/robots.txt" ||
    path === "/sitemap.xml"
  ) {
    return NextResponse.next();
  }

  // Bypass: APIs publicas
  if (PUBLIC_API_PREFIXES.some((p) => path.startsWith(p))) {
    return NextResponse.next();
  }

  // Refresca sessao Supabase + busca profile
  const { response, user, profile } = await updateSession(request);

  const isPublicPage = PUBLIC_PATHS.some(
    (p) => path === p || path.startsWith(`${p}/`)
  );

  // === Caso 1: nao logado ===
  if (!user) {
    if (isPublicPage) return response; // pode acessar /login, /chat, etc.
    // qualquer outra rota -> redireciona pro /login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", path);
    return NextResponse.redirect(loginUrl);
  }

  // === Caso 2: logado mas SEM profile ===
  // (caso edge: auth.user existe mas public.users ainda nao foi criado.
  // Acontece no primeiro login antes do callback rodar. Deixa passar
  // pro callback finalizar o bootstrap.)
  if (!profile) {
    if (path === "/auth/callback") return response;
    // Em qualquer outra rota, manda pro callback pra completar setup
    return NextResponse.redirect(new URL("/auth/callback", request.url));
  }

  // === Caso 3: logado + profile bloqueado ===
  if (profile.access_status === "blocked") {
    if (path === "/blocked") return response;
    return NextResponse.redirect(new URL("/blocked", request.url));
  }

  // === Caso 4: logado + profile pending ===
  if (profile.access_status === "pending") {
    if (path === "/pending") return response;
    return NextResponse.redirect(new URL("/pending", request.url));
  }

  // === Caso 5: logado + approved ===
  // Se ele tenta acessar /login, /pending ou /blocked, redireciona pro dashboard
  if (path === "/login" || path === "/pending" || path === "/blocked") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // === Caso 6: rotas /admin so pra is_admin ===
  if (path.startsWith("/admin") && !profile.is_admin) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image, favicon, etc.
     * (Mantemos APIs no matcher pra elas tb passarem por updateSession,
     * mas damos bypass logico no inicio.)
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
