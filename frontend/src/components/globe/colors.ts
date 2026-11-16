import type { SimilarityLevelId } from "../../lib/similarity";
import type { Target } from "../../types/site";

export const SITE_COLOR: Record<Target, string> = {
  mars: "#e3a6dd",
  moon: "#a9bce6",
};

export const LEVEL_COLOR: Record<Target, Record<SimilarityLevelId, string>> = {
  mars: { "muy-alta": "#fde6f9", alta: "#d77fcb", moderada: "#9a4892" },
  moon: { "muy-alta": "#eaf0ff", alta: "#8fabe0", moderada: "#4e6ea8" },
};

export const LEVEL_SIZE: Record<SimilarityLevelId, number> = {
  "muy-alta": 0.95,
  alta: 0.7,
  moderada: 0.5,
};

export const SELECTED_COLOR = "#eef0fa";

/** Sitios de la Tierra con la misma base gemela que el elegido: claros, pero menos que él */
export const RELATED_COLOR = "rgba(238, 240, 250, 0.7)";
