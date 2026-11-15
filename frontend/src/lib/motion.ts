import type { Variants } from "motion/react";
import type { Target } from "../types/site";

export const SWAP_EASE = [0.23, 1, 0.32, 1] as const;

export const SWAP_ENTER_S = 0.34;
export const SWAP_EXIT_S = 0.16;

/** Luna está a la izquierda del selector y Marte a la derecha: el contenido entra desde ese lado. */
export const MODE_DIRECTION: Record<Target, 1 | -1> = {
  moon: -1,
  mars: 1,
};

export interface SwapCustom {
  direction: number;
  delay: number;
  reduce: boolean;
  /** Desenfoque al cambiar. En titulares grandes se apaga: filtrar mucho texto a la vez es caro */
  blur: boolean;
}

const SHIFT_X = 16;
const SHIFT_Y = 8;

export const swapVariants: Variants = {
  enter: ({ direction, reduce, blur }: SwapCustom) =>
    reduce
      ? { opacity: 0 }
      : {
          opacity: 0,
          ...(blur && { filter: "blur(4px)" }),
          transform: direction ? `translate(${direction * SHIFT_X}px, 0px)` : `translate(0px, ${SHIFT_Y}px)`,
        },
  center: ({ delay, reduce, blur }: SwapCustom) => ({
    opacity: 1,
    ...(blur && { filter: "blur(0px)" }),
    transform: "translate(0px, 0px)",
    transition: { duration: reduce ? 0.15 : SWAP_ENTER_S, delay: reduce ? 0 : delay, ease: SWAP_EASE },
  }),
  exit: ({ direction, reduce, blur }: SwapCustom) =>
    reduce
      ? { opacity: 0, transition: { duration: 0.1 } }
      : {
          opacity: 0,
          ...(blur && { filter: "blur(3px)" }),
          transform: direction ? `translate(${-direction * SHIFT_X}px, 0px)` : `translate(0px, ${-SHIFT_Y / 2}px)`,
          transition: { duration: SWAP_EXIT_S, ease: SWAP_EASE },
        },
};
