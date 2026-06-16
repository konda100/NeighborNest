import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { useNeighborhood } from "../neighborhood";

function NeighborhoodSwitcher() {
  const { all, active, setActive } = useNeighborhood();
  if (!active) return null;
  return (
    <select
      className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-200"
      value={active.id}
      onChange={(e) => {
        const n = all.find((x) => x.id === e.target.value);
        if (n) setActive(n);
      }}
      title="Choose neighborhood hub"
    >
      {all.map((n) => (
        <option key={n.id} value={n.id}>
          {n.name} · {n.city}
        </option>
      ))}
    </select>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { to: "/", label: "Home", end: true },
    { to: "/directory", label: "Directory" },
    { to: "/deals", label: "Group Deals" },
    { to: "/ask", label: "Ask Neighbors" },
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-lg font-extrabold text-brand-700">
            <span className="text-2xl">🏡</span>
            <span>
              Neighbor<span className="text-brand-500">Nest</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <NeighborhoodSwitcher />
            </div>
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/profile"
                  className="hidden text-sm font-medium text-slate-600 hover:text-brand-700 sm:block"
                >
                  {user.name}
                </Link>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                >
                  Log out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-secondary">
                  Log in
                </Link>
                <Link to="/register" className="btn-primary hidden sm:inline-flex">
                  Join
                </Link>
              </div>
            )}
            <button
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu"
            >
              ☰
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-slate-200 px-4 py-2 md:hidden">
            <div className="mb-2">
              <NeighborhoodSwitcher />
            </div>
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2 text-sm font-medium ${
                    isActive ? "bg-brand-50 text-brand-700" : "text-slate-600"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>

      <footer className="mt-12 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-500">
          <p className="font-semibold text-slate-700">
            🏡 NeighborNest — your neighborhood's home services hub
          </p>
          <p className="mt-1">
            Trusted, hyper-local recommendations and group deals. Started in Corbett Landing,
            Pittsboro.
          </p>
        </div>
      </footer>
    </div>
  );
}
