import type { Pair } from "../hooks/usePairs";

/**
 * Orden del selector de sitios: de más a menos parecido, pero sin dos sitios seguidos con la
 * misma base, tampoco al pasar del último al primero. Así, al ir de un sitio al siguiente, los
 * dos globos siempre tienen que girar (el de la Tierra ya gira porque cada sitio está en otro
 * lugar; el del destino gira porque la base cambia).
 *
 * Búsqueda en profundidad que prueba primero los sitios más parecidos; con 13 sitios es
 * inmediata. Se poda con la condición de que lo que queda pueda colocarse sin repetir base.
 * Si no hay forma (p. ej. todos con la misma base), devuelve el orden por similitud.
 */
export function rotatingOrder(pairs: Pair[]): Pair[] {
  const sorted = [...pairs].sort((a, b) => b.site.similarity - a.site.similarity);
  const n = sorted.length;
  if (n < 3) return sorted;

  const remaining = new Map<string, number>();
  for (const { base } of sorted) remaining.set(base.id, (remaining.get(base.id) ?? 0) + 1);

  // Con `left` sitios por colocar y la última base usada `prev`: ninguna base puede ocupar más
  // de la mitad (redondeando hacia arriba), y `prev` no puede ir la primera
  const feasible = (prev: string, left: number) => {
    for (const [baseId, count] of remaining) {
      if (count > Math.ceil(left / 2)) return false;
      if (baseId === prev && count > Math.floor(left / 2)) return false;
    }
    return true;
  };

  const used = new Array<boolean>(n).fill(false);
  const out: Pair[] = [];

  const place = (): boolean => {
    if (out.length === n) return out[0].base.id !== out[n - 1].base.id;
    const prev = out.at(-1)?.base.id;
    for (let i = 0; i < n; i++) {
      const baseId = sorted[i].base.id;
      if (used[i] || baseId === prev) continue;
      used[i] = true;
      out.push(sorted[i]);
      remaining.set(baseId, (remaining.get(baseId) ?? 0) - 1);
      if (feasible(baseId, n - out.length) && place()) return true;
      remaining.set(baseId, (remaining.get(baseId) ?? 0) + 1);
      out.pop();
      used[i] = false;
    }
    return false;
  };

  return place() ? out : sorted;
}
