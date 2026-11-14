import { motion, useReducedMotion } from "motion/react";
import { useId, useRef, type KeyboardEvent } from "react";
import { useMode } from "../../context/ModeContext";
import { BODY_LABEL } from "../../lib/format";
import type { Target } from "../../types/site";

const OPTIONS: Target[] = ["moon", "mars"];

export default function ModeToggle() {
  const { mode, setMode } = useMode();
  const indicatorId = useId();
  const reduceMotion = useReducedMotion();
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
    e.preventDefault();
    const current = OPTIONS.indexOf(mode);
    const step = e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1;
    const nextIndex = (current + step + OPTIONS.length) % OPTIONS.length;
    setMode(OPTIONS[nextIndex]);
    buttonsRef.current[nextIndex]?.focus();
  };

  return (
    <div role="radiogroup" aria-label="Destino" onKeyDown={onKeyDown} className="inline-flex bg-night-800 p-1">
      {OPTIONS.map((value, i) => {
        const active = mode === value;
        return (
          <button
            key={value}
            ref={(el) => {
              buttonsRef.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => setMode(value)}
            className={`relative h-10 px-6 text-sm font-semibold transition-colors duration-200 active:scale-[0.97] ${
              active ? "text-ink" : "text-ink-soft hover:text-ink"
            }`}
          >
            {active && (
              <motion.span
                layoutId={indicatorId}
                className="absolute inset-0 bg-accent"
                transition={reduceMotion ? { duration: 0 } : { type: "spring", duration: 0.35, bounce: 0 }}
              />
            )}
            <span className="relative">{BODY_LABEL[value]}</span>
          </button>
        );
      })}
    </div>
  );
}
