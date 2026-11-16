import { API_URL } from "../config";
import { getLang, SUPPORTED_LANGS, type Lang } from "../i18n";
import type { Base, Site, Target, Twin } from "../types/site";

/**
 * Única puerta de entrada a los datos. Ningún componente hace fetch directo.
 * Todo se pide al backend en API_URL (src/config.ts, sale de VITE_API_URL).
 *
 * Los textos (name, country, description, missions) llegan ya en el idioma pedido.
 * Cada endpoint se pide una sola vez por idioma: todos los componentes comparten la misma promesa.
 */

function toLang(lang: string): Lang {
  return (SUPPORTED_LANGS as readonly string[]).includes(lang) ? (lang as Lang) : "en";
}

/**
 * Un sitio con gemelos en los dos destinos aparece una vez en cada globo: una entrada por
 * destino, con target, analogOf y similarity de ese gemelo. Sin twins, se deja como viene.
 */
function perTarget(site: Site): Site[] {
  const twins = Object.entries(site.twins ?? {}) as [Target, Twin][];
  if (twins.length === 0) return [site];
  return twins.map(([target, twin]) => ({ ...site, target, analogOf: twin.analogOf, similarity: twin.similarity }));
}

/** Enlace a la ficha de un sitio en su destino: /ubicacion/atacama?destino=moon */
export function siteUrl(site: Pick<Site, "id" | "target">): string {
  return `/ubicacion/${site.id}?destino=${site.target}`;
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
  return cached(`sites:${l}`, async () => (await request<Site[]>("/sites", l)).flatMap(perTarget));
}

export async function getSite(id: string, lang: string = getLang()): Promise<Site> {
  const site = (await getSites(lang)).find((s) => s.id === id);
  if (!site) throw new Error(`No existe la ubicación "${id}"`);
  return site;
}

export function getBases(lang: string = getLang()): Promise<Base[]> {
  const l = toLang(lang);
  return cached(`bases:${l}`, async () =>
    request<Base[]>("/bases", l),
  );
}
