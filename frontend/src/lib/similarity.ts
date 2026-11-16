export type SimilarityLevelId = "muy-alta" | "alta" | "moderada";

/** El nombre de cada nivel está en locales/*.json (common.similarityLevel) */
export interface SimilarityLevel {
  id: SimilarityLevelId;
  min: number;
}

/**
 * Umbrales para la similitud en proporción (datos/scripts/generar_datos_web.py), que hoy va
 * de 23 % a 67 %. Si cambia la fórmula, hay que revisarlos.
 */
export const SIMILARITY_LEVELS: SimilarityLevel[] = [
  { id: "muy-alta", min: 0.6 },
  { id: "alta", min: 0.45 },
  { id: "moderada", min: 0 },
];

export function similarityLevel(similarity: number): SimilarityLevel {
  return SIMILARITY_LEVELS.find((level) => similarity >= level.min) ?? SIMILARITY_LEVELS[SIMILARITY_LEVELS.length - 1];
}
