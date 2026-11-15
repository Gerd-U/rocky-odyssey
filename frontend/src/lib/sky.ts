/**
 * Posición aproximada de Marte y la Luna para una fecha, calculada en el navegador.
 * Marte: elementos orbitales medios de JPL (Standish) en el plano de la eclíptica,
 * con error de unos pocos millones de km. Luna: términos principales de Meeus,
 * con error de unos cientos de km. Suficiente para una cifra redondeada "de hoy".
 */

const AU_KM = 149_597_870.7;
const LIGHT_KM_S = 299_792.458;
const DEG = Math.PI / 180;

/** Siglos julianos desde J2000 */
function centuriesSinceJ2000(date: Date): number {
  const julianDay = date.getTime() / 86_400_000 + 2_440_587.5;
  return (julianDay - 2_451_545) / 36_525;
}

interface OrbitalElements {
  /** semieje mayor (UA) */
  a: number;
  e: number;
  /** longitud media (grados), en función de T */
  meanLongitude: (t: number) => number;
  /** longitud del perihelio (grados), en función de T */
  perihelion: (t: number) => number;
}

const EARTH: OrbitalElements = {
  a: 1.00000261,
  e: 0.01671123,
  meanLongitude: (t) => 100.46457166 + 35999.37244981 * t,
  perihelion: (t) => 102.93768193 + 0.32327364 * t,
};

const MARS: OrbitalElements = {
  a: 1.52371034,
  e: 0.0933941,
  meanLongitude: (t) => -4.55343205 + 19140.30268499 * t,
  perihelion: (t) => -23.94362959 + 0.44441088 * t,
};

/** Posición heliocéntrica (UA) en el plano de la eclíptica */
function heliocentric({ a, e, meanLongitude, perihelion }: OrbitalElements, t: number): [number, number] {
  const meanAnomaly = (meanLongitude(t) - perihelion(t)) * DEG;
  // Ecuación de Kepler por Newton: E - e·sin E = M
  let eccentric = meanAnomaly;
  for (let i = 0; i < 6; i++) {
    eccentric -= (eccentric - e * Math.sin(eccentric) - meanAnomaly) / (1 - e * Math.cos(eccentric));
  }
  const x = a * (Math.cos(eccentric) - e);
  const y = a * Math.sqrt(1 - e * e) * Math.sin(eccentric);
  const angle = perihelion(t) * DEG;
  return [x * Math.cos(angle) - y * Math.sin(angle), x * Math.sin(angle) + y * Math.cos(angle)];
}

export interface MarsToday {
  distanceKm: number;
  lightMinutes: number;
}

export function marsToday(date = new Date()): MarsToday {
  const t = centuriesSinceJ2000(date);
  const [ex, ey] = heliocentric(EARTH, t);
  const [mx, my] = heliocentric(MARS, t);
  const distanceKm = Math.hypot(mx - ex, my - ey) * AU_KM;
  return { distanceKm, lightMinutes: distanceKm / LIGHT_KM_S / 60 };
}

export interface MoonToday {
  distanceKm: number;
  /** fracción iluminada, de 0 a 1 */
  illuminated: number;
  waxing: boolean;
}

export function moonToday(date = new Date()): MoonToday {
  const t = centuriesSinceJ2000(date);
  const d = (297.8501921 + 445267.1114034 * t) * DEG; // elongación media
  const m = (357.5291092 + 35999.0502909 * t) * DEG; // anomalía media del Sol
  const mp = (134.9633964 + 477198.8675055 * t) * DEG; // anomalía media de la Luna

  const distanceKm =
    385000.56 -
    20905.355 * Math.cos(mp) -
    3699.111 * Math.cos(2 * d - mp) -
    2955.968 * Math.cos(2 * d) -
    569.925 * Math.cos(2 * mp) +
    246.158 * Math.cos(2 * d - 2 * mp) -
    204.586 * Math.cos(2 * d - m) -
    170.733 * Math.cos(2 * d + mp) -
    152.138 * Math.cos(2 * d - m - mp);

  const phaseAngle =
    Math.PI -
    d -
    (6.289 * Math.sin(mp) -
      2.1 * Math.sin(m) +
      1.274 * Math.sin(2 * d - mp) +
      0.658 * Math.sin(2 * d) +
      0.214 * Math.sin(2 * mp) +
      0.11 * Math.sin(d)) *
      DEG;

  const elongation = ((d / DEG) % 360 + 360) % 360;
  return { distanceKm, illuminated: (1 + Math.cos(phaseAngle)) / 2, waxing: elongation < 180 };
}
