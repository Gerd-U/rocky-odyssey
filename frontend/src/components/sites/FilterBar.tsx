import { motion, useReducedMotion } from "motion/react";
import { useId, useRef, type KeyboardEvent } from "react";
import type { Target } from "../../types/site";

export type TargetFilter = Target | "all";
export type SortKey = "similarity" | "name";

export interface Filters {
  query: string;
  target: TargetFilter;
  sort: SortKey;
}

interface FilterBarProps {
  value: Filters;
  onChange: (next: Filters) => void;
}

const TARGET_OPTIONS: { value: TargetFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "moon", label: "Luna" },
  { value: "mars", label: "Marte" },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "similarity", label: "Más similares" },
  { value: "name", label: "A–Z" },
];

interface ChipGroupProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** Grupo de opciones excluyentes en píldora, con indicador que se desliza y flechas del teclado. */
function ChipGroup<T extends string>({ label, options, value, onChange }: ChipGroupProps<T>) {
  const indicatorId = useId();
  const reduceMotion = useReducedMotion();
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const current = options.findIndex((o) => o.value === value);
    const next = (current + step + options.length) % options.length;
    onChange(options[next].value);
    buttonsRef.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className="inline-flex rounded-full bg-night-800 p-1 ring-1 ring-ink/10"
    >
      {options.map((option, i) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              buttonsRef.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={`relative h-9 rounded-full px-4 text-sm font-semibold transition-colors duration-200 active:scale-[0.97] ${
              active ? "text-ink" : "text-ink-soft hover:text-ink"
            }`}
          >
            {active && (
              <motion.span
                layoutId={indicatorId}
                className="absolute inset-0 rounded-full bg-accent"
                transition={reduceMotion ? { duration: 0 } : { type: "spring", duration: 0.35, bounce: 0 }}
              />
            )}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function FilterBar({ value, onChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="relative min-w-60 flex-1">
        <span className="sr-only">Buscar por nombre o país</span>
        <svg
          viewBox="0 0 20 20"
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 fill-none stroke-ink-soft stroke-[1.75]"
        >
          <circle cx="9" cy="9" r="5.5" />
          <path d="m13.2 13.2 3.3 3.3" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          placeholder="Buscar por nombre o país"
          value={value.query}
          onChange={(e) => onChange({ ...value, query: e.target.value })}
          className="h-11 w-full rounded-full bg-ink/10 pr-4 pl-11 text-sm text-ink placeholder:text-ink-soft transition-colors duration-200 hover:bg-ink/15 focus:bg-ink/15 focus:outline-none focus-visible:outline-2 focus-visible:outline-accent-soft"
        />
      </label>
      <ChipGroup
        label="Destino"
        options={TARGET_OPTIONS}
        value={value.target}
        onChange={(target) => onChange({ ...value, target })}
      />
      <ChipGroup label="Ordenar" options={SORT_OPTIONS} value={value.sort} onChange={(sort) => onChange({ ...value, sort })} />
    </div>
  );
}
