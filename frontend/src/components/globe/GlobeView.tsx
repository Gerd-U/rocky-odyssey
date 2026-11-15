import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import { Cache, ImageLoader } from "three";
import { SELECTED_COLOR } from "./colors";

// three-globe carga la textura con TextureLoader: con la caché activa reutiliza la imagen
// que ya cargó useTexture en vez de descargarla y decodificarla otra vez
Cache.enabled = true;

const CAMERA_FOV = 50;
const MAX_PIXEL_RATIO = 1.5;

/** Color del anillo según su avance (0 al salir, 1 al llegar al radio máximo): se desvanece al crecer */
const ringFade = (t: number) => `rgba(238, 240, 250, ${(1 - t) * 0.85})`;

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
  /** Texturas que se cargan de antemano para cambiar de una a otra sin espera */
  preloadTextures?: string[];
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
    const loader = new ImageLoader();

    const tryNext = (i: number) => {
      if (i >= candidates.length) {
        if (!cancelled) setUrl(null);
        return;
      }
      loader.load(
        candidates[i],
        () => !cancelled && setUrl(candidates[i]),
        undefined,
        () => tryNext(i + 1),
      );
    };
    tryNext(0);

    return () => {
      cancelled = true;
    };
  }, [primary, fallback]);

  return url;
}

/** Diámetro en px que ocupa el globo en pantalla con la cámara a esa altitud. */
function globeDiameter(height: number, altitude: number): number {
  const angularRadius = Math.asin(1 / (1 + altitude));
  const halfFov = (CAMERA_FOV / 2) * (Math.PI / 180);
  return height * (Math.tan(angularRadius) / Math.tan(halfFov));
}

export default function GlobeView({
  texture,
  fallbackTexture,
  preloadTextures,
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
  const [ready, setReady] = useState(false);
  const visibleRef = useRef(true);
  const textureUrl = useTexture(texture, fallbackTexture);
  const latest = useRef({ points, selectedId });

  useEffect(() => {
    latest.current = { points, selectedId };
  });

  const preloadKey = preloadTextures?.join("|") ?? "";
  useEffect(() => {
    if (!preloadKey) return;
    const loader = new ImageLoader();
    for (const url of preloadKey.split("|")) loader.load(url);
  }, [preloadKey]);

  const syncAnimation = () => {
    const globe = globeRef.current;
    if (!globe) return;
    if (visibleRef.current) globe.resumeAnimation();
    else globe.pauseAnimation();
  };

  // El canvas de three no es responsive: medimos el contenedor.
  // Oculto (display: none) mide 0; se conserva el último ancho para no destruir el globo.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0) setWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Fuera de pantalla o con la página oculta, el globo deja de renderizar
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting;
      syncAnimation();
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const handleReady = () => {
    const globe = globeRef.current;
    if (!globe) return;
    const { points: currentPoints, selectedId: currentId } = latest.current;
    const focus = currentPoints.find((pt) => pt.id === currentId);
    globe.renderer().setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
    const controls = globe.controls();
    controls.autoRotate = !focus;
    controls.autoRotateSpeed = 0.35;
    controls.enableZoom = false;
    globe.pointOfView(
      focus ? { lat: focus.lat, lng: focus.lng, altitude: initialAltitude } : { altitude: initialAltitude },
    );
    syncAnimation();
    setReady(true);
  };

  // Transición de cámara al punto seleccionado
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe || !selectedId) return;
    const p = points.find((pt) => pt.id === selectedId);
    if (!p) return;
    globe.controls().autoRotate = false;
    globe.pointOfView({ lat: p.lat, lng: p.lng, altitude: 1.6 }, 800); // se repite mucho al recorrer la lista: corto
  }, [selectedId, points]);

  // Anillos que salen del punto elegido: en los dos globos a la vez, marcan a los gemelos
  // Con menos movimiento pedido, el punto elegido se distingue solo por color y tamaño
  const reduceMotion = useReducedMotion() ?? false;
  const rings = useMemo(
    () => (reduceMotion ? [] : points.filter((pt) => pt.id === selectedId)),
    [points, selectedId, reduceMotion],
  );

  const diameter = globeDiameter(height, initialAltitude);
  const focusLng = points.find((pt) => pt.id === selectedId)?.lng ?? 0;
  const posterOffset = diameter / 2 - ((focusLng + 180) / 360) * diameter * 2;

  return (
    <div ref={containerRef} className="relative w-full" style={{ height }}>
      <div
        aria-hidden
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-night-800 bg-repeat-x transition-opacity duration-300 ease-out-strong ${
          ready ? "opacity-0" : "opacity-100"
        }`}
        style={{
          width: diameter,
          height: diameter,
          // Solo la textura que de verdad cargó; si ninguna carga, el círculo queda liso
          backgroundImage: textureUrl ? `url(${textureUrl})` : undefined,
          backgroundSize: "auto 100%",
          backgroundPosition: `${posterOffset}px center`,
          boxShadow: "inset -24px -12px 60px rgb(0 0 0 / 0.65)",
        }}
      />
      {width > 0 && textureUrl !== undefined && (
        <div
          className={`absolute inset-0 transition-opacity duration-300 ease-out-strong ${
            ready ? "opacity-100" : "opacity-0"
          }`}
        >
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
            ringsData={rings}
            ringLat="lat"
            ringLng="lng"
            ringColor={() => ringFade}
            ringMaxRadius={4.5}
            ringPropagationSpeed={2.2}
            ringRepeatPeriod={1400}
            onGlobeReady={handleReady}
          />
        </div>
      )}
    </div>
  );
}
