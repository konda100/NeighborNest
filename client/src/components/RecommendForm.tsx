import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Category } from "../api";
import { Modal } from "./ui";

interface Props {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  defaultCategory?: string;
  defaultProviderId?: string;
  defaultProviderName?: string;
  canSubmit: boolean;
  onSubmitted: () => void;
}

export default function RecommendForm({
  open,
  onClose,
  categories,
  defaultCategory,
  defaultProviderId,
  defaultProviderName,
  canSubmit,
  onSubmitted,
}: Props) {
  const [providerName, setProviderName] = useState(defaultProviderName ?? "");
  const [categorySlug, setCategorySlug] = useState(defaultCategory ?? "");
  const [rating, setRating] = useState(5);
  const [recommend, setRecommend] = useState(true);
  const [timesUsed, setTimesUsed] = useState("1");
  const [pricePaid, setPricePaid] = useState("");
  const [comment, setComment] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [groupInterest, setGroupInterest] = useState(false);
  const [groupTargetDate, setGroupTargetDate] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setCategorySlug(defaultCategory ?? categories[0]?.slug ?? "");
      setProviderName(defaultProviderName ?? "");
      setError("");
    }
  }, [open, defaultCategory, defaultProviderName, categories]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post("/recommendations", {
        providerId: defaultProviderId,
        providerName: defaultProviderId ? undefined : providerName,
        providerPhone: phone || undefined,
        providerWebsite: website || undefined,
        categorySlug,
        rating,
        recommend,
        timesUsed,
        pricePaid: pricePaid || undefined,
        comment: comment || undefined,
        groupInterest,
        groupTargetDate: groupInterest ? groupTargetDate || undefined : undefined,
      });
      onSubmitted();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Recommend a provider">
      {!canSubmit ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Log in and set your neighborhood to add a recommendation so neighbors can trust who you
            use.
          </p>
          <div className="flex gap-2">
            <Link to="/login" className="btn-primary" onClick={onClose}>
              Log in
            </Link>
            <Link to="/register" className="btn-secondary" onClick={onClose}>
              Create account
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          {!defaultProviderId && (
            <div>
              <label className="label">Provider name *</label>
              <input
                className="input"
                required
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                placeholder="e.g. Triangle Gutter Pros"
              />
            </div>
          )}

          <div>
            <label className="label">Service *</label>
            <select
              className="input"
              required
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
            >
              <option value="">Select a service…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>

          {!defaultProviderId && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Phone</label>
                <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <label className="label">Website</label>
                <input
                  className="input"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Rating</label>
              <select
                className="input"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
              >
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>
                    {"★".repeat(r)} ({r})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Times used</label>
              <select
                className="input"
                value={timesUsed}
                onChange={(e) => setTimesUsed(e.target.value)}
              >
                <option value="1">1 time</option>
                <option value="2-3">2-3 times</option>
                <option value="4+">4+ times</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">What did you pay?</label>
            <input
              className="input"
              value={pricePaid}
              onChange={(e) => setPricePaid(e.target.value)}
              placeholder='e.g. "$180 for 2-story gutters"'
            />
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              className="input"
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What you liked or didn't"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={recommend}
              onChange={(e) => setRecommend(e.target.checked)}
            />
            I recommend this provider
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={groupInterest}
              onChange={(e) => setGroupInterest(e.target.checked)}
            />
            I'd join a neighbor group deal for this service
          </label>

          {groupInterest && (
            <input
              className="input"
              value={groupTargetDate}
              onChange={(e) => setGroupTargetDate(e.target.value)}
              placeholder='When? e.g. "Fall 2026"'
            />
          )}

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Submit recommendation"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
