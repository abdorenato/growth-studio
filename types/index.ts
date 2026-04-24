export type User = {
  id: string;
  email: string;
  name: string;
  instagram?: string;
  atividade?: string;
  atividade_descricao?: string;
  oferta_em_foco_id?: string | null;
  created_at?: string;
};

export type ArchetypeKey = "especialista" | "protetor" | "proximo" | "desbravador";

export type Archetype = {
  name: string;
  subtitle: string;
  description: string;
  energy: string;
};

export type MapaVoz = {
  energia_arquetipica: string;
  tom_de_voz: string;
  frase_essencia: string;
  frase_impacto: string;
  palavras_usar: string[];
  palavras_evitar: string[];
};

export type Voz = {
  user_id: string;
  arquetipo_primario: ArchetypeKey;
  arquetipo_secundario: ArchetypeKey;
  justificativa: string;
  mapa_voz: MapaVoz;
  respostas: Record<string, string>;
};

export type Progress = {
  voz: boolean;
  posicionamento: boolean;
  territorio: boolean;
  editorias: boolean;
  ideias: boolean;
  conteudos: boolean;
  icp: boolean;
  oferta: boolean;
  pitch: boolean;
};

export type ICP = {
  id?: number | string;
  user_id?: string;
  name: string;
  niche: string;
  demographics: {
    age_range: string;
    gender: string;
    location: string;
  };
  pain_points: string[];
  desires: string[];
  objections: string[];
  language_style: string;
  tone_keywords: string[];
};

export type Offer = {
  id?: number | string;
  user_id?: string;
  icp_id: number | string;
  name: string;
  dream: string;
  success_proofs: string[];
  time_to_result: string;
  effort_level: string;
  core_promise: string;
  bonuses: string[];
  scarcity: string;
  guarantee: string;
  method_name: string;
  summary: string;
};

export type SlideContent = {
  index: number;
  slide_type: "hook" | "content" | "listicle" | "quote" | "cta";
  headline: string;
  body: string;
  image_path?: string;
};

export type IdeaData = {
  topic: string;
  hook: string;
  angle: string;
  target_emotion: string;
  carousel_style: string;
};
