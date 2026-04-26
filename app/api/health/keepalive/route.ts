import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

// GET /api/health/keepalive
//
// Endpoint usado por cron externo (GitHub Actions) pra evitar que o Supabase
// pause o database depois de 7 dias sem atividade no plano free.
// Faz um SELECT trivial — toca o banco, sem mexer em nada.

export async function GET() {
  try {
    const supabase = await createClient();

    // SELECT mais barato possivel — 1 registro de uma tabela qualquer
    const { error } = await supabase.from("users").select("id").limit(1);

    if (error) {
      console.error("Keepalive falhou:", error);
      return NextResponse.json(
        { ok: false, error: error.message, ts: Date.now() },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      ts: Date.now(),
      message: "Database vivo.",
    });
  } catch (err) {
    console.error("Keepalive erro:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Erro",
        ts: Date.now(),
      },
      { status: 500 }
    );
  }
}
