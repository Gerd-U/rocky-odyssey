export type Target = "moon" | "mars";

export interface SiteFactors {
  precipMm: number;
  tempMin: number;
  tempMax: number;
  terrain: "moderado" | "alto" | "extremo";
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
  factors: SiteFactors;
  missions: string[];
  image: string;
  description: string;
}

export interface Base {
  id: string;
  name: string;
  body: Target;
  lat: number;
  lng: number;
  description: string;
}
