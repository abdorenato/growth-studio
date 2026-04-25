import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import type { Destaque } from "@/types";

// GET /api/destaques?userId=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId obrigatorio" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("destaques")
      .select("*")
      .eq("user_id", userId)
      .order("ordem", { ascending: true });

    if (error) {
      console.error("Destaques GET error:", error);
      return NextResponse.json({ error: "Falha" }, { status: 500 });
    }

    return NextResponse.json({ destaques: data || [] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}

// POST /api/destaques
// Body: { userId, items: Destaque[] }
// Cria varios destaques de uma vez (bulk insert).
// Por padrao, NAO apaga os existentes — appenda. Se quiser substituir, use replace=true.
export async function POST(req: Request) {
  try {
    const { userId, items, replace } = (await req.json()) as {
      userId: string;
      items: Destaque[];
      replace?: boolean;
    };

    if (!userId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "userId e items[] obrigatorios" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    if (replace) {
      await supabase.from("destaques").delete().eq("user_id", userId);
    }

    const rows = items.map((d, i) => ({
      user_id: userId,
      nome: d.nome,
      descricao: d.descricao || null,
      conteudo_sugerido: d.conteudo_sugerido || null,
      capa_sugerida: d.capa_sugerida || null,
      ordem: typeof d.ordem === "number" ? d.ordem : i + 1,
    }));

    const { data, error } = await supabase
      .from("destaques")
      .insert(rows)
      .select();

    if (error) {
      console.error("Destaques POST error:", error);
      return NextResponse.json({ error: "Falha" }, { status: 500 });
    }

    return NextResponse.json({ destaques: data || [] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
