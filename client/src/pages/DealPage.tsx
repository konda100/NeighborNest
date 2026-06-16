import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type Deal } from "../api";
import { useAuth } from "../auth";
import { ProgressBar, Spinner, StatusPill } from "../components/ui";

const STATUSES = ["collecting", "negotiating", "confirmed", "completed", "cancelled"];

export default function DealPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [groupPrice, setGroupPrice] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    if (!id) return;
    api
      .get<{ deal: Deal }>(`/deals/${id}`)
      .then((r) => {
        setDeal(r.data.deal);
        setGroupPrice(r.data.deal.groupPrice?.toString() ?? "");
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, [id]);

  async function commit() {
    if (!id) return;
    setBusy(true);
    const r = await api.post<{ deal: Deal }>(`/deals/${id}/commit`);
    setDeal(r.data.deal);
    setBusy(false);
  }

  async function update(data: Record<string, unknown>) {
    if (!id) return;
    setBusy(true);
    const r = await api.patch<{ deal: Deal }>(`/deals/${id}`, data);
    setDeal(r.data.deal);
    setBusy(false);
  }

  if (loading) return <Spinner />;
  if (!deal) return <p className="text-slate-500">Deal not found.</p>;

  const isOrganizer = user && deal.organizer?.id === user.id;

  return (
    <div className="space-y-6">
      <Link to="/deals" className="text-sm font-semibold text-brand-700 hover:underline">
        ← Back to deals
      </Link>

      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {deal.category?.icon} {deal.title}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {deal.category?.name} · {deal.neighborhood?.name}
              {deal.targetDate && ` · 🗓 ${deal.targetDate}`}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Organized by {deal.organizer?.name}
            </p>
          </div>
          <StatusPill status={deal.status} />
        </div>

        {deal.description && <p className="mt-4 text-slate-600">{deal.description}</p>}

        <div className="mt-6 rounded-2xl bg-slate-50 p-5">
          <ProgressBar value={deal.progress} />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-semibold text-slate-700">
              {deal.committedHomes} of {deal.minHomes} homes committed
              {deal.criticalMassReached && (
                <span className="ml-2 badge bg-brand-100 text-brand-800">✓ Critical mass!</span>
              )}
            </span>
            {!deal.criticalMassReached && (
              <span className="text-slate-500">
                {deal.minHomes - deal.committedHomes} more to unlock the group rate
              </span>
            )}
          </div>

          {deal.soloPrice != null && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <div className="text-xs uppercase text-slate-400">Solo price</div>
                <div className="text-lg font-bold text-slate-500 line-through">
                  ${deal.soloPrice}
                </div>
              </div>
              {deal.groupPrice != null && (
                <>
                  <div>
                    <div className="text-xs uppercase text-slate-400">Group price</div>
                    <div className="text-lg font-bold text-brand-700">${deal.groupPrice}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-slate-400">Save / home</div>
                    <div className="text-lg font-bold text-brand-700">${deal.savingsPerHome}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-slate-400">Community total</div>
                    <div className="text-lg font-bold text-brand-700">
                      ${deal.totalCommunitySavings}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {user ? (
          <button
            className={deal.iCommitted ? "btn-secondary mt-5" : "btn-primary mt-5"}
            onClick={commit}
            disabled={busy}
          >
            {deal.iCommitted ? "✓ You're in — tap to leave" : "I'm in!"}
          </button>
        ) : (
          <Link to="/login" className="btn-primary mt-5 inline-flex">
            Log in to join this deal
          </Link>
        )}
      </div>

      {/* Committed neighbors */}
      <div className="card p-5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
          Committed neighbors ({deal.committedBy.length})
        </h2>
        <div className="flex flex-wrap gap-2">
          {deal.committedBy.map((n) => (
            <span key={n.id} className="badge bg-brand-50 text-brand-800">
              {n.name}
            </span>
          ))}
          {deal.committedBy.length === 0 && (
            <p className="text-sm text-slate-500">Be the first to commit.</p>
          )}
        </div>
      </div>

      {/* Organizer controls */}
      {isOrganizer && (
        <div className="card p-5">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
            Organizer controls
          </h2>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="label">Negotiated group price $</label>
              <input
                type="number"
                className="input w-40"
                value={groupPrice}
                onChange={(e) => setGroupPrice(e.target.value)}
              />
            </div>
            <button
              className="btn-secondary"
              disabled={busy}
              onClick={() => update({ groupPrice: Number(groupPrice) })}
            >
              Save price
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                className={`badge ${
                  deal.status === s ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"
                }`}
                disabled={busy}
                onClick={() => update({ status: s })}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
