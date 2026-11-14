import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { swapVariants, type SwapCustom } from "../../lib/motion";

interface SwapProps {
  swapKey: string;
  /** -1 entra desde la izquierda, 1 desde la derecha, 0 desde abajo */
  direction?: number;
  delay?: number;
  className?: string;
  children: ReactNode;
}

export default function Swap({ swapKey, direction = 0, delay = 0, className = "", children }: SwapProps) {
  const reduce = useReducedMotion() ?? false;
  const custom: SwapCustom = { direction, delay, reduce };

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence mode="popLayout" initial={false} custom={custom}>
        <motion.div
          key={swapKey}
          custom={custom}
          variants={swapVariants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
