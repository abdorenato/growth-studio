import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

// POST /api/waitlist
// Body: { name, email, phone, instagram? }
// Captura lead na lista de espera (origem='waitlist'). Endpoint publico.
//
// Comportamento:
//   - Email novo -> insere com access_status='pending', origem='waitlist'
//   - Email ja existe -> ATUALIZA campos vazios (preserva dados existentes)
//     e retorna sucesso (UX = "voce ja esta na lista")
//   - Nao toca em access_status se ja existir (preserva approved/blocked)

const BodySchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(8, "Celular inválido"),
  instagram: z.string().optional().default(""),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const { name, email: rawEmail, phone, instagram: rawIg } = parsed.data;
    const email = rawEmail.toLowerCase().trim();
    const ig = rawIg.trim().replace(/^@/, "");
    const phoneNorm = phone.trim().replace(/\D/g, ""); // so digitos

    if (phoneNorm.length < 8) {
      return NextResponse.json(
        { error: "Celular inválido" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verifica se ja existe
    const { data: existing } = await supabase
      .from("users")
      .select("id, name, phone, instagram")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      // Enriquece campos vazios — nao sobrescreve nem muda access_status
      const patch: Record<string, string> = {};
      if (!existing.name && name.trim()) patch.name = name.trim();
      if (!existing.phone && phoneNorm) patch.phone = phoneNorm;
      if (!existing.instagram && ig) patch.instagram = ig;

      if (Object.keys(patch).length > 0) {
        await supabase.from("users").update(patch).eq("id", existing.id);
      }
      return NextResponse.json({ ok: true, alreadyExisted: true });
    }

    // Cria novo lead
    const { error } = await supabase.from("users").insert({
      email,
      name: name.trim(),
      phone: phoneNorm,
      instagram: ig || null,
      access_status: "pending",
      origem: "waitlist",
    });

    if (error) {
      console.error("Waitlist insert error:", error);
      return NextResponse.json({ error: "Falha" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, alreadyExisted: false });
  } catch (err) {
    console.error("Waitlist error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 }
    );
  }
}
