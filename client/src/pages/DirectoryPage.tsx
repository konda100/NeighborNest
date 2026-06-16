import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, type Category, type Provider } from "../api";
import { useNeighborhood } from "../neighborhood";
import { useAuth } from "../auth";
import {
  EmptyState,
  NeighborBadge,
  Spinner,
  Stars,
  VerifiedBadge,
} from "../components/ui";
import RecommendForm from "../components/RecommendForm";

const SCOPES = [
  { key: "neighborhood", label: "My neighborhood" },
  { key: "city", label: "City" },
  { key: "county", label: "County" },
  { key: "all", label: "Everywhere" },
];

export default function DirectoryPage() {
  const { active } = useNeighborhood();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const category = params.get("category") || "";
  const scope = params.get("scope") || "neighborhood";
  const search = params.get("search") || "";

  useEffect(() => {
    api.get<{ categories: Category[] }>("/geo/categories").then((r) => setCategories(r.data.categories));
  }, []);

  function load() {
    if (!active) return;
    setLoading(true);
    const q = new URLSearchParams({ neighborhoodId: active.id, scope });
    if (category) q.set("categorySlug", category);
    if (search) q.set("search", search);
    api
      .get<{ providers: Provider[] }>(`/providers?${q.toString()}`)
      .then((r) => setProviders(r.data.providers))
      .finally(() => setLoading(false));
  }

  useEffect(load, [active, category, scope, search]);

  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Trusted providers</h1>
          <p className="text-sm text-slate-500">
            {scope === "neighborhood"
              ? `Providers neighbors actually use in ${active?.name ?? ""}`
              : "Providers recommended across your area"}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + Add a recommendation
        </button>
      </div>

      {/* Filters */}
      <div className="card space-y-3 p-4">
        <input
          className="input"
          placeholder="Search providers by name…"
          value={search}
          onChange={(e) => update("search", e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <button
            className={`badge ${!category ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600"}`}
            onClick={() => update("category", "")}
          >
            All services
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              className={`badge ${
                category === c.slug ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600"
              }`}
              onClick={() => update("category", c.slug)}
            >
              {c.icon} {c.name}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <span className="text-xs font-semibold uppercase text-slate-400">Scope:</span>
          {SCOPES.map((s) => (
            <button
              key={s.key}
              className={`badge ${
                scope === s.key ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"
              }`}
              onClick={() => update("scope", s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : providers.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No providers found in this scope yet"
          hint="Try widening the scope, or add the first recommendation so your neighbors can find them."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {providers.map((p) => (
            <Link
              key={p.id}
              to={`/providers/${p.id}`}
              className="card flex flex-col gap-3 p-5 transition hover:border-brand-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{p.name}</h3>
                  {p.serviceArea && (
                    <p className="text-xs text-slate-500">📍 {p.serviceArea}</p>
                  )}
                </div>
                {p.verified && <VerifiedBadge />}
              </div>
              {p.description && (
                <p className="line-clamp-2 text-sm text-slate-600">{p.description}</p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {p.categories.map((c) => (
                  <span key={c.id} className="badge bg-slate-100 text-slate-600">
                    {c.icon} {c.name}
                  </span>
                ))}
              </div>
              <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
                <Stars rating={p.stats.avgRating} />
                <NeighborBadge count={p.stats.neighborCount} />
              </div>
            </Link>
          ))}
        </div>
      )}

      <RecommendForm
        open={showForm}
        onClose={() => setShowForm(false)}
        categories={categories}
        defaultCategory={category}
        canSubmit={!!user}
        onSubmitted={() => {
          setShowForm(false);
          load();
        }}
      />
    </div>
  );
}
