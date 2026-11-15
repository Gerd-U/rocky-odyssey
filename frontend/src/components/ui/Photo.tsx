import { useState } from "react";

interface PhotoProps {
  src: string;
  alt: string;
  caption?: string;
  credit?: string;
  ratio?: string;
  position?: string;
  priority?: boolean;
  className?: string;
}

export default function Photo({
  src,
  alt,
  caption,
  credit,
  ratio = "3 / 2",
  position = "center",
  priority = false,
  className = "",
}: PhotoProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <figure className={className}>
      <div className="relative overflow-hidden bg-night-800" style={{ aspectRatio: ratio }}>
        <img
          src={src}
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