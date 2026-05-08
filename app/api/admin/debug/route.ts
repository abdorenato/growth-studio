import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/admin";

// GET /api/admin/debug
//
// Endpoint TEMPORARIO de diagnostico — retorna se SUPABASE_SERVICE_ROLE_KEY
// esta configurada no ambiente atual e tenta uma query trivial pra ver se
// ela funciona. Auth via cookie admin (so admin pode chamar).
//
// Pode remover assim que o setup estiver redondo.

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const result: Record<string, unknown> = {
    has_supabase_url: Boolean(url),
    has_anon_key: Boolean(anonKey),
    anon_key_prefix: anonKey ? anonKey.slice(0, 12) + "..." : null,
    has_service_role_key: Boolean(serviceKey),
    service_role_key_prefix: serviceKey ? serviceKey.slice(0, 12) + "..." : null,
  };

  // Tenta usar o service client em uma query trivial
  if (serviceKey) {
    try {
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from("users")
        .select("id")
        .limit(1);

      if (error) {
        result.service_client_test = "FAILED";
        result.service_client_error = {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        };
      } else {
        result.service_client_test = "OK";
        result.service_client_rows_returned = (data || []).length;
      }
    } catch (err) {
      result.service_client_test = "EXCEPTION";
      result.service_client_exception =
        err instanceof Error ? err.message : String(err);
    }
  } else {
    result.service_client_test = "SKIPPED (no service key)";
  }

  return NextResponse.json(result);
}
