import { useEffect, useState } from "react";
import type { Base, Site } from "../types/site";
import { getBases, getSite, getSites } from "../services/api";

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface Settled<T> {
  key: string;
  data: T | null;
  error: string | null;
}

/**
 * Pide `fetcher(key)` cada vez que cambia `key`.
 * `fetcher` tiene que ser estable (las funciones de services/api lo son).
 */
function useAsync<T>(key: string | null, fetcher: (key: string) => Promise<T>): AsyncState<T> {
  const [settled, setSettled] = useState<Settled<T> | null>(null);

  useEffect(() => {
    if (key === null) return;
    let cancelled = false;
    fetcher(key)
      .then((data) => {
        if (!cancelled) setSettled({ key, data, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setSettled({ key, data: null, error: err instanceof Error ? err.message : "Error desconocido" });
      });
    return () => {
      cancelled = true;
    };
  }, [key, fetcher]);

  if (key === null) return { data: null, loading: false, error: "Falta el id" };
  // Mientras la respuesta no corresponda a la key actual, seguimos cargando
  if (!settled || settled.key !== key) return { data: null, loading: true, error: null };
  return { data: settled.data, loading: false, error: settled.error };
}

export function useSites(): AsyncState<Site[]> {
  return useAsync("sites", getSites);
}

export function useSite(id: string | undefined): AsyncState<Site> {
  return useAsync(id ?? null, getSite);
}

export function useBases(): AsyncState<Base[]> {
  return useAsync("bases", getBases);
}
