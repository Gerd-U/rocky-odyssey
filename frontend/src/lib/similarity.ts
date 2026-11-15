export type SimilarityLevelId = "muy-alta" | "alta" | "moderada";

/** El nombre de cada nivel está en locales/*.json (common.similarityLevel) */
export interface SimilarityLevel {
  id: SimilarityLevelId;
  min: number;
}

/**
 * Umbrales sobre el score de cada par (0 a 1), ajustados a la distribución real que da
 * datos/scripts/generar_web.py: en la Luna los scores van de 0,29 a 0,78 y en Marte de 0,51 a 0,75.
 * Con los umbrales anteriores (0,85 y 0,75) casi todo quedaba en "moderada".
 * Con 0,70 y 0,55: Luna 2 / 2 / 9 y Marte 3 / 8 / 2 (muy alta / alta / moderada).
 */
export const SIMILARITY_LEVELS: SimilarityLevel[] = [
  { id: "muy-alta", min: 0.7 },
  { id: "alta", min: 0.55 },
  { id: "moderada", min: 0 },
];

export function similarityLevel(similarity: number): SimilarityLevel {
  return SIMILARITY_LEVELS.find((level) => similarity >= level.min) ?? SIMILARITY_LEVELS[SIMILARITY_LEVELS.length - 1];
}
