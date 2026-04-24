import { createClient } from "@/lib/supabase/server";
import { getICP } from "@/lib/db/icp";
import { getUserById } from "@/lib/db/users";
import type { ICP, MapaVoz, User } from "@/types";

export type Posicionamento = {
  frase?: string;
  resultado?: string;
  mecanismo_nome?: string;
  mecanismo_descricao?: string;
  diferencial_frase?: string;
} | null;

export type Territorio = {
  nome?: string;
  lente?: string;
  manifesto?: string;
  fronteiras?: string[];
} | null;

export type Editoria = {
  id: string;
  nome: string;
  tipo_objetivo?: string;
  objetivo?: string;
  descricao?: string;
} | null;

export type Oferta = {
  id: string;
  name?: string;
  core_promise?: string;
  method_name?: string;
  dream?: string;
  bonuses?: string[];
  scarcity?: string;
  guarantee?: string;
} | null;

export type StrategyContext = {
  creator: Partial<User> | null;
  icp: ICP;
  mapaVoz: MapaVoz | null;
  posicionamento: Posicionamento;
  territorio: Territorio;
  editoria: Editoria;
  oferta: Oferta;
};

/**
 * Busca o contexto estratégico completo do usuário em paralelo.
 */
export async function fetchStrategyContext(
  userId: string,
  icpId: string,
  options: { editoriaId?: string | null; atrelarOferta?: boolean } = {}
): Promise<StrategyContext | null> {
  const [icp, creator] = await Promise.all([getICP(icpId), getUserById(userId)]);
  if (!icp) return null;

  const supabase = await createClient();

  const vozPromise = supabase
    .from("vozes")
    .select("mapa_voz")
    .eq("user_id", userId)
    .maybeSingle();

  const posPromise = supabase
    .from("posicionamentos")
    .select(
      "frase, resultado, mecanismo_nome, mecanismo_descricao, diferencial_frase"
    )
    .eq("user_id", userId)
    .maybeSingle();

  const terPromise = supabase
    .from("territorios")
    .select("nome, lente, manifesto, fronteiras")
    .eq("user_id", userId)
    .maybeSingle();

  const edPromise = options.editoriaId
    ? supabase
        .from("editorias")
        .select("id, nome, tipo_objetivo, objetivo, descricao")
        .eq("id", options.editoriaId)
        .maybeSingle()
    : Promise.resolve({ data: null });

  const ofPromise =
    options.atrelarOferta && creator?.oferta_em_foco_id
      ? supabase
          .from("ofertas")
          .select(
            "id, name, core_promise, method_name, dream, bonuses, scarcity, guarantee"
          )
          .eq("id", creator.oferta_em_foco_id)
          .maybeSingle()
      : Promise.resolve({ data: null });

  const [vozResp, posResp, terResp, edResp, ofResp] = await Promise.all([
    vozPromise,
    posPromise,
    terPromise,
    edPromise,
    ofPromise,
  ]);

  return {
    creator,
    icp,
    mapaVoz: (vozResp.data as { mapa_voz?: MapaVoz } | null)?.mapa_voz || null,
    posicionamento: (posResp.data as Posicionamento) || null,
    territorio: (terResp.data as Territorio) || null,
    editoria: (edResp.data as Editoria) || null,
    oferta: (ofResp.data as Oferta) || null,
  };
}
