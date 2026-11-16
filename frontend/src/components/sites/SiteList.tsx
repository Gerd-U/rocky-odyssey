import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { useMode } from "../../context/ModeContext";
import type { Pair } from "../../hooks/usePairs";
import { formatPercent } from "../../lib/format";
import { SWAP_EASE } from "../../lib/motion";
import { SIMILARITY_LEVELS, similarityLevel } from "../../lib/similarity";
import { LEVEL_COLOR } from "../globe/colors";

interface SiteListProps {
  pairs: Pair[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

function Dot({ color }: { color: string }) {
  return <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: color }} />;
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 12 12"
      className={`size-3 shrink-0 text-ink-soft transition-transform duration-200 ease-out ${open ? "rotate-180" : ""}`}
    >
      <path d="M2 4.5 6 8.5 10 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function Arrow({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg aria-hidden viewBox="0 0 12 12" className="size-3">
      <path d={dir === "prev" ? "M7.5 2 3.5 6 7.5 10" : "M4.5 2 8.5 6 4.5 10"} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function Check({ visible }: { visible: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 12 12" className={`size-3 shrink-0 text-accent-soft ${visible ? "" : "invisible"}`}>
      <path d="M2.5 6.5 5 9 9.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/**
 * Selector de sitio entre los dos globos: un botón con el sitio elegido y un panel con todos,
 * agrupados por nivel de similitud (patrón listbox de WAI-ARIA). Cerrado ocupa una sola línea,
 * para que los globos sean lo principal de la sección.
 */
export default function SiteList({ pairs, selectedId, onSelect, className = "" }: SiteListProps) {
  const { t } = useTranslation();
  const { mode } = useMode();
  const reduce = useReducedMotion();
  const baseId = useId();
  const labelId = `${baseId}-label`;
  const buttonId = `${baseId}-button`;
  const listId = `${baseId}-list`;
  const optionId = (id: string) => `${baseId}-opt-${id}`;

  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(selectedId);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const groups = SIMILARITY_LEVELS.map((level) => ({
    level,
    pairs: pairs.filter(({ site }) => similarityLevel(site.similarity).id === level.id),
  })).filter((group) => group.pairs.length > 0);
  // Orden en pantalla (por grupo), el que siguen las flechas
  const ordered = groups.flatMap((group) => group.pairs);
  const colorOf = (similarity: number) => LEVEL_COLOR[mode][similarityLevel(similarity).id];
  const selected = ordered.find(({ site }) => site.id === selectedId) ?? null;
  const selectedIndex = ordered.findIndex(({ site }) => site.id === selectedId);

  // Flechas: mismo orden que el menú; del último se vuelve al primero
  const step = (delta: number) => {
    if (ordered.length === 0) return;
    const next = (selectedIndex + delta + ordered.length) % ordered.length;
    onSelect(ordered[next].site.id);
  };

  const openList = () => {
    setActiveId(selectedId ?? ordered[0]?.site.id ?? null);
    setOpen(true);
  };

  const close = (focusButton = true) => {
    setOpen(false);
    if (focusButton) buttonRef.current?.focus();
  };

  const choose = (id: string) => {
    onSelect(id);
    close();
  };

  // Al abrir, el foco pasa al panel para que funcionen las flechas
  useEffect(() => {
    if (open) listRef.current?.focus({ preventScroll: true });
  }, [open]);

  // La opción activa siempre a la vista si el panel tiene scroll
  useEffect(() => {
    if (open && activeId) document.getElementById(`${baseId}-opt-${activeId}`)?.scrollIntoView({ block: "nearest" });
  }, [open, activeId, baseId]);

  // Clic fuera: cerrar sin robar el foco a lo que se haya pulsado
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const onButtonKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      openList();
    }
  };

  const onListKeyDown = (e: KeyboardEvent) => {
    const index = ordered.findIndex(({ site }) => site.id === activeId);
    const moveTo = (i: number) => setActiveId(ordered[Math.max(0, Math.min(ordered.length - 1, i))]?.site.id ?? null);

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        moveTo(index + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        moveTo(index - 1);
        break;
      case "Home":
        e.preventDefault();
        moveTo(0);
        break;
      case "End":
        e.preventDefault();
        moveTo(ordered.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (activeId) choose(activeId);
        break;
      case "Escape":
        e.preventDefault();
        close();
        break;
      case "Tab":
        close(false);
        break;
      default:
        // Una letra salta al siguiente sitio que empiece por ella
        if (e.key.length === 1 && /\S/.test(e.key)) {
          const key = e.key.toLocaleLowerCase();
          const rotated = [...ordered.slice(index + 1), ...ordered.slice(0, index + 1)];
          const match = rotated.find(({ site }) => site.name.toLocaleLowerCase().startsWith(key));
          if (match) setActiveId(match.site.id);
        }
    }
  };

  return (
    <div ref={rootRef} className={className}>
      <span id={labelId} className="mb-2 block text-sm text-ink-soft">
        {t("home.globe.listLabel")}
      </span>

      <div className="relative">
        <button
          ref={buttonRef}
          id={buttonId}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-labelledby={`${labelId} ${buttonId}`}
          onClick={() => (open ? close() : openList())}
          onKeyDown={onButtonKeyDown}
          className="flex w-full items-center gap-3 bg-night-800 px-4 py-3 text-left text-sm transition-transform duration-150 ease-out active:scale-[0.98]"
        >
          {selected && <Dot color={colorOf(selected.site.similarity)} />}
          <span className="min-w-0 grow truncate font-semibold text-ink">{selected?.site.name}</span>
          {selected && <span className="shrink-0 tabular-nums text-ink-soft">{formatPercent(selected.site.similarity)}</span>}
          <Chevron open={open} />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              ref={listRef}
              id={listId}
              role="listbox"
              tabIndex={-1}
              aria-labelledby={labelId}
              aria-activedescendant={activeId ? optionId(activeId) : undefined}
              onKeyDown={onListKeyDown}
              initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "scale(0.97)" }}
              animate={{ opacity: 1, transform: "scale(1)" }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, transform: "scale(0.97)", transition: { duration: 0.12 } }}
              transition={{ duration: 0.16, ease: SWAP_EASE }}
              // Barra de scroll fina y del color de la web, no la clara del navegador
              style={{ transformOrigin: "top", scrollbarWidth: "thin", scrollbarColor: "var(--color-night-800) transparent" }}
              className="absolute inset-x-0 top-full z-20 mt-1 max-h-[min(24rem,60vh)] overflow-y-auto bg-night-900 py-2 shadow-[0_12px_32px_-8px_rgb(0_0_0/0.55)] outline-none"
            >
              {groups.map(({ level, pairs: groupPairs }) => {
                const groupLabelId = `${baseId}-group-${level.id}`;
                return (
                  <div key={level.id} role="group" aria-labelledby={groupLabelId} className="py-1">
                    <div id={groupLabelId} className="px-4 pt-1 pb-1 text-xs text-ink-soft">
                      {t(`home.globe.legendLevel.${level.id}`)}
                    </div>
                    {groupPairs.map(({ site }) => {
                      const isSelected = site.id === selectedId;
                      const isActive = site.id === activeId;
                      return (
                        <div
                          key={site.id}
                          id={optionId(site.id)}
                          role="option"
                          aria-selected={isSelected}
                          onPointerMove={() => setActiveId(site.id)}
                          onClick={() => choose(site.id)}
                          className={`flex cursor-pointer items-center gap-3 px-4 py-2 text-sm ${
                            isActive ? "bg-night-800 text-ink" : "text-ink-soft"
                          }`}
                        >
                          <Dot color={colorOf(site.similarity)} />
                          <span className={`min-w-0 grow ${isSelected ? "font-semibold text-ink" : ""}`}>{site.name}</span>
                          <span className="shrink-0 tabular-nums">{formatPercent(site.similarity)}</span>
                          <Check visible={isSelected} />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {ordered.length > 1 && (
        <div className="mt-2 flex items-center justify-between text-sm text-ink-soft">
          <button
            type="button"
            aria-label={t("home.globe.prev")}
            onClick={() => step(-1)}
            className="grid size-9 place-items-center transition-[color,transform] duration-150 ease-out hover:text-ink active:scale-[0.97]"
          >
            <Arrow dir="prev" />
          </button>
          <span aria-live="polite" className="tabular-nums">
            {t("home.globe.position", { index: selectedIndex + 1, total: ordered.length })}
          </span>
          <button
            type="button"
            aria-label={t("home.globe.next")}
            onClick={() => step(1)}
            className="grid size-9 place-items-center transition-[color,transform] duration-150 ease-out hover:text-ink active:scale-[0.97]"
          >
            <Arrow dir="next" />
          </button>
        </div>
      )}
    </div>
  );
}
