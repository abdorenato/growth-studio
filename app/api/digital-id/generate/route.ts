import { NextResponse } from "next/server";

import { callClaude, parseJSON } from "@/lib/claude";
import { fetchStrategyContext } from "@/lib/db/strategy-context";
import { listICPs } from "@/lib/db/icp";
import { digitalIdPrompt, type Archetypes } from "@/lib/prompts/digital-id";
import { buildFieldMeta } from "@/lib/digital-id/fields";
import { createClient } from "@/lib/supabase/server";
import type { ArchetypeKey } from "@/types";

// /api/digital-id/generate
//
// Passo de SÍNTESE — consolida Voz + ICP + Posicionamento + Território
// num Digital ID. Sem UI ainda: usado pra validar a saida do prompt em
// chamada crua antes de investir na interface.
//
//   POST  Body: { userId, icpId }  → uso programatico
//   GET   (sem body)               → atalho de teste: pega o user logado
//         pelo cookie e o ICP mais recente dele automaticamente. Permite
//         abrir a URL direto no browser. Remover quando a UI existir.
//
// Retorna { digitalId, field_meta } — field_meta classifica cada campo
// como espelho/decisão (metadata estatica injetada pelo codigo, nao pela IA).

type GenResult =
  | { ok: true; payload: Record<string, unknown> }
  | { ok: false; status: number; error: string };

async function generateDigitalId(
  userId: string,
  icpId: string
): Promise<GenResult> {
  // 1. Contexto estratégico (Voz/ICP/Posicionamento/Território)
  const ctx = await fetchStrategyContext(userId, icpId);
  if (!ctx) {
    return { ok: false, status: 404, error: "ICP não encontrado" };
  }

  // 2. Valida que a fundação está completa — Digital ID é síntese dos 4
  // módulos; sem qualquer um deles não há o que sintetizar.
  const faltando: string[] = [];
  if (!ctx.mapaVoz) faltando.push("Voz da Marca");
  if (!ctx.posicionamento?.frase) faltando.push("Posicionamento");
  if (!ctx.territorio?.dominio && !ctx.territorio?.tese) {
    faltando.push("Território");
  }
  if (faltando.length > 0) {
    return {
      ok: false,
      status: 422,
      error: `Fundação incompleta. Complete antes: ${faltando.join(", ")}.`,
    };
  }

  // 3. Arquétipos — fetchStrategyContext só traz mapa_voz, não os
  // arquétipos. Query extra na tabela vozes.
  const supabase = await createClient();
  const { data: vozRow } = await supabase
    .from("vozes")
    .select("arquetipo_primario, arquetipo_secundario")
    .eq("user_id", userId)
    .maybeSingle<{
      arquetipo_primario: ArchetypeKey;
      arquetipo_secundario: ArchetypeKey;
    }>();

  if (!vozRow?.arquetipo_primario) {
    return {
      ok: false,
      status: 422,
      error: "Arquétipos não encontrados no módulo de Voz.",
    };
  }

  const arquetipos: Archetypes = {
    primario: vozRow.arquetipo_primario,
    secundario: vozRow.arquetipo_secundario,
  };

  // 4. Monta prompt e chama Claude
  const prompt = digitalIdPrompt(ctx, arquetipos);
  const text = await callClaude(prompt.system, prompt.user, 2500, {
    endpoint: "/api/digital-id/generate",
    userId,
  });

  const digitalId = parseJSON(text) as Record<string, unknown>;

  // 5. Injeta metadata estática de campos (espelho/decisão + depends_on).
  // NÃO vem da IA — ela erraria. É estrutura fixa do sistema.
  return {
    ok: true,
    payload: { digitalId, field_meta: buildFieldMeta() },
  };
}

// POST — uso programático: { userId, icpId } no body
export async function POST(req: Request) {
  try {
    const { userId, icpId } = await req.json();
    if (!userId || !icpId) {
      return NextResponse.json(
        { error: "userId e icpId obrigatórios" },
        { status: 400 }
      );
    }
    const result = await generateDigitalId(userId, icpId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result.payload);
  } catch (err) {
    console.error("Digital ID generate (POST) error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 }
    );
  }
}

// GET — atalho de teste. Pega o user logado pelo cookie e o ICP mais
// recente dele. Permite abrir a URL no browser sem precisar montar POST.
// TEMPORÁRIO — remover quando a UI do Digital ID existir.
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json(
        { error: "Não autenticado. Faça login primeiro." },
        { status: 401 }
      );
    }

    // public.users.id correspondente
    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", authUser.id)
      .maybeSingle<{ id: string }>();

    if (!profile) {
      return NextResponse.json(
        { error: "Perfil não encontrado." },
        { status: 404 }
      );
    }

    // ICP mais recente do user
    const icps = await listICPs(profile.id);
    if (icps.length === 0) {
      return NextResponse.json(
        { error: "Nenhum ICP cadastrado. Crie um ICP primeiro." },
        { status: 422 }
      );
    }

    const result = await generateDigitalId(profile.id, String(icps[0].id));
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({
      _teste: {
        userId: profile.id,
        icpId: icps[0].id,
        icpName: icps[0].name,
      },
      ...result.payload,
    });
  } catch (err) {
    console.error("Digital ID generate (GET) error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 }
    );
  }
}
