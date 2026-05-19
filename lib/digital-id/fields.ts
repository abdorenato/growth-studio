// Metadata ESTÁTICA dos campos do Digital ID.
//
// O Digital ID tem dois tipos de campo:
//
// - CAMPO-ESPELHO: só reflete um módulo de origem (tom, domínio, dores,
//   palavras, tagline, support_note). Sempre re-derivado quando o módulo
//   muda. "Editar" no Digital ID seria editar no lugar errado — a UI deve
//   dar deep-link pro módulo de origem (fonte única da verdade).
//
// - CAMPO-DECISÃO: a síntese fez uma escolha que não existe em nenhum
//   módulo (qual bandeira, redação da relação, redação do reflexo).
//   Persiste. Só re-decide se o usuário pedir, ou se QUALQUER módulo da
//   lista depends_on mudou. "Editar" inline faz sentido — não tem outra casa.
//
// Esta metadata NÃO é gerada pelo modelo (ele erraria). O endpoint injeta.
// A lógica de versionamento (fase de UI) consome isto.

export type FieldKind = "espelho" | "decisao";

export type ModuleKey = "voz" | "icp" | "posicionamento" | "territorio";

export type FieldMeta = {
  /** Caminho do campo no JSON do Digital ID (dot notation) */
  path: string;
  kind: FieldKind;
  /**
   * Espelho: módulo único de origem (deep-link da UI aponta pra cá).
   * Decisão: lista de módulos que, se mudarem, tornam o campo elegível
   * pra re-decisão.
   */
  depends_on: ModuleKey[];
};

// ─── CAMPOS-DECISÃO ─────────────────────────────────────────────────────────
// Apenas 3: a síntese só decide nestes pontos.
// Bandeira depende de DOIS módulos — ela é escolhida entre frase de impacto
// (Voz) e tese/âncora (Território).
export const DECISION_FIELDS: FieldMeta[] = [
  { path: "stance.flag", kind: "decisao", depends_on: ["voz", "territorio"] },
  { path: "who.relationship", kind: "decisao", depends_on: ["voz"] },
  { path: "audience.reflection", kind: "decisao", depends_on: ["icp"] },
];

// ─── CAMPOS-ESPELHO ─────────────────────────────────────────────────────────
// Refletem um módulo só. UI deve deep-linkar pra origem ao editar.
export const MIRROR_FIELDS: FieldMeta[] = [
  { path: "who.tagline", kind: "espelho", depends_on: ["posicionamento"] },
  { path: "who.archetype_primary", kind: "espelho", depends_on: ["voz"] },
  { path: "who.archetype_secondary", kind: "espelho", depends_on: ["voz"] },
  { path: "voice.tone", kind: "espelho", depends_on: ["voz"] },
  { path: "voice.words_use", kind: "espelho", depends_on: ["voz"] },
  { path: "voice.words_avoid", kind: "espelho", depends_on: ["voz"] },
  { path: "stance.domain", kind: "espelho", depends_on: ["territorio"] },
  { path: "stance.boundaries", kind: "espelho", depends_on: ["territorio"] },
  { path: "audience.icp_name", kind: "espelho", depends_on: ["icp"] },
  { path: "audience.pains", kind: "espelho", depends_on: ["icp"] },
  { path: "support_note", kind: "espelho", depends_on: ["voz"] },
];

export const ALL_FIELD_META: FieldMeta[] = [
  ...DECISION_FIELDS,
  ...MIRROR_FIELDS,
];

/** Bloco pronto pra anexar na resposta do endpoint. */
export function buildFieldMeta() {
  return {
    decision_fields: DECISION_FIELDS,
    mirror_fields: MIRROR_FIELDS,
  };
}
