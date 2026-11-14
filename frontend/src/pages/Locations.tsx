import { useMemo, useState } from "react";
import FilterBar, { type Filters } from "../components/sites/FilterBar";
import SiteCard from "../components/sites/SiteCard";
import { useSites } from "../hooks/useSites";

const INITIAL_FILTERS: Filters = { query: "", target: "all", sort: "similarity" };

export default function Locations() {
  const { data: sites, loading, error } = useSites();
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);

  const results = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return (sites ?? [])
      .filter((s) => filters.target === "all" || s.target === filters.target)
      .filter((s) => !q || `${s.name} ${s.country}`.toLowerCase().includes(q))
      .sort((a, b) =>
        filters.sort === "name" ? a.name.localeCompare(b.name, "es") : b.similarity - a.similarity,
      );
  }, [sites, filters]);

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-4xl font-bold text-white">Ubicaciones análogas</h1>
      <p className="mt-2 text-slate-400">Lugares de la Tierra que se parecen a las bases propuestas en la Luna y Marte.</p>

      <div className="mt-8">
        <FilterBar value={filters} onChange={setFilters} />
      </div>

      {loading && <p className="mt-10 text-slate-400">Cargando ubicaciones...</p>}
      {error && <p className="mt-10 text-red-400">No se pudieron cargar las ubicaciones: {error}</p>}
      {!loading && !error && results.length === 0 && (
        <p className="mt-10 text-slate-400">No hay ubicaciones que coincidan con el filtro.</p>
      )}

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((site) => (
          <SiteCard key={site.id} site={site} />
        ))}
      </div>
    </section>
  );
}
