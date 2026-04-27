import { NextResponse } from "next/server";

import { getFullProgress, getUserByEmail } from "@/lib/db/users";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Email válido obrigatório" },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(email.trim().toLowerCase());
    if (!user) {
      return NextResponse.json(
        { error: "Email não encontrado. Faça seu primeiro cadastro." },
        { status: 404 }
      );
    }

    // Bloqueio provisorio: se blocked_at esta setado, nega login
    if (user.blocked_at) {
      return NextResponse.json(
        {
          error: "Sua conta está temporariamente bloqueada. Entre em contato.",
          code: "USER_BLOCKED",
        },
        { status: 403 }
      );
    }

    let progress = {};
    try {
      progress = await getFullProgress(user.id);
    } catch (e) {
      console.warn("Could not fetch progress", e);
    }

    return NextResponse.json({ user, progress });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
