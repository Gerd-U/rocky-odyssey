import optimized from "../data/optimized-images.json";

/**
 * Rutas de las versiones optimizadas que genera `npm run images` (scripts/optimize-images.mjs):
 * /images/atacama.jpg -> /images/optimized/atacama-800.webp, -1600.webp, -2400.webp y atacama.jpg
 */

/** Ancho real de cada versión; las fotos pequeñas no se agrandan */
const WIDTHS = optimized as Record<string, Record<string, number>>;

/** `sizes` de cada uso: el navegador elige la versión según el ancho en pantalla y la densidad */
// Medidas sacadas de los grids (contenedor max-w-6xl con px-6 = 69rem útiles).
export const IMAGE_SIZES = {
  /** Tarjeta de /ubicaciones: 3, 2 o 1 columnas. En escritorio pide la de 800 */
  card: "(min-width: 64rem) 22rem, (min-width: 40rem) calc(50vw - 3rem), calc(100vw - 3rem)",
  /** Gemelo en la esquina de la tarjeta (30 % de su ancho) */
  cardCorner: "(min-width: 64rem) 7rem, (min-width: 40rem) 15vw, 30vw",
  /** Fotos gemelas de la Home: dos columnas, o a los lados de la ficha en escritorio */
  twin: "(min-width: 64rem) 22rem, calc(50vw - 2rem)",
  /** Miniatura de "siguiente" en el detalle (w-24 / sm:w-32) */
  thumb: "8rem",
  /**
   * Comparador del detalle, casi a ancho completo. En escritorio pide siempre la de 2400:
   * al arrastrar se ve cada foto entera a ~69rem y se quiere la máxima nitidez.
   * En móvil se ajusta al ancho de la pantalla.
   */
  wide: "(min-width: 64rem) 2400px, calc(100vw - 3rem)",
  /** Fondo a sangre */
  full: "100vw",
} as const;

export interface ResponsiveSource {
  /** srcset en WebP con el ancho real de cada archivo */
  srcSet: string;
  /** JPG de respaldo sin metadatos */
  fallback: string;
}

/** null si la foto no está en public/images o aún no se optimizó: se usa la original */
export function responsiveSource(src: string): ResponsiveSource | null {
  const widths = WIDTHS[src];
  const match = /^\/images\/(.+)\.jpe?g$/i.exec(src);
  if (!widths || !match) return null;

  const base = `/images/optimized/${match[1]}`;
  const seen = new Set<number>();
  const entries: string[] = [];
  for (const [name, width] of Object.entries(widths).sort(([a], [b]) => Number(a) - Number(b))) {
    // Si dos versiones quedaron del mismo ancho (foto pequeña), basta con una
    if (seen.has(width)) continue;
    seen.add(width);
    entries.push(`${base}-${name}.webp ${width}w`);
  }

  return { srcSet: entries.join(", "), fallback: `${base}.jpg` };
}
