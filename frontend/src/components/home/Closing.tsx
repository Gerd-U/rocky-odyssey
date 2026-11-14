import { Link } from "react-router-dom";
import Reveal from "../ui/Reveal";

export default function Closing() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-10 lg:py-16">
      <Reveal className="rounded-3xl bg-panel p-10 text-center ring-1 ring-white/5 md:p-16">
        <h2 className="text-3xl font-bold text-white">Antes de pisar otro mundo, lo ensayamos en este</h2>
        <p className="mx-auto mt-4 max-w-xl text-slate-300">
          Revisa todas las ubicaciones análogas y compara sus condiciones con las bases propuestas.
        </p>
        <Link
          to="/ubicaciones"
          className="mt-8 inline-block rounded-full bg-accent px-6 py-3 text-sm font-semibold text-space"
        >
          Ver todas las ubicaciones
        </Link>
      </Reveal>
    </section>
  );
}
