import type { ReactNode } from "react";

export function Stars({ rating, size = "sm" }: { rating: number | null; size?: "sm" | "lg" }) {
  if (rating == null) return <span className="text-xs text-slate-400">No ratings yet</span>;
  const full = Math.round(rating);
  const cls = size === "lg" ? "text-lg" : "text-sm";
  return (
    <span className={`inline-flex items-center gap-1 ${cls}`} title={`${rating} / 5`}>
      <span className="text-amber-500">
        {"★".repeat(full)}
        <span className="text-slate-300">{"★".repeat(5 - full)}</span>
      </span>
      <span className="font-semibold text-slate-700">{rating.toFixed(1)}</span>
    </span>
  );
}

export function NeighborBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="badge bg-brand-100 text-brand-800">
      👥 Used by {count} neighbor{count === 1 ? "" : "s"}
    </span>
  );
}

export function VerifiedBadge() {
  return <span className="badge bg-sky-100 text-sky-700">✓ Verified</span>;
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
      <div
        className="h-full rounded-full bg-brand-500 transition-all"
        style={{ width: `${Math.round(value * 100)}%` }}
      />
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    collecting: "bg-amber-100 text-amber-800",
    negotiating: "bg-indigo-100 text-indigo-800",
    confirmed: "bg-brand-100 text-brand-800",
    completed: "bg-slate-200 text-slate-700",
    cancelled: "bg-rose-100 text-rose-700",
  };
  return (
    <span className={`badge ${map[status] ?? "bg-slate-100 text-slate-700"}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, hint }: { icon: string; title: string; hint?: string }) {
  return (
    <div className="card flex flex-col items-center gap-2 p-10 text-center">
      <div className="text-4xl">{icon}</div>
      <p className="font-semibold text-slate-700">{title}</p>
      {hint && <p className="max-w-sm text-sm text-slate-500">{hint}</p>}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center p-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
    </div>
  );
}
