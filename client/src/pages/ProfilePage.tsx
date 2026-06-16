import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Provider } from "../api";
import { useAuth } from "../auth";
import { useNeighborhood } from "../neighborhood";
import { NeighborBadge, Stars } from "../components/ui";

interface Bookmark {
  id: string;
  provider: Provider;
}

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { all } = useNeighborhood();
  const [name, setName] = useState(user?.name ?? "");
  const [streetAddress, setStreetAddress] = useState(user?.streetAddress ?? "");
  const [neighborhoodId, setNeighborhoodId] = useState(user?.neighborhoodId ?? "");
  const [saved, setSaved] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    api.get<{ bookmarks: Bookmark[] }>("/recommendations/bookmarks").then((r) =>
      setBookmarks(r.data.bookmarks)
    );
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await updateProfile({ name, streetAddress, neighborhoodId });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Your profile</h1>

      <form onSubmit={save} className="card space-y-4 p-6">
        <div>
          <label className="label">Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input bg-slate-50" value={user?.email ?? ""} disabled />
        </div>
        <div>
          <label className="label">Street address</label>
          <input
            className="input"
            value={streetAddress}
            onChange={(e) => setStreetAddress(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Neighborhood</label>
          <select
            className="input"
            value={neighborhoodId}
            onChange={(e) => setNeighborhoodId(e.target.value)}
          >
            <option value="">Select…</option>
            {all.map((n) => (
              <option key={n.id} value={n.id}>
                {n.path}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary">
            Save changes
          </button>
          {saved && <span className="text-sm font-medium text-brand-700">✓ Saved</span>}
        </div>
      </form>

      <div>
        <h2 className="mb-3 text-xl font-bold text-slate-900">Saved providers</h2>
        {bookmarks.length === 0 ? (
          <p className="text-sm text-slate-500">No saved providers yet.</p>
        ) : (
          <div className="space-y-3">
            {bookmarks.map((b) => (
              <Link
                key={b.id}
                to={`/providers/${b.provider.id}`}
                className="card flex items-center justify-between p-4 hover:border-brand-300"
              >
                <div>
                  <p className="font-semibold text-slate-800">{b.provider.name}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Stars rating={b.provider.stats?.avgRating ?? null} />
                    <NeighborBadge count={b.provider.stats?.neighborCount ?? 0} />
                  </div>
                </div>
                <span className="text-slate-300">›</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
