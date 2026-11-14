import { useMode } from "../../context/ModeContext";
import { BODY_NAME } from "../../lib/format";
import { MODE_DIRECTION } from "../../lib/motion";
import type { Target } from "../../types/site";
import ModeToggle from "../globe/ModeToggle";
import { ButtonLink } from "../ui/Button";
import Swap from "../ui/Swap";

const HEADLINE: Record<Target, string> = {
  mars: "Marte empieza en la Tierra",
  moon: "La Luna empieza en la Tierra",
};

export default function Hero() {
  const { mode } = useMode();

  return (
    <section
      aria-labelledby="hero-title"
      className="mx-auto grid max-w-6xl gap-8 px-6 pt-12 pb-10 lg:pt-16 lg:pb-16 lg:grid-cols-[1.4fr_1fr] lg:items-end lg:gap-16"
    >
      <h1
        id="hero-title"
        className="max-w-[14ch] text-[clamp(2.75rem,5.5vw,5.5rem)] leading-[0.92] font-extrabold tracking-[-0.03em] font-stretch-[75%] text-ink"
      >
        <Swap as="span" swapKey={mode} direction={MODE_DIRECTION[mode]}>
          {HEADLINE[mode]}
        </Swap>
      </h1>

      <div>
        <ModeToggle />
        <Swap swapKey={mode} direction={MODE_DIRECTION[mode]} delay={0.06}>
          <p className="mt-6 text-lg text-ink">
            Buscamos lugares de la Tierra que se parecen a las bases propuestas en {BODY_NAME[mode]}. Ahí se entrenan
            tripulaciones y se prueba tecnología antes de salir del planeta.
          </p>
        </Swap>
        <ButtonLink to="/ubicaciones" variant="secondary" size="sm" className="mt-6">
          Ver todas las ubicaciones →
        </ButtonLink>
      </div>
    </section>
  );
}
