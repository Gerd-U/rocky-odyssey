import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import type { Base, Site } from "../types/site";
import { getBases, getSites } from "../services/api";

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
 * Al cambiar de key (p. ej. de idioma) se sigue mostrando el dato anterior hasta que llega el nuevo,
 * para no volver a los esqueletos de carga.
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
          setSettled({ key, data: null, error: err instanceof Error ? err.message : i18n.t("common.error.unknown") });
      });
    return () => {
      cancelled = true;
    };
  }, [key, fetcher]);

  if (key === null) return { data: null, loading: false, error: i18n.t("common.error.missingId") };
  if (!settled) return { data: null, loading: true, error: null };
  // Mientras llega la respuesta de la key actual, se mantiene el dato anterior si lo había
  if (settled.key !== key) {
    return settled.data ? { data: settled.data, loading: false, error: null } : { data: null, loading: true, error: null };
  }
  return { data: settled.data, loading: false, error: settled.error };
}

/** Idioma activo; al cambiarlo se vuelven a pedir los datos (services/api los guarda por idioma) */
function useLang(): string {
  const { i18n: instance } = useTranslation();
  return instance.resolvedLanguage ?? "en";
}

export function useSites(): AsyncState<Site[]> {
  return useAsync(useLang(), getSites);
}

export function useBases(): AsyncState<Base[]> {
  return useAsync(useLang(), getBases);
}
