import type { SiteFactors } from "../types/site";

export type SimilarityLevelId = "muy-alta" | "alta" | "moderada";

export interface SimilarityLevel {
  id: SimilarityLevelId;
  label: string;
  min: number;
}

export const SIMILARITY_LEVELS: SimilarityLevel[] = [
  { id: "muy-alta", label: "Muy alta", min: 0.85 },
  { id: "alta", label: "Alta", min: 0.75 },
  { id: "moderada", label: "Moderada", min: 0 },
];

export function similarityLevel(similarity: number): SimilarityLevel {
  return SIMILARITY_LEVELS.find((level) => similarity >= level.min) ?? SIMILARITY_LEVELS[SIMILARITY_LEVELS.length - 1];
}

export const TERRAIN_SCORE: Record<SiteFactors["terrain"], number> = {
  moderado: 0.4,
  alto: 0.7,
  extremo: 1,
};

const PRECIP_SCALE_MM = 1000;
const TEMP_SCALE_C = 200;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export interface FactorMatch {
  precip: number;
  temp: number;
  terrain: number;
}

export function factorMatch(earth: SiteFactors, target: SiteFactors): FactorMatch {
  const earthMid = (earth.tempMin + earth.tempMax) / 2;
  const targetMid = (target.tempMin + target.tempMax) / 2;

  return {
    precip: clamp01(1 - Math.abs(earth.precipMm - target.precipMm) / PRECIP_SCALE_MM),
    temp: clamp01(1 - Math.abs(earthMid - targetMid) / TEMP_SCALE_C),
    terrain: clamp01(1 - Math.abs(TERRAIN_SCORE[earth.terrain] - TERRAIN_SCORE[target.terrain])),
  };
}