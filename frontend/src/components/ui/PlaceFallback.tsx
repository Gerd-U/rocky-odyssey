import { useTranslation } from "react-i18next";
import type { Target } from "../../types/site";

/** Texturas equirectangulares (2:1), las mismas de los globos */
const TEXTURE: Record<Target | "earth", string> = {
  earth: "/textures/earth.jpg",
  moon: "/textures/moon.jpg",
  mars: "/textures/mars.jpg",
};
/** Cuántas veces el ancho del recuadro mide la textura: 5 deja ver unos 70° de longitud */
const ZOOM = 5;

const clamp = (value: number) => Math.min(100, Math.max(0, value));

/**
 * background-position en % para que el punto (lng, lat) de la textura quede en el centro.
 * Con background-size de ZOOM * ancho, el % no depende del tamaño en píxeles:
 *   x = (fx * Z - 0.5) / (Z - 1),  y = (fy * Z / 2 - 0.5 * a) / (Z / 2 - a)
 * donde fx, fy son la posición del punto en la textura (0 a 1) y a = alto / ancho del recuadro.
 */
function texturePosition(lat: number, lng: number, aspect: number): string {
  const fx = (lng + 180) / 360;
  const fy = (90 - lat) / 180;
  const x = ((fx * ZOOM - 0.5) / (ZOOM - 1)) * 100;
  const y = ((fy * ZOOM) / 2 - 0.5 * aspect) / (ZOOM / 2 - aspect) * 100;
  return `${clamp(x)}% ${clamp(y)}%`;
}

interface PlaceFallbackProps {
  name: string;
  lat: number;
  lng: number;
  /** Cuerpo del lugar; sin él, la Tierra */
  body?: Target;
  /** alto / ancho del recuadro (1 en cuadrado, 0,75 en 4:3) */
  aspect: number;
  /**
   * "full": nombre y "Foto pendiente" (cuando el nombre no aparece en otro sitio).
   * "pending": solo "Foto pendiente" (tarjetas, que ya llevan el nombre debajo).
   * "none": solo la textura (miniaturas).
   */
  label?: "full" | "pending" | "none";
  className?: string;
}

/**
 * Respaldo para lugares sin foto: la textura de su cuerpo (la Tierra por defecto) recortada alrededor del lugar,
 * con su nombre. Ocupa el mismo hueco que la foto (absolute inset-0).
 */
export default function PlaceFallback({
  name,
  lat,
  lng,
  body,
  aspect,
  label = "full",
  className = "",
}: PlaceFallbackProps) {
  const { t } = useTranslation();

  return (
    <div
      role="img"
      aria-label={t("common.photoPendingAlt", { name })}
      className={`absolute inset-0 overflow-hidden bg-night-800 ${className}`}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-no-repeat opacity-80"
        style={{
          backgroundImage: `url(${TEXTURE[body ?? "earth"]})`,
          backgroundSize: `${ZOOM * 100}% auto`,
          backgroundPosition: texturePosition(lat, lng, aspect),
        }}
      />
      {/* Marca el punto exacto del lugar sobre la textura */}
      <span aria-hidden className="absolute top-1/2 left-1/2 size-2 -translate-1/2 rounded-full bg-ink ring-4 ring-ink/25" />
      {label !== "none" && (
        <>
          <div aria-hidden className="absolute inset-0 bg-linear-to-t from-night-900/90 via-night-900/20 to-transparent" />
          <p aria-hidden className="absolute inset-x-4 bottom-3">
            {label === "full" && (
              <span className="block text-lg leading-tight font-extrabold text-balance font-stretch-[75%] text-ink">
                {name}
              </span>
            )}
            <span className="mt-0.5 block text-small text-ink-soft">{t("common.photoPending")}</span>
          </p>
        </>
      )}
    </div>
  );
}
