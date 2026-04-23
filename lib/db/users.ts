import { createClient } from "@/lib/supabase/server";
import type { Progress, User } from "@/types";

export async function getUserByEmail(email: string): Promise<User | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase())
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as User;
}

export async function registerLead(
  name: string,
  email: string,
  instagram: string
): Promise<User | null> {
  const supabase = await createClient();
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await getUserByEmail(normalizedEmail);
  if (existing) {
    const { data } = await supabase
      .from("users")
      .update({
        name,
        instagram,
        ultima_atividade: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();
    return (data as User) || existing;
  }

  const { data, error } = await supabase
    .from("users")
    .insert({
      email: normalizedEmail,
      name,
      instagram,
    })
    .select()
    .single();

  if (error) throw error;
  return data as User;
}

export async function getFullProgress(userId: string): Promise<Progress> {
  const supabase = await createClient();

  const [voz, pos, ter, eds, ids, cts, icps, ofs] = await Promise.all([
    supabase.from("vozes").select("user_id").eq("user_id", userId).maybeSingle(),
    supabase
      .from("posicionamentos")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("territorios")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("editorias").select("id").eq("user_id", userId).limit(1),
    supabase.from("ideias").select("id").eq("user_id", userId).limit(1),
    supabase.from("conteudos").select("id").eq("user_id", userId).limit(1),
    supabase.from("icps").select("id").eq("user_id", userId).limit(1),
    supabase.from("ofertas").select("id").eq("user_id", userId).limit(1),
  ]);

  return {
    voz: !!voz.data,
    posicionamento: !!pos.data,
    territorio: !!ter.data,
    editorias: (eds.data?.length ?? 0) > 0,
    ideias: (ids.data?.length ?? 0) > 0,
    conteudos: (cts.data?.length ?? 0) > 0,
    icp: (icps.data?.length ?? 0) > 0,
    oferta: (ofs.data?.length ?? 0) > 0,
    pitch: false,
  };
}
