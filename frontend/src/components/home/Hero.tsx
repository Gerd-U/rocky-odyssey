import { Link } from "react-router-dom";
import Reveal from "../ui/Reveal";

export default function Hero() {
  return (
    <section className="mx-auto flex min-h-[80vh] max-w-6xl flex-col justify-center px-6 py-24">
      <Reveal>
        <p className="text-sm uppercase tracking-[0.3em] text-accent">NASA Space Apps Challenge</p>
        <h1 className="mt-4 max-w-3xl text-5xl font-bold leading-tight text-white md:text-6xl">
          La Luna y Marte, aquí en la Tierra
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-slate-300">
          Buscamos lugares de la Tierra que se parecen a las zonas candidatas para bases permanentes en la Luna y
          Marte, para entrenar tripulaciones y probar tecnología antes de salir del planeta.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <a href="#globo" className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-space">
            Explorar el globo
          </a>
          <Link
            to="/ubicaciones"
            className="rounded-full px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/20"
          >
            Ver ubicaciones
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
