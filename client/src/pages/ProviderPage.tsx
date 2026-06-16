import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type Category, type ProviderDetail } from "../api";
import { useNeighborhood } from "../neighborhood";
import { useAuth } from "../auth";
import { NeighborBadge, Spinner, Stars, VerifiedBadge } from "../components/ui";
import RecommendForm from "../components/RecommendForm";

export default function ProviderPage() {
  const { id } = useParams();
  const { active } = useNeighborhood();
  const { user } = useAuth();
  const [provider, setProvider] = useState<ProviderDetail | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  function load() {
    if (!id) return;
    setLoading(true);
    const q = active ? `?neighborhoodId=${active.id}` : "";
    api
      .get<{ provider: ProviderDetail }>(`/providers/${id}${q}`)
      .then((r) => setProvider(r.data.provider))
      .finally(() => setLoading(false));
  }

  useEffect(load, [id, active]);
  useEffect(() => {
    api.get<{ categories: Category[] }>("/geo/categories").then((r) => setCategories(r.data.categories));
  }, []);

  async function toggleBookmark() {
    if (!user || !id) return;
    const r = await api.post<{ bookmarked: boolean }>(`/recommendations/bookmarks/${id}`);
    setBookmarked(r.data.bookmarked);
  }

  if (loading) return <Spinner />;
  if (!provider) return <p className="text-slate-500">Provider not found.</p>;

  const priceQuotes = provider.recommendations
    .filter((r) => r.pricePaid)
    .map((r) => r.pricePaid);

  return (
    <div className="space-y-6">
      <Link to="/directory" className="text-sm font-semibold text-brand-700 hover:underline">
        ← Back to directory
      </Link>

      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{provider.name}</h1>
              {provider.verified && <VerifiedBadge />}
            </div>
            {provider.serviceArea && (
              <p className="mt-1 text-sm text-slate-500">📍 {provider.serviceArea}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Stars rating={provider.stats.avgRating} size="lg" />
              <NeighborBadge count={provider.stats.neighborCount} />
              {active && provider.scopedStats.neighborCount > 0 && (
                <span className="badge bg-amber-100 text-amber-800">
                  ⭐ {provider.scopedStats.neighborCount} in {active.name}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {user && (
              <button className="btn-secondary" onClick={toggleBookmark}>
                {bookmarked ? "★ Saved" : "☆ Save"}
              </button>
            )}
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              + Recommend
            </button>
          </div>
        </div>

        {provider.description && (
          <p className="mt-4 text-slate-600">{provider.description}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-1.5">
          {provider.categories.map((c) => (
            <span key={c.id} className="badge bg-slate-100 text-slate-600">
              {c.icon} {c.name}
            </span>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-sm">
          {provider.phone && (
            <a href={`tel:${provider.phone}`} className="text-brand-700 hover:underline">
              📞 {provider.phone}
            </a>
          )}
          {provider.website && (
            <a
              href={`https://${provider.website.replace(/^https?:\/\//, "")}`}
              target="_blank"
              rel="noreferrer"
              className="text-brand-700 hover:underline"
            >
              🔗 {provider.website}
            </a>
          )}
          {provider.email && (
            <a href={`mailto:${provider.email}`} className="text-brand-700 hover:underline">
              ✉️ {provider.email}
            </a>
          )}
        </div>
      </div>

      {priceQuotes.length > 0 && (
        <div className="card p-5">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">
            Price check from neighbors
          </h2>
          <div className="flex flex-wrap gap-2">
            {priceQuotes.map((q, i) => (
              <span key={i} className="badge bg-brand-50 text-brand-800">
                💵 {q}
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-xl font-bold text-slate-900">
          Neighbor reviews ({provider.recommendations.length})
        </h2>
        <div className="space-y-3">
          {provider.recommendations.length === 0 && (
            <p className="text-sm text-slate-500">No reviews yet.</p>
          )}
          {provider.recommendations.map((r) => (
            <div key={r.id} className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">{r.author}</span>
                  <span className="text-xs text-slate-400">· {r.neighborhood}</span>
                </div>
                <Stars rating={r.rating} />
              </div>
              <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                <span className="badge bg-slate-100 text-slate-600">{r.category.name}</span>
                {r.timesUsed && <span>Used {r.timesUsed}×</span>}
                {r.pricePaid && <span className="font-medium text-brand-700">{r.pricePaid}</span>}
                {r.groupInterest && (
                  <span className="badge bg-amber-100 text-amber-800">
                    Open to group deal{r.groupTargetDate ? ` · ${r.groupTargetDate}` : ""}
                  </span>
                )}
              </div>
              {r.comment && <p className="mt-2 text-sm text-slate-600">{r.comment}</p>}
            </div>
          ))}
        </div>
      </div>

      <RecommendForm
        open={showForm}
        onClose={() => setShowForm(false)}
        categories={categories}
        defaultProviderId={provider.id}
        defaultProviderName={provider.name}
        defaultCategory={provider.categories[0]?.slug}
        canSubmit={!!user}
        onSubmitted={() => {
          setShowForm(false);
          load();
        }}
      />
    </div>
  );
}
