import { createClient } from "@/lib/supabase/server";
import type { Voz } from "@/types";

export async function getVoz(userId: string): Promise<Voz | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vozes")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return data as Voz | null;
}

export async function saveVoz(userId: string, voz: Omit<Voz, "user_id">): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase.from("vozes").upsert(
    {
      user_id: userId,
      arquetipo_primario: voz.arquetipo_primario,
      arquetipo_secundario: voz.arquetipo_secundario,
      justificativa: voz.justificativa,
      mapa_voz: voz.mapa_voz,
      respostas: voz.respostas,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (error) {
    console.error("saveVoz error:", error);
    return false;
  }
  return true;
}
