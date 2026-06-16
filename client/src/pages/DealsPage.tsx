import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Category, type Deal } from "../api";
import { useNeighborhood } from "../neighborhood";
import { useAuth } from "../auth";
import { EmptyState, Modal, ProgressBar, Spinner, StatusPill } from "../components/ui";

function CreateDealForm({
  open,
  onClose,
  categories,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [minHomes, setMinHomes] = useState(6);
  const [soloPrice, setSoloPrice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/deals", {
        title,
        categorySlug,
        description: description || undefined,
        targetDate: targetDate || undefined,
        minHomes,
        soloPrice: soloPrice ? Number(soloPrice) : undefined,
      });
      onCreated();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Could not create deal");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Start a group deal">
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="label">Title *</label>
          <input
            className="input"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Fall 2026 gutter cleaning block deal"
          />
        </div>
        <div>
          <label className="label">Service *</label>
          <select
            className="input"
            required
            value={categorySlug}
            onChange={(e) => setCategorySlug(e.target.value)}
          >
            <option value="">Select…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Description</label>
          <textarea
            className="input"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Target date</label>
            <input
              className="input"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              placeholder="Fall 2026"
            />
          </div>
          <div>
            <label className="label">Min homes</label>
            <input
              type="number"
              min={2}
              className="input"
              value={minHomes}
              onChange={(e) => setMinHomes(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">Solo price $</label>
            <input
              type="number"
              className="input"
              value={soloPrice}
              onChange={(e) => setSoloPrice(e.target.value)}
              placeholder="200"
            />
          </div>
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Creating…" : "Create deal"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function DealsPage() {
  const { active } = useNeighborhood();
  const { user } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  function load() {
    if (!active) return;
    setLoading(true);
    api
      .get<{ deals: Deal[] }>(`/deals?neighborhoodId=${active.id}`)
      .then((r) => setDeals(r.data.deals))
      .finally(() => setLoading(false));
  }

  useEffect(load, [active]);
  useEffect(() => {
    api.get<{ categories: Category[] }>("/geo/categories").then((r) => setCategories(r.data.categories));
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Group deals</h1>
          <p className="text-sm text-slate-500">
            Team up with neighbors for better rates on recurring jobs in {active?.name}.
          </p>
        </div>
        {user && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + Start a group deal
          </button>
        )}
      </div>

      {loading ? (
        <Spinner />
      ) : deals.length === 0 ? (
        <EmptyState
          icon="🤝"
          title="No group deals yet"
          hint="Start one for a recurring job like gutter cleaning, and rally your neighbors to unlock a group rate."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {deals.map((d) => (
            <Link key={d.id} to={`/deals/${d.id}`} className="card p-5 hover:border-brand-300">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-slate-900">
                  {d.category?.icon} {d.title}
                </h3>
                <StatusPill status={d.status} />
              </div>
              {d.targetDate && (
                <p className="mt-1 text-xs text-slate-500">🗓 {d.targetDate}</p>
              )}
              <div className="mt-4">
                <ProgressBar value={d.progress} />
                <div className="mt-1.5 flex items-center justify-between text-xs">
                  <span className="text-slate-600">
                    {d.committedHomes}/{d.minHomes} homes
                    {d.criticalMassReached && " ✓ critical mass!"}
                  </span>
                  {d.savingsPerHome != null && (
                    <span className="font-semibold text-brand-700">
                      Save ${d.savingsPerHome}/home
                    </span>
                  )}
                </div>
              </div>
              {d.soloPrice != null && d.groupPrice != null && (
                <p className="mt-3 text-sm">
                  <span className="text-slate-400 line-through">${d.soloPrice}</span>{" "}
                  <span className="font-bold text-brand-700">${d.groupPrice}/home</span>
                </p>
              )}
            </Link>
          ))}
        </div>
      )}

      <CreateDealForm
        open={showForm}
        onClose={() => setShowForm(false)}
        categories={categories}
        onCreated={() => {
          setShowForm(false);
          load();
        }}
      />
    </div>
  );
}
