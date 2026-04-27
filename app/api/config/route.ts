import { NextResponse } from "next/server";

import { isRegistrationClosed } from "@/lib/admin/registration";

// GET /api/config
// Retorna config publica do sistema. Usado pelo frontend pra adaptar UI
// (ex: mostrar "cadastros fechados" antes do user submeter formulario).
//
// Cache curto (60s) na CDN — nao precisa ser real-time.
export async function GET() {
  return NextResponse.json(
    {
      registrationClosed: isRegistrationClosed(),
    },
    {
      headers: {
        // Cache na borda por 60s (s-maxage), revalida em background
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
