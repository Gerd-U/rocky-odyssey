import { getLang, SUPPORTED_LANGS, type Lang } from "../i18n";
import type { Base, Site } from "../types/site";
import sitesMock from "../data/sites.mock.json";
import basesMock from "../data/bases.mock.json";

/**
 * Única puerta de entrada a los datos. Ningún componente hace fetch directo.
 * VITE_USE_MOCK=true  -> devuelve los JSON de src/data
 * VITE_USE_MOCK=false -> pide al backend en VITE_API_URL
 *
 * Los textos (name, country, description, missions) llegan en el idioma pedido.
 * Cada endpoint se pide una sola vez por idioma: todos los componentes comparten la misma promesa.
 */
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

/** Campo con una versión por idioma, como en backend/data y src/data/*.mock.json */
type Translated<T> = Record<Lang, T>;
type TranslatedField = "name" | "country" | "description" | "missions";

/** Formato bilingüe de los JSON: los campos traducidos son objetos { es, en } */
type Bilingual<T> = Omit<T, TranslatedField | "dataSource"> & {
  [K in TranslatedField & keyof T]: Translated<T[K]>;
};

const mockSites = sitesMock as Bilingual<Site>[];
const mockBases = basesMock as Bilingual<Base>[];

function toLang(lang: string): Lang {
  return (SUPPORTED_LANGS as readonly string[]).includes(lang) ? (lang as Lang) : "en";
}

/** Resuelve los campos { es, en } al idioma pedido (lo mismo que hace el backend con ?lang) */
function localize<T>(item: Bilingual<T>, lang: Lang): T {
  const out: Record<string, unknown> = { ...item };
  for (const [key, value] of Object.entries(item)) {
    if (value && typeof value === "object" && !Array.isArray(value) && "es" in value && "en" in value) {
      out[key] = (value as Translated<unknown>)[lang];
    }
  }
  return out as T;
}

const cache = new Map<string, Promise<unknown>>();

/** Guarda la promesa por clave; si falla se borra para poder reintentar */
function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key) as Promise<T> | undefined;
  if (hit) return hit;
  const promise = load().catch((err: unknown) => {
    cache.delete(key);
    throw err;
  });
  cache.set(key, promise);
  return promise;
}

async function request<T>(path: string, lang: Lang): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}?lang=${lang}`);
  if (!res.ok) {
    throw new Error(`Error ${res.status} al pedir ${path}`);
  }
  return (await res.json()) as T;
}

/** `lang` por defecto es el idioma activo; un valor no admitido se trata como inglés */
export function getSites(lang: string = getLang()): Promise<Site[]> {
  const l = toLang(lang);
  return cached(`sites:${l}`, async () =>
    USE_MOCK ? mockSites.map((s) => localize<Site>(s, l)) : request<Site[]>("/sites", l),
  );
}

export async function getSite(id: string, lang: string = getLang()): Promise<Site> {
  const site = (await getSites(lang)).find((s) => s.id === id);
  if (!site) throw new Error(`No existe la ubicación "${id}"`);
  return site;
}

export function getBases(lang: string = getLang()): Promise<Base[]> {
  const l = toLang(lang);
  return cached(`bases:${l}`, async () =>
    USE_MOCK ? mockBases.map((b) => localize<Base>(b, l)) : request<Base[]>("/bases", l),
  );
}
