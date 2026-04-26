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

export async function getUserById(id: string): Promise<User | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as User) || null;
}

export async function registerLead(
  name: string,
  email: string,
  instagram: string,
  atividade = "",
  atividadeDescricao = ""
): Promise<User | null> {
  const supabase = await createClient();
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await getUserByEmail(normalizedEmail);
  if (existing) {
    const patch: Record<string, unknown> = {
      name,
      instagram,
      ultima_atividade: new Date().toISOString(),
    };
    // Só sobrescreve se o novo valor veio preenchido (não apaga dado anterior)
    if (atividade.trim()) patch.atividade = atividade;
    if (atividadeDescricao.trim()) patch.atividade_descricao = atividadeDescricao;

    const { data } = await supabase
      .from("users")
      .update(patch)
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
      atividade: atividade || null,
      atividade_descricao: atividadeDescricao || null,
      origem: "platform",
    })
    .select()
    .single();

  if (error) throw error;
  return data as User;
}

export async function getFullProgress(userId: string): Promise<Progress> {
  const supabase = await createClient();

  const [voz, pos, ter, eds, ids, cts, icps, ofs, bios, dest] = await Promise.all([
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
    supabase.from("bios").select("id").eq("user_id", userId).limit(1),
    supabase.from("destaques").select("id").eq("user_id", userId).limit(1),
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
    bio: (bios.data?.length ?? 0) > 0,
    destaques: (dest.data?.length ?? 0) > 0,
  };
}
