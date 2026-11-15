import { useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const SRC_HD = "/video/earth-orbit-1080.mp4"; // 1920 × 1080, 8 MB
const SRC_SD = "/video/earth-orbit-540.mp4"; // 960 × 540, 2,6 MB, para móvil

/**
 * Fondo del hero: la curva de la Tierra vista desde la órbita (vídeo de Pixabay).
 * La curva iluminada cruza la parte de arriba y el espacio negro queda abajo a la izquierda,
 * donde va el texto.
 *
 * Se reproduce una sola vez y se queda en el plano final. Vuelve a empezar al recargar
 * o al volver a la página de inicio desde otra ruta (Home sigue montado aunque esté oculto).
 * Si sale de la pantalla a medio camino se pausa, y sigue al volver. Con movimiento
 * reducido no se reproduce: se muestra directamente el plano final.
 */
export default function EarthLoop({ className = "" }: { className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion() ?? false;
  const { pathname } = useLocation();
  const onHome = pathname === "/";

  // Al entrar en la página de inicio (carga o vuelta desde otra ruta), empieza desde el principio
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !onHome || reduce) return;
    video.currentTime = 0;
  }, [onHome, reduce]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (reduce) {
      video.pause();
      const showLastFrame = () => {
        video.currentTime = Math.max(0, video.duration - 0.05);
      };
      if (video.readyState >= 1) showLastFrame();
      else video.addEventListener("loadedmetadata", showLastFrame, { once: true });
      return () => video.removeEventListener("loadedmetadata", showLastFrame);
    }

    const io = new IntersectionObserver(([entry]) => {
      // Al terminar se queda quieto en el último plano: no se reanuda al volver a verlo
      if (entry.isIntersecting && !video.ended) video.play().catch(() => {});
      else if (!entry.isIntersecting) video.pause();
    });
    io.observe(video);
    return () => io.disconnect();
  }, [reduce]);

  return (
    <video
      ref={videoRef}
      aria-hidden
      muted
      playsInline
      preload="auto"
      // En vertical se ve solo una franja: la de la derecha incluye la curva iluminada arriba y el
      // espacio oscuro abajo, como en escritorio. El negro se funde con el azul de la página (screen).
      className={`object-cover object-[68%_50%] mix-blend-screen lg:object-center ${className}`}
    >
      <source src={SRC_SD} type="video/mp4" media="(max-width: 767px)" />
      <source src={SRC_HD} type="video/mp4" />
    </video>
  );
}
