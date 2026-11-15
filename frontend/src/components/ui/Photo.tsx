import { useState, type ImgHTMLAttributes } from "react";
import { IMAGE_SIZES, ratioAspect, responsiveSource } from "../../lib/images";
import type { Target } from "../../types/site";
import PlaceFallback from "./PlaceFallback";

interface PictureProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet" | "sizes"> {
  /** Ruta original que viene en los datos, p. ej. /images/atacama.jpg */
  src: string;
  /** Ancho con el que se ve la foto; ver IMAGE_SIZES */
  sizes: string;
}

/**
 * <picture> con las versiones WebP optimizadas (srcset) y el JPG de respaldo.
 * Si la foto no tiene versiones optimizadas, se usa la original.
 * El <picture> va con display: contents para que el <img> siga ocupando el mismo sitio que antes.
 */
export function Picture({ src, sizes, ...img }: PictureProps) {
  const responsive = responsiveSource(src);
  if (!responsive) return <img src={src} {...img} />;

  return (
    <picture className="contents">
      <source type="image/webp" srcSet={responsive.srcSet} sizes={sizes} />
      <img src={responsive.fallback} {...img} />
    </picture>
  );
}

/** Lugar que se dibuja con PlaceFallback cuando no hay foto */
export interface PhotoPlace {
  name: string;
  lat: number;
  lng: number;
  /** Bases de la Luna o Marte; los lugares de la Tierra no lo traen */
  body?: Target;
}

interface PhotoProps {
  /** null: el lugar aún no tiene foto y se muestra `place` sobre la textura */
  src: string | null;
  place?: PhotoPlace;
  alt: string;
  caption?: string;
  credit?: string;
  ratio?: string;
  position?: string;
  priority?: boolean;
  /** Ancho con el que se ve la foto; ver IMAGE_SIZES */
  sizes?: string;
  className?: string;
}

export default function Photo({
  src,
  place,
  alt,
  caption,
  credit,
  ratio = "3 / 2",
  position = "center",
  priority = false,
  sizes = IMAGE_SIZES.full,
  className = "",
}: PhotoProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <figure className={className}>
      <div className="relative overflow-hidden bg-night-800" style={{ aspectRatio: ratio }}>
        {src === null ? (
          place && (
            <PlaceFallback
              name={place.name}
              lat={place.lat}
              lng={place.lng}
              body={place.body}
              aspect={ratioAspect(ratio)}
            />
          )
        ) : (
          <Picture
            src={src}
            sizes={sizes}
            alt={alt}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            onLoad={() => setLoaded(true)}
            style={{ objectPosition: position }}
            className={`absolute inset-0 size-full object-cover transition-opacity duration-500 ease-out-strong ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
          />
        )}
      </div>
      {(caption || credit) && (
        <figcaption className="mt-2">
          {caption && <span className="block text-sm text-ink">{caption}</span>}
          {credit && <span className="mt-0.5 block text-small text-ink-soft">{credit}</span>}
        </figcaption>
      )}
    </figure>
  );
}
