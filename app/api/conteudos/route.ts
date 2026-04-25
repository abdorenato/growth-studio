import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

// GET — lista conteúdos do usuário, opcionalmente filtrados por ideia
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const ideiaId = searchParams.get("ideiaId");

  if (!userId) return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });

  const supabase = await createClient();
  let query = supabase
    .from("conteudos")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (ideiaId) query = query.eq("ideia_id", ideiaId);

  const { data, error } = await query;
  if (error) {
    console.error("Conteudos list error:", error);
    return NextResponse.json({ error: "Falha" }, { status: 500 });
  }

  return NextResponse.json({ conteudos: data || [] });
}

// POST — salva múltiplos conteúdos de uma vez (após gerar tudo)
export async function POST(req: Request) {
  try {
    const { userId, ideiaId, items } = await req.json();
    if (!userId || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "userId e items (array) obrigatórios" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const rows = items
      .filter((i: { platform?: string }) => i.platform)
      .map((i: { platform: string; data: unknown }) => ({
        user_id: userId,
        ideia_id: ideiaId || null,
        platform: i.platform,
        data: i.data,
      }));

    if (rows.length === 0) {
      return NextResponse.json({ items: [] });
    }

    const { data, error } = await supabase.from("conteudos").insert(rows).select();
    if (error) {
      console.error("Conteudos insert error:", error);
      return NextResponse.json({ error: "Falha" }, { status: 500 });
    }

    return NextResponse.json({ items: data || [] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
