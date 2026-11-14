import type { SiteFactors, Target } from "../types/site";

export const BODY_NAME: Record<Target, string> = {
  moon: "la Luna",
  mars: "Marte",
};

export const BODY_LABEL: Record<Target, string> = {
  moon: "Luna",
  mars: "Marte",
};

export const TERRAIN_LABEL: Record<SiteFactors["terrain"], string> = {
  moderado: "Moderado",
  alto: "Alto",
  extremo: "Extremo",
};

const percentFmt = new Intl.NumberFormat("es", { style: "percent", maximumFractionDigits: 0 });
const tempFmt = new Intl.NumberFormat("es", { style: "unit", unit: "celsius", maximumFractionDigits: 0 });
const numberFmt = new Intl.NumberFormat("es", { maximumFractionDigits: 0 });
const coordFmt = new Intl.NumberFormat("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatPercent(ratio: number): string {
  return percentFmt.format(ratio);
}

export function formatTemp(celsius: number): string {
  return tempFmt.format(celsius);
}

export function formatTempSpan(min: number, max: number): string {
  return `${numberFmt.format(min)} a ${formatTemp(max)}`;
}

export function formatPrecip(mm: number): string {
  return `${numberFmt.format(mm)} mm/año`;
}

export function formatCoords(lat: number, lng: number): string {
  const ns = lat >= 0 ? "N" : "S";
  const eo = lng >= 0 ? "E" : "O";
  return `${coordFmt.format(Math.abs(lat))}° ${ns} · ${coordFmt.format(Math.abs(lng))}° ${eo}`;
}