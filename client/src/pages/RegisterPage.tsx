import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { useNeighborhood } from "../neighborhood";

export default function RegisterPage() {
  const { register } = useAuth();
  const { all } = useNeighborhood();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [neighborhoodId, setNeighborhoodId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await register({
        name,
        email,
        password,
        streetAddress: streetAddress || undefined,
        neighborhoodId: neighborhoodId || undefined,
      });
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-8">
        <h1 className="text-2xl font-bold text-slate-900">Join your neighborhood</h1>
        <p className="mt-1 text-sm text-slate-500">
          Tell us where you live and we'll map you to your community hub.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          <div>
            <label className="label">Street address</label>
            <input
              className="input"
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              placeholder="123 Corbett Way"
            />
          </div>
          <div>
            <label className="label">Neighborhood</label>
            <select
              className="input"
              value={neighborhoodId}
              onChange={(e) => setNeighborhoodId(e.target.value)}
              required
            >
              <option value="">Select your community…</option>
              {all.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.path}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-400">
              Your address auto-maps you to a neighborhood → city → county → state.
            </p>
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? "Creating account…" : "Create account"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Already a member?{" "}
          <Link to="/login" className="font-semibold text-brand-700 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
