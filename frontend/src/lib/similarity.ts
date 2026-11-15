export type SimilarityLevelId = "muy-alta" | "alta" | "moderada";

/** El nombre de cada nivel está en locales/*.json (common.similarityLevel) */
export interface SimilarityLevel {
  id: SimilarityLevelId;
  min: number;
}

export const SIMILARITY_LEVELS: SimilarityLevel[] = [
  { id: "muy-alta", min: 0.85 },
  { id: "alta", min: 0.75 },
  { id: "moderada", min: 0 },
];

export function similarityLevel(similarity: number): SimilarityLevel {
  return SIMILARITY_LEVELS.find((level) => similarity >= level.min) ?? SIMILARITY_LEVELS[SIMILARITY_LEVELS.length - 1];
}
