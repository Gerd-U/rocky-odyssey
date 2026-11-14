import { useEffect, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import { SELECTED_COLOR } from "./colors";

export interface GlobePoint {
  id: string;
  lat: number;
  lng: number;
  label: string;
  color: string;
  /** radio en grados; por defecto 0.6 */
  size?: number;
}

export interface GlobeViewProps {
  /** Ruta de la textura (p. ej. /textures/earth.jpg) */
  texture: string;
  /** Se usa si `texture` no carga. Sin respaldo, el globo queda liso. */
  fallbackTexture?: string;
  points: GlobePoint[];
  onSelect?: (id: string) => void;
  selectedId?: string | null;
  height?: number;
  atmosphereColor?: string;
  /** Altitud de cámara inicial (en radios del globo) */
  initialAltitude?: number;
}

/** Devuelve la primera textura que carga, o null si ninguna lo hace. */
function useTexture(primary: string, fallback?: string): string | null | undefined {
  const [url, setUrl] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    const candidates = [primary, fallback].filter(Boolean) as string[];

    const tryNext = (i: number) => {
      if (i >= candidates.length) {
        if (!cancelled) setUrl(null);
        return;
      }
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => !cancelled && setUrl(candidates[i]);
      img.onerror = () => tryNext(i + 1);
      img.src = candidates[i];
    };
    tryNext(0);

    return () => {
      cancelled = true;
    };
  }, [primary, fallback]);

  return url;
}

export default function GlobeView({
  texture,
  fallbackTexture,
  points,
  onSelect,
  selectedId,
  height = 520,
  atmosphereColor = "#9aa8b8",
  initialAltitude = 2.4,
}: GlobeViewProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const textureUrl = useTexture(texture, fallbackTexture);
  const latest = useRef({ points, selectedId });

  useEffect(() => {
    latest.current = { points, selectedId };
  });

  // El canvas de three no es responsive: medimos el contenedor
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleReady = () => {
    const globe = globeRef.current;
    if (!globe) return;
    const { points: currentPoints, selectedId: currentId } = latest.current;
    const focus = currentPoints.find((pt) => pt.id === currentId);
    const controls = globe.controls();
    controls.autoRotate = !focus;
    controls.autoRotateSpeed = 0.35;
    controls.enableZoom = false;
    globe.pointOfView(
      focus ? { lat: focus.lat, lng: focus.lng, altitude: initialAltitude } : { altitude: initialAltitude },
    );
  };

  // Transición de cámara al punto seleccionado
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe || !selectedId) return;
    const p = points.find((pt) => pt.id === selectedId);
    if (!p) return;
    globe.controls().autoRotate = false;
    globe.pointOfView({ lat: p.lat, lng: p.lng, altitude: 1.6 }, 1200);
  }, [selectedId, points]);

  return (
    <div ref={containerRef} className="relative w-full" style={{ height }}>
      {width > 0 && textureUrl !== undefined && (
        <Globe
          ref={globeRef}
          width={width}
          height={height}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl={textureUrl}
          showAtmosphere
          atmosphereColor={atmosphereColor}
          atmosphereAltitude={0.18}
          pointsData={points}
          pointLat="lat"
          pointLng="lng"
          pointColor={(d) => ((d as GlobePoint).id === selectedId ? SELECTED_COLOR : (d as GlobePoint).color)}
          pointRadius={(d) => ((d as GlobePoint).id === selectedId ? 1.1 : (d as GlobePoint).size ?? 0.6)}
          pointAltitude={(d) => ((d as GlobePoint).id === selectedId ? 0.12 : 0.04)}
          pointLabel={(d) => (d as GlobePoint).label}
          onPointClick={(d) => onSelect?.((d as GlobePoint).id)}
          onGlobeReady={handleReady}
        />
      )}
    </div>
  );
}
