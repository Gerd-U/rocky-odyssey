export type Target = "moon" | "mars";

export interface SiteFactors {
  precipMm: number | null;
  tempMin: number;
  tempMax: number;
  terrain: "moderado" | "alto" | "extremo" | null;
}

/** Gemelo de un sitio de la Tierra en un destino: la base más parecida y su similitud */
export interface Twin {
  analogOf: string; // id de una Base
  similarity: number; // 0 a 1
}

/** Las tres medidas con las que se calcula la similitud (datos/scripts/generar_datos_web.py) */
export interface Measures {
  thermalRange: number; // °C de diferencia entre la mínima y la máxima
  ice: number; // % de días con nieve
  roughness: number; // m
}

/** Medida de una base, tal como llega de los sources_log (rango_termico, hielo, rugosidad...) */
export interface ScientificMeasurement {
  name: string;
  value: number;
  unit?: string;
}

export interface Site {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  target: Target;
  analogOf: string; // id de una Base
  similarity: number; // 0 a 1
  /** Gemelo en cada globo, comparado por separado con la Luna y con Marte */
  twins?: Partial<Record<Target, Twin>>;
  measures?: Measures;
  factors: SiteFactors;
  missions: string[];
  image: string;
  imageAuthor: string;
  /** Código de licencia: "public-domain" o el nombre de una Creative Commons ("CC BY-SA 3.0") */
  imageLicense: string;
  description: string;
  // "real" si el backend aplicó datos de locations.json; "placeholder" si son los valores escritos a mano.
  dataSource?: "real" | "placeholder";
}

export interface Base {
  id: string;
  name: string;
  body: Target;
  lat: number;
  lng: number;
  factors: SiteFactors;
  /** Medidas de los sources_log; el backend las añade en /api/bases */
  scientificData?: ScientificMeasurement[];
  image: string;
  imageAuthor: string;
  /** Código de licencia: "public-domain" o el nombre de una Creative Commons ("CC BY-SA 3.0") */
  imageLicense: string;
  description: string;
}