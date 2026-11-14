import { useEffect, useMemo } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import Footer from "./components/layout/Footer";
import Navbar from "./components/layout/Navbar";
import { ModeProvider } from "./context/ModeContext";
import Home from "./pages/Home";
import LocationDetail from "./pages/LocationDetail";
import Locations from "./pages/Locations";

/** Fondo de estrellas fijo detrás de todo el contenido */
function Starfield() {
  const stars = useMemo(
    () =>
      Array.from({ length: 80 }, (_, i) => ({
        // pseudoaleatorio pero estable entre renders
        top: (i * 37.3) % 100,
        left: (i * 61.7) % 100,
        size: i % 7 === 0 ? 2 : 1,
        delay: (i % 10) * 0.3,
      })),
    [],
  );

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute animate-twinkle rounded-full bg-white"
          style={{ top: `${s.top}%`, left: `${s.left}%`, width: s.size, height: s.size, animationDelay: `${s.delay}s` }}
        />
      ))}
    </div>
  );
}

function Pages() {
  const { pathname, hash, key } = useLocation();
  const onHome = pathname === "/";

  useEffect(() => {
    const target = hash ? document.getElementById(hash.slice(1)) : null;
    if (target) target.scrollIntoView({ behavior: "smooth" });
    else window.scrollTo(0, 0);
  }, [pathname, hash, key]);

  return (
    <main className="flex-1">
      <div hidden={!onHome}>
        <Home />
      </div>
      <Routes>
        <Route path="/" element={null} />
        <Route path="/ubicaciones" element={<Locations />} />
        <Route path="/ubicacion/:id" element={<LocationDetail />} />
      </Routes>
    </main>
  );
}

export default function App() {
  return (
    <ModeProvider>
      <BrowserRouter>
        <Starfield />
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <Pages />
          <Footer />
        </div>
      </BrowserRouter>
    </ModeProvider>
  );
}
