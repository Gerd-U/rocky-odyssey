import { formatNumber, formatTemp } from "./format";
import i18n from "../i18n";
import type { Base, Site } from "../types/site";

/** Medidas que se muestran (el hielo no: es 0 en todas las bases y no aporta) */
export const MEASURE_KEYS = ["thermalRange", "roughness"] as const;
export type MeasureKey = (typeof MEASURE_KEYS)[number];

/** Nombre de cada medida en los sources_log de las bases (scientificData) */
const BASE_NAME: Record<MeasureKey, string> = {
  thermalRange: "rango_termico",
  roughness: "rugosidad",
};

export function siteMeasure(site: Site, key: MeasureKey): number | null {
  return site.measures?.[key] ?? null;
}

export function baseMeasure(base: Base, key: MeasureKey): number | null {
  return base.scientificData?.find((m) => m.name === BASE_NAME[key])?.value ?? null;
}

/**
 * Rango térmico en °C (en las bases viene en K: una diferencia de 1 K es igual a 1 °C) y
 * rugosidad en m. Sin dato: "Sin datos".
 */
export function formatMeasure(key: MeasureKey, value: number | null): string {
  if (value === null) return i18n.t("common.noData");
  if (key === "thermalRange") return formatTemp(value);
  return i18n.t("common.meters", { value: formatNumber(value) });
}
