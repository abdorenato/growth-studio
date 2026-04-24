import { createClient } from "@/lib/supabase/server";
import type { ICP } from "@/types";

type ICPRow = Omit<ICP, "id"> & { id: string; user_id: string };

export async function listICPs(userId: string): Promise<ICPRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("icps")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data as ICPRow[]) || [];
}

export async function getICP(id: string): Promise<ICPRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("icps")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data as ICPRow | null;
}

export async function createICP(
  userId: string,
  icp: Omit<ICP, "id">
): Promise<ICPRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("icps")
    .insert({ ...icp, user_id: userId })
    .select()
    .single();
  if (error) {
    console.error("createICP error:", error);
    return null;
  }
  return data as ICPRow;
}

export async function updateICP(
  id: string,
  icp: Partial<ICP>
): Promise<ICPRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("icps")
    .update({ ...icp, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return null;
  return data as ICPRow;
}

export async function deleteICP(id: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase.from("icps").delete().eq("id", id);
  return !error;
}
