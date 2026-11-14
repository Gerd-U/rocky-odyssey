import type { SimilarityLevelId } from "../../lib/similarity";
import type { Target } from "../../types/site";

export const SITE_COLOR: Record<Target, string> = {
  mars: "#e3a6dd",
  moon: "#a9bce6",
};

export const LEVEL_COLOR: Record<Target, Record<SimilarityLevelId, string>> = {
  mars: { "muy-alta": "#f3c9ee", alta: "#c97cc1", moderada: "#8f4a8a" },
  moon: { "muy-alta": "#d4e0f7", alta: "#8fa9d8", moderada: "#5a7bb3" },
};

export const LEVEL_SIZE: Record<SimilarityLevelId, number> = {
  "muy-alta": 0.95,
  alta: 0.7,
  moderada: 0.5,
};

export const SELECTED_COLOR = "#eef0fa";
