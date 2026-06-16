import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Category, type Deal, type NeighborhoodStats, type Provider } from "../api";
import { useNeighborhood } from "../neighborhood";
import { useAuth } from "../auth";
import { NeighborBadge, ProgressBar, Spinner, Stars, StatusPill } from "../components/ui";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-4">
      <div className="text-2xl font-extrabold text-brand-700">{value}</div>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}

export default function HomePage() {
  const { active } = useNeighborhood();
  const { user } = useAuth();
  const [stats, setStats] = useState<NeighborhoodStats | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!active) return;
    setLoading(true);
    Promise.all([
      api.get<{ stats: NeighborhoodStats }>(`/stats/neighborhood/${active.id}`),
      api.get<{ categories: Category[] }>("/geo/categories"),
      api.get<{ providers: Provider[] }>(
        `/providers?neighborhoodId=${active.id}&scope=neighborhood`
      ),
      api.get<{ deals: Deal[] }>(`/deals?neighborhoodId=${active.id}`),
    ])
      .then(([s, c, p, d]) => {
        setStats(s.data.stats);
        setCategories(c.data.categories);
        setProviders(p.data.providers.slice(0, 4));
        setDeals(d.data.deals.filter((x) => x.status !== "cancelled").slice(0, 3));
      })
      .finally(() => setLoading(false));
  }, [active]);

  if (!active || loading) return <Spinner />;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-8 text-white shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-100">
          {active.path}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
          Who do your neighbors actually trust?
        </h1>
        <p className="mt-3 max-w-2xl text-brand-50">
          {active.name}'s home services hub. See providers neighbors really use, share what you
          paid, and team up on group deals for recurring jobs like gutter cleaning.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/directory" className="btn bg-white text-brand-700 hover:bg-brand-50">
            Browse trusted providers
          </Link>
          <Link
            to="/deals"
            className="btn border border-white/40 bg-white/10 text-white hover:bg-white/20"
          >
            See group deals
          </Link>
          {!user && (
            <Link
              to="/register"
              className="btn border border-white/40 bg-white/10 text-white hover:bg-white/20"
            >
              Join your neighborhood
            </Link>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Homes" value={stats?.homeCount ?? 0} />
        <StatCard label="Neighbors" value={stats?.residents ?? 0} />
        <StatCard label="Providers" value={stats?.providers ?? 0} />
        <StatCard label="Recommendations" value={stats?.recommendations ?? 0} />
        <StatCard label="Active deals" value={stats?.activeDeals ?? 0} />
        <StatCard label="Saved so far" value={`$${stats?.realizedSavings ?? 0}`} />
      </section>

      {/* Categories */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Browse by service</h2>
          <Link to="/directory" className="text-sm font-semibold text-brand-700 hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/directory?category=${c.slug}`}
              className="card flex items-center gap-3 p-4 transition hover:border-brand-300 hover:shadow-md"
            >
              <span className="text-2xl">{c.icon}</span>
              <span className="font-semibold text-slate-700">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Top providers + deals */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Top in {active.name}</h2>
            <Link to="/directory" className="text-sm font-semibold text-brand-700 hover:underline">
              All →
            </Link>
          </div>
          <div className="space-y-3">
            {providers.length === 0 && (
              <p className="text-sm text-slate-500">No recommendations here yet — be the first!</p>
            )}
            {providers.map((p) => (
              <Link
                key={p.id}
                to={`/providers/${p.id}`}
                className="card flex items-center justify-between gap-3 p-4 hover:border-brand-300"
              >
                <div>
                  <p className="font-semibold text-slate-800">{p.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Stars rating={p.stats.avgRating} />
                    <NeighborBadge count={p.stats.neighborCount} />
                  </div>
                </div>
                <span className="text-slate-300">›</span>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Group deals</h2>
            <Link to="/deals" className="text-sm font-semibold text-brand-700 hover:underline">
              All →
            </Link>
          </div>
          <div className="space-y-3">
            {deals.length === 0 && (
              <p className="text-sm text-slate-500">No active deals — start one for your street.</p>
            )}
            {deals.map((d) => (
              <Link
                key={d.id}
                to={`/deals/${d.id}`}
                className="card block p-4 hover:border-brand-300"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-slate-800">
                    {d.category?.icon} {d.title}
                  </p>
                  <StatusPill status={d.status} />
                </div>
                <div className="mt-3">
                  <ProgressBar value={d.progress} />
                  <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {d.committedHomes}/{d.minHomes} homes committed
                    </span>
                    {d.savingsPerHome != null && (
                      <span className="font-semibold text-brand-700">
                        Save ${d.savingsPerHome}/home
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
