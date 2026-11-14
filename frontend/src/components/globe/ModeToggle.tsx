import { motion } from "motion/react";
import { useMode } from "../../context/ModeContext";
import type { Target } from "../../types/site";

const OPTIONS: { value: Target; label: string }[] = [
  { value: "moon", label: "Luna" },
  { value: "mars", label: "Marte" },
];

export default function ModeToggle() {
  const { mode, setMode } = useMode();

  return (
    <div role="radiogroup" aria-label="Destino" className="inline-flex rounded-full bg-panel p-1 ring-1 ring-white/10">
      {OPTIONS.map((opt) => {
        const active = mode === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setMode(opt.value)}
            className={`relative rounded-full px-5 py-1.5 text-sm font-medium transition-colors ${
              active ? "text-space" : "text-slate-300 hover:text-white"
            }`}
          >
            {active && (
              <motion.span
                layoutId="mode-indicator"
                className="absolute inset-0 rounded-full bg-accent"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
