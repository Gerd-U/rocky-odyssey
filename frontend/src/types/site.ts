/** Datos generados por datos/scripts/generar_web.py (ver datos/METODOLOGIA.md) */

export type Target = "moon" | "mars";

/** Criterios de similitud, con los nombres de backend/app/services/scoring.py */
export type CriterionId = "topography" | "temperature" | "ice_water";

/** Similitud de un lugar de la Tierra con la base más parecida de un cuerpo */
export interface Match {
  baseId: string;
  /** 0 a 1 */
  score: number;
  /** % de los criterios de scoring.py con dato */
  coverage: number;
  /** Similitud de cada criterio, 0 a 100; null si falta uno de los dos valores */
  criteria: Record<CriterionId, number | null>;
}

/** Una fila de los sources_log del equipo */
export interface Source {
  /** Nombre de la variable en el log: rugosidad, rango_termico, hielo, tmax_k… */
  variable: string;
  value: number | null;
  /** Capa, producto y fórmula, tal como la escribió el equipo */
  note: string;
  url: string | null;
  date: string | null;
  /** El log la marca como PROVISIONAL: es una aproximación */
  provisional?: boolean;
}

export interface SiteMetrics {
  roughnessM: number | null;
  /** Diferencia día-noche en °C (igual en K) */
  thermalRange: number | null;
  /** % de meses con media bajo 0 °C */
  coldIndex: number | null;
  elevationM: number | null;
  tempMinC: number | null;
  tempMaxC: number | null;
}

export interface MonthlyTemp {
  month: number;
  dayC: number | null;
  nightC: number | null;
}

export interface Site {
  id: string;
  name: string;
  country: string;
  description: string;
  missions: string[];
  lat: number;
  lng: number;
  /** Región tal como está en sitios_candidatos.csv */
  region: string | null;
  /** sedimentos, basalto, hielo o regolito */
  geology: string | null;
  /** Nivel de estudio, 0 a 1 */
  studied: number | null;
  metrics: SiteMetrics;
  monthlyTemp: MonthlyTemp[];
  matches: Partial<Record<Target, Match>>;
  sources: Source[];
  image: string | null;
  imageAuthor: string | null;
  /** Código de licencia: "public-domain" o el nombre de una Creative Commons ("CC BY-SA 3.0") */
  imageLicense: string | null;
  // "real" si son datos del equipo; "placeholder" si son valores escritos a mano.
  dataSource?: "real" | "placeholder";
}

export interface BaseMetrics {
  roughnessM: number | null;
  /** Diferencia entre máxima y mínima, en K */
  thermalRange: number | null;
  coldIndex: number | null;
  tminK: number | null;
  tmaxK: number | null;
}

export interface Base {
  id: string;
  name: string;
  description: string;
  body: Target;
  lat: number;
  lng: number;
  metrics: BaseMetrics;
  sources: Source[];
  image: string | null;
  imageAuthor: string | null;
  imageLicense: string | null;
  dataSource?: "real" | "placeholder";
}
