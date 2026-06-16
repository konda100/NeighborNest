import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type AskPost } from "../api";
import { useNeighborhood } from "../neighborhood";
import { useAuth } from "../auth";
import { EmptyState, Modal, Spinner } from "../components/ui";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d > 0) return `${d}d ago`;
  const h = Math.floor(diff / 3600000);
  if (h > 0) return `${h}h ago`;
  return "just now";
}

function ReplyBox({ postId, onReplied }: { postId: string; onReplied: () => void }) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="mt-3 flex gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!body.trim()) return;
        setBusy(true);
        await api.post(`/ask/${postId}/replies`, { body });
        setBody("");
        setBusy(false);
        onReplied();
      }}
    >
      <input
        className="input"
        placeholder="Share who you used…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <button className="btn-primary" disabled={busy}>
        Reply
      </button>
    </form>
  );
}

export default function AskPage() {
  const { active } = useNeighborhood();
  const { user } = useAuth();
  const [posts, setPosts] = useState<AskPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [pbody, setPbody] = useState("");

  function load() {
    if (!active) return;
    setLoading(true);
    const q = new URLSearchParams({ neighborhoodId: active.id });
    if (search) q.set("search", search);
    api
      .get<{ posts: AskPost[] }>(`/ask?${q.toString()}`)
      .then((r) => setPosts(r.data.posts))
      .finally(() => setLoading(false));
  }

  useEffect(load, [active, search]);

  async function createPost(e: React.FormEvent) {
    e.preventDefault();
    await api.post("/ask", { title, body: pbody || undefined });
    setTitle("");
    setPbody("");
    setShowForm(false);
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ask your neighbors</h1>
          <p className="text-sm text-slate-500">
            Recommendations that don't get buried like Facebook posts — searchable forever.
          </p>
        </div>
        {user && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + Ask a question
          </button>
        )}
      </div>

      <input
        className="input"
        placeholder="Search past questions…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <Spinner />
      ) : posts.length === 0 ? (
        <EmptyState
          icon="💬"
          title="No questions yet"
          hint="Ask the first one — e.g. 'Who do you use for gutter cleaning?'"
        />
      ) : (
        <div className="space-y-4">
          {posts.map((p) => (
            <div key={p.id} className="card p-5">
              <h3 className="font-bold text-slate-900">{p.title}</h3>
              <p className="text-xs text-slate-400">
                {p.author.name} · {timeAgo(p.createdAt)} · {p.neighborhood.name}
              </p>
              {p.body && <p className="mt-2 text-sm text-slate-600">{p.body}</p>}

              <div className="mt-3 space-y-2 border-l-2 border-brand-100 pl-3">
                {p.replies.map((r) => (
                  <div key={r.id} className="text-sm">
                    <span className="font-semibold text-slate-700">{r.author.name}</span>{" "}
                    <span className="text-xs text-slate-400">· {timeAgo(r.createdAt)}</span>
                    <p className="text-slate-600">{r.body}</p>
                  </div>
                ))}
                {p.replies.length === 0 && (
                  <p className="text-sm text-slate-400">No replies yet.</p>
                )}
              </div>

              {user ? (
                <ReplyBox postId={p.id} onReplied={load} />
              ) : (
                <Link to="/login" className="mt-3 inline-block text-sm font-semibold text-brand-700">
                  Log in to reply
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Ask your neighbors">
        <form onSubmit={createPost} className="space-y-3">
          <div>
            <label className="label">Question *</label>
            <input
              className="input"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Who do you use for gutter cleaning?"
            />
          </div>
          <div>
            <label className="label">Details</label>
            <textarea
              className="input"
              rows={3}
              value={pbody}
              onChange={(e) => setPbody(e.target.value)}
              placeholder="Add context — home size, timing, budget…"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Post
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
