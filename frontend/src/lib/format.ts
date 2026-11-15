import i18n, { getLang } from "../i18n";
import type { Target } from "../types/site";

/** Nombre del destino dentro de una frase: "la Luna" / "the Moon" */
export function bodyName(target: Target): string {
  return i18n.t(`common.bodyName.${target}`);
}

/** Nombre corto del destino, como etiqueta: "Luna" / "Moon" */
export function bodyLabel(target: Target): string {
  return i18n.t(`common.bodyLabel.${target}`);
}

/** Licencias con código propio que se traducen; las Creative Commons se muestran tal cual */
const TRANSLATED_LICENSES = ["public-domain", "pixabay", "copernicus"] as const;
type TranslatedLicense = (typeof TRANSLATED_LICENSES)[number];

/** "public-domain" -> "Dominio público" / "Public domain"; "CC BY 4.0" se queda igual */
export function licenseLabel(license: string): string {
  return (TRANSLATED_LICENSES as readonly string[]).includes(license)
    ? i18n.t(`licenses.${license as TranslatedLicense}`)
    : license;
}

/** Crédito de una foto: "Autor · Licencia", o "Foto pendiente" si el lugar aún no tiene foto */
export function formatCredit(author: string | null, license: string | null): string {
  if (!author || !license) return i18n.t("common.photoPending");
  return `${author} · ${licenseLabel(license)}`;
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

/** Número con un decimal como máximo: 261,8 / 261.8 */
export function formatDecimal(value: number): string {
  return numberFormat("decimal", { maximumFractionDigits: 1 }).format(value);
}

/** `ratio` de 0 a 1. `lang` solo hace falta dentro de un useMemo que dependa del idioma */
export function formatPercent(ratio: number, lang?: string): string {
  return numberFormat("percent", { style: "percent", maximumFractionDigits: 0 }, lang).format(ratio);
}

export function formatTemp(celsius: number): string {
  return numberFormat("temp", { style: "unit", unit: "celsius", maximumFractionDigits: 0 }).format(celsius);
}

/** Valores que pueden faltar: devuelven null y la vista pone "sin datos" */
type Formatter = (value: number) => string;
const orNull = (format: Formatter) => (value: number | null | undefined) =>
  value === null || value === undefined ? null : format(value);

/** Metros: "261,8 m" */
export const formatMeters = orNull((m) => i18n.t("units.meters", { value: formatDecimal(m) }));

/** Diferencia de temperatura en la Tierra: "27,9 °C" */
export const formatCelsiusSpan = orNull((c) => i18n.t("units.celsius", { value: formatDecimal(c) }));

/** Temperatura o diferencia en kelvin: "130 K" */
export const formatKelvin = orNull((k) => i18n.t("units.kelvin", { value: formatDecimal(k) }));

/** Porcentaje de 0 a 100: "42 %" / "42%" */
export const formatPercentValue = orNull((value) => formatPercent(value / 100));

export function formatCoords(lat: number, lng: number): string {
  const coord = numberFormat("coord", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const ns = i18n.t(lat >= 0 ? "common.coordNorth" : "common.coordSouth");
  const ew = i18n.t(lng >= 0 ? "common.coordEast" : "common.coordWest");
  return `${coord.format(Math.abs(lat))}° ${ns} · ${coord.format(Math.abs(lng))}° ${ew}`;
}
