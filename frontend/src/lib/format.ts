import i18n, { getLang } from "../i18n";
import type { SiteFactors, Target } from "../types/site";

/** Nombre del destino dentro de una frase: "la Luna" / "the Moon" */
export function bodyName(target: Target): string {
  return i18n.t(`common.bodyName.${target}`);
}

/** Nombre corto del destino, como etiqueta: "Luna" / "Moon" */
export function bodyLabel(target: Target): string {
  return i18n.t(`common.bodyLabel.${target}`);
}

/** Licencias con código propio que se traducen; las Creative Commons se muestran tal cual */
const TRANSLATED_LICENSES = ["public-domain", "pixabay"] as const;
type TranslatedLicense = (typeof TRANSLATED_LICENSES)[number];

/** "public-domain" -> "Dominio público" / "Public domain"; "CC BY 4.0" se queda igual */
export function licenseLabel(license: string): string {
  return (TRANSLATED_LICENSES as readonly string[]).includes(license)
    ? i18n.t(`licenses.${license as TranslatedLicense}`)
    : license;
}

/** Crédito de una foto: "Autor · Licencia" */
export function formatCredit(author: string, license: string): string {
  return `${author} · ${licenseLabel(license)}`;
}

export function terrainLabel(terrain: SiteFactors["terrain"]): string {
  if (terrain === null) return i18n.t("common.noData");
  return i18n.t(`common.terrain.${terrain}`);
}

// Los Intl.NumberFormat se crean una vez por idioma y formato
const formatters = new Map<string, Intl.NumberFormat>();

function numberFormat(name: string, options: Intl.NumberFormatOptions, lang: string = getLang()): Intl.NumberFormat {
  const key = `${lang}:${name}`;
  let fmt = formatters.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat(lang, options);
    formatters.set(key, fmt);
  }
  return fmt;
}

export function formatNumber(value: number): string {
  return numberFormat("number", { maximumFractionDigits: 0 }).format(value);
}

/** `lang` solo hace falta dentro de un useMemo que dependa del idioma */
export function formatPercent(ratio: number, lang?: string): string {
  return numberFormat("percent", { style: "percent", maximumFractionDigits: 0 }, lang).format(ratio);
}

export function formatTemp(celsius: number): string {
  return numberFormat("temp", { style: "unit", unit: "celsius", maximumFractionDigits: 0 }).format(celsius);
}

export function formatTempSpan(min: number, max: number): string {
  return i18n.t("common.tempSpan", { min: formatNumber(min), max: formatTemp(max) });
}

export function formatPrecip(mm: number | null): string {
  if (mm === null) return i18n.t("common.noData");
  return i18n.t("common.precip", { value: formatNumber(mm) });
}

export function formatCoords(lat: number, lng: number): string {
  const coord = numberFormat("coord", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const ns = i18n.t(lat >= 0 ? "common.coordNorth" : "common.coordSouth");
  const ew = i18n.t(lng >= 0 ? "common.coordEast" : "common.coordWest");
  return `${coord.format(Math.abs(lat))}° ${ns} · ${coord.format(Math.abs(lng))}° ${ew}`;
}
