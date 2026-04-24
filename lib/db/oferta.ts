import { createClient } from "@/lib/supabase/server";
import type { Offer } from "@/types";

type OfferRow = Offer & { id: string; user_id: string };

export async function listOfertas(userId: string): Promise<OfferRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ofertas")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data as OfferRow[]) || [];
}

export async function listOfertasByICP(icpId: string): Promise<OfferRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ofertas")
    .select("*")
    .eq("icp_id", icpId)
    .order("created_at", { ascending: false });
  return (data as OfferRow[]) || [];
}

export async function createOferta(
  userId: string,
  oferta: Omit<Offer, "id">
): Promise<OfferRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ofertas")
    .insert({ ...oferta, user_id: userId })
    .select()
    .single();
  if (error) {
    console.error("createOferta error:", error);
    return null;
  }
  return data as OfferRow;
}
