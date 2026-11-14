import type { Base, Site } from "../types/site";
import sitesMock from "../data/sites.mock.json";
import basesMock from "../data/bases.mock.json";

/**
 * Única puerta de entrada a los datos. Ningún componente hace fetch directo.
 * VITE_USE_MOCK=true  -> devuelve los JSON de src/data
 * VITE_USE_MOCK=false -> pide al backend en VITE_API_URL
 */
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

const mockSites = sitesMock as Site[];
const mockBases = basesMock as Base[];

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`);
  if (!res.ok) {
    throw new Error(`Error ${res.status} al pedir ${path}`);
  }
  return (await res.json()) as T;
}

export async function getSites(): Promise<Site[]> {
  if (USE_MOCK) return mockSites;
  return request<Site[]>("/sites");
}

export async function getSite(id: string): Promise<Site> {
  if (USE_MOCK) {
    const site = mockSites.find((s) => s.id === id);
    if (!site) throw new Error(`No existe la ubicación "${id}"`);
    return site;
  }
  return request<Site>(`/sites/${encodeURIComponent(id)}`);
}

export async function getBases(): Promise<Base[]> {
  if (USE_MOCK) return mockBases;
  return request<Base[]>("/bases");
}
