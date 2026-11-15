import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "motion/react";
import type { ReactNode, Ref } from "react";
import { swapVariants, type SwapCustom } from "../../lib/motion";

interface SwapProps {
  swapKey: string;
  /** -1 entra desde la izquierda, 1 desde la derecha, 0 desde abajo */
  direction?: number;
  delay?: number;
  /** "span" para usarlo dentro de un titular o un párrafo */
  as?: "div" | "span";
  /** false en titulares grandes: solo fundido y desplazamiento */
  blur?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * La copia que está saliendo se oculta a lectores de pantalla y al foco,
 * para que durante la transición no haya dos textos (ni dos ids) activos a la vez.
 */
interface SwapItemProps {
  as: "div" | "span";
  custom: SwapCustom;
  children: ReactNode;
  /** popLayout mide la copia que sale a través de esta ref */
  ref?: Ref<HTMLElement>;
}

function SwapItem({ as, custom, children, ref }: SwapItemProps) {
  const present = useIsPresent();
  const Item = as === "span" ? motion.span : motion.div;

  return (
    <Item
      ref={ref as Ref<HTMLDivElement & HTMLSpanElement>}
      custom={custom}
      variants={swapVariants}
      initial="enter"
      animate="center"
      exit="exit"
      aria-hidden={present ? undefined : true}
      inert={!present}
      className={as === "span" ? "block" : undefined}
    >
      {children}
    </Item>
  );
}

export default function Swap({
  swapKey,
  direction = 0,
  delay = 0,
  as = "div",
  blur = true,
  className = "",
  children,
}: SwapProps) {
  const reduce = useReducedMotion() ?? false;
  const custom: SwapCustom = { direction, delay, reduce, blur };
  const Wrapper = as;

  return (
    <Wrapper className={`relative ${as === "span" ? "block" : ""} ${className}`}>
      <AnimatePresence mode="popLayout" initial={false} custom={custom}>
        <SwapItem key={swapKey} as={as} custom={custom}>
          {children}
        </SwapItem>
      </AnimatePresence>
    </Wrapper>
  );
}
