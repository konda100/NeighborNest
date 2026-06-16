# NeighborNest — Project Dossier

> A single document capturing the full journey: the idea, the product, what was
> built, how to run and test it, deployment options, an honest success
> assessment, and a security review.

**Status:** MVP built end-to-end (backend + frontend + tests).
**Pilot market:** Corbett Landing, Pittsboro, Chatham County, NC.
**Tagline:** *Your neighborhood's home services hub.*

---

## Table of contents

1. [The origin story & problem](#1-the-origin-story--problem)
2. [Product vision & differentiators](#2-product-vision--differentiators)
3. [MVP feature set](#3-mvp-feature-set)
4. [Naming journey](#4-naming-journey)
5. [Validation path (no-code first)](#5-validation-path-no-code-first)
6. [What was built — architecture](#6-what-was-built--architecture)
7. [Project structure (file-by-file)](#7-project-structure-file-by-file)
8. [Data model](#8-data-model)
9. [API reference](#9-api-reference)
10. [Setup & running](#10-setup--running)
11. [Testing](#11-testing)
12. [Security review](#12-security-review)
13. [Deployment options & cost](#13-deployment-options--cost)
14. [Honest success assessment](#14-honest-success-assessment)
15. [Roadmap & next steps](#15-roadmap--next-steps)

---

## 1. The origin story & problem

The idea started from a real, personal frustration:

> *"I live in Corbett Landing, a new community in Pittsboro, and I still can't
> find a decent gutter cleaning company my neighbors actually trust."*

Today people rely on a messy mix of Google, Facebook groups, Nextdoor, HOA
emails, and word-of-mouth. None of it is **organized by neighborhood and service
type**, and recommendations get buried and lost.

There are two pains being solved at once:

- **For homeowners:** "Who do my neighbors actually use and trust for *this*
  specific job in *this* specific area?"
- **For providers:** "How do I become the default local choice in specific
  neighborhoods without paying for junk leads?"

A key insight emerged during the discussion: the idea is not only *finding*
someone, but **negotiating a better price when a group of homeowners need the
same job** — especially recurring work like annual gutter cleaning. New
communities like Corbett Landing (~20 occupied homes now, ~40 by end of 2026)
are an ideal pilot because they have *no* established word-of-mouth yet.

---

## 2. Product vision & differentiators

**Core idea:** a community-first home services directory where recommendations,
reviews, and saved vendors are organized by micro-geography
(**street/HOA → neighborhood → city → county → state**), plus **group buying**
for recurring services.

**Design principle:** start with *"who do my neighbors use for gutters / HVAC /
lawn care?"* instead of *"here's a generic list of pros near you."*

**Differentiators vs. existing options:**

| Existing option | Weakness | NeighborNest's answer |
|---|---|---|
| Thumbtack / Angi | Lead marketplace, spammy, pros pay for junk leads | Not a marketplace — neighbor knowledge hub |
| Nextdoor / Facebook groups | Recommendations get buried, unstructured | Organized by service + neighborhood, searchable forever |
| Google reviews | Strangers, easily gamed | Real neighbors, "used by N neighbors" social proof |
| Word-of-mouth | Doesn't scale, new communities have none | Crowdsourced + persistent |

The **genuinely unique wedge** is the **group-buying / price negotiation** layer
— turning the directory from a "helpful list" into an active cost-saver.

---

## 3. MVP feature set

**For homeowners**
- Address-based onboarding that auto-maps you to neighborhood → city → county → state.
- Browse by category with **"used by N neighbors"** badges.
- Neighborhood-scoped views (widen to city/county/everywhere when small).
- Price checks ("$180 for 2-story gutters").
- Persistent, searchable **"Ask Neighbors"** Q&A.
- Bookmark/save providers.

**Group deals (the differentiator)**
- Start a deal for a recurring job (e.g. "Fall 2026 gutter cleaning block deal").
- Neighbors tap **"I'm in!"**; a progress bar tracks **critical mass** (e.g. 8 homes).
- Organizer records the negotiated rate; the app computes **savings/home** and **total community savings**.

**For providers (foundation in place)**
- Profiles (contact, service area, categories, verified badge).
- Neighbor-scoped reputation built from real recommendations.

**Starting categories:** gutter cleaning, lawn care/landscaping, pressure
washing, handyman/small repairs, HVAC, pest control, house cleaning.

---

## 4. Naming journey

- **CorbettHub** — perfect for the pilot (community pride, instantly clear), but
  geography-locked.
- **NeighborNest** — chosen for scalability across city/county/state. Evokes
  neighbors + home (nest = community), no geography lock-in, app-store friendly.

**Rollout branding progression:**
`CorbettHub (now)` → `Pittsboro NeighborNest` → `Chatham NeighborNest` → `NeighborNest NC`.

The repo ships as **NeighborNest** with Corbett Landing as the seeded pilot hub.

---

## 5. Validation path (no-code first)

Before/alongside the app, the cheapest way to test demand:

1. **Google Forms + Google Sheets** (most user-friendly, zero learning curve):
   service type, provider, times used, price, recommend (Y/N), **group-discount
   interest + target date**.
2. Sheet tabs/filtered views: *All Services*, *Group Deals Ready*, *Gutters Only*.
3. Seed it yourself (2–3 entries), then share in Corbett Landing
   WhatsApp/Facebook/Nextdoor/HOA list with a copy-paste launch post.
4. When ≥3 neighbors want gutters → call 2–3 top providers for a group quote →
   announce "X/home if N homes commit by [date]" → coordinate one visit.

This app is the **productized version** of that exact loop — keep the no-code
experiment as a parallel, lightweight funnel.

---

## 6. What was built — architecture

A **monorepo** with two independent apps:

```
neighbornest/
├── server/    backend API (Express + TypeScript + Prisma + SQLite, JWT)
├── client/    frontend SPA (React 18 + Vite + TypeScript + Tailwind)
├── scripts/   setup helpers
└── docs/      this dossier
```

- The backend serves a JSON API on `:4000`.
- The frontend is a single-page app on `:5173`; in dev, Vite proxies `/api` → `:4000`.

| Layer    | Tech                                                    |
| -------- | ------------------------------------------------------ |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router |
| Backend  | Node.js, Express, TypeScript, Zod, JWT auth            |
| Database | SQLite via Prisma ORM                                   |
| Tests    | Vitest + Supertest                                     |

---

## 7. Project structure (file-by-file)

### Root
- **`package.json`** — orchestration scripts (`setup`, `dev:server`, `dev:client`, `build`, `seed`, `test`).
- **`scripts/ensure-env.mjs`** — cross-platform helper that creates `server/.env` from `.env.example` if missing.
- **`README.md`** — quick start + reference. **`docs/PROJECT_OVERVIEW.md`** — this dossier.

### Backend (`server/`)
- **`prisma/schema.prisma`** — the data model (geo hierarchy, users, providers, recommendations, group deals, Q&A, bookmarks).
- **`prisma/seed.ts`** — reusable `seed(prisma)` function + CLI runner; populates Corbett Landing demo data.
- **`.env` / `.env.example`** — config (`DATABASE_URL`, `JWT_SECRET`, `PORT`, `CLIENT_ORIGIN`); `.env` is gitignored.
- **`src/app.ts`** — `createApp()` builds/wires the Express app (CORS, JSON, auth middleware, routes, error handler). Exported for tests.
- **`src/index.ts`** — imports the app and starts the listener.
- **`src/prisma.ts`** — shared `PrismaClient` singleton.
- **`src/auth.ts`** — JWT sign/verify, `attachUser` (non-blocking), `requireAuth` (guard).
- **`src/util.ts`** — `asyncHandler`, `slugify`.
- **`src/routes/`**
  - `auth.ts` — register, login, `/me`, profile update.
  - `geo.ts` — geography tree, neighborhoods, categories.
  - `providers.ts` — directory engine + neighbor-scoped stats + provider detail.
  - `recommendations.ts` — create/upsert recommendation, bookmarks.
  - `groupDeals.ts` — list/create deals, commit toggle, organizer updates, savings math.
  - `ask.ts` — Q&A posts + replies.
  - `stats.ts` — neighborhood dashboard numbers.

### Frontend (`client/`)
- **`vite.config.ts`** — port 5173, `host: true`, `/api` proxy.
- **`tailwind.config.js`**, **`postcss.config.js`**, **`index.html`**, **`src/index.css`** — styling/shell.
- **`src/main.tsx`** — mounts app inside Router + Auth + Neighborhood providers.
- **`src/api.ts`** — axios client (auto-attaches JWT) + shared TypeScript types.
- **`src/auth.tsx`** — auth context (login/register/logout/profile/session restore).
- **`src/neighborhood.tsx`** — active-neighborhood context (the header switcher).
- **`src/App.tsx`** — routes + `RequireAuth` wrapper.
- **`src/components/`** — `Layout.tsx` (shell/nav), `ui.tsx` (Stars, NeighborBadge, ProgressBar, StatusPill, Modal, etc.), `RecommendForm.tsx`.
- **`src/pages/`** — `HomePage`, `DirectoryPage`, `ProviderPage`, `DealsPage`, `DealPage`, `AskPage`, `LoginPage`, `RegisterPage`, `ProfilePage`.

**Mental model:** Prisma schema → route modules expose JSON → axios + contexts
fetch → pages/components render. The two differentiators live in
`providers.ts`/`groupDeals.ts` (backend) and `DirectoryPage`/`DealPage` (frontend).

---

## 8. Data model

- **Geography:** `State → County → City → Neighborhood` (each user belongs to a neighborhood).
- **Providers** ↔ **ServiceCategories** (many-to-many via `ProviderCategory`).
- **Recommendation:** a resident's review of a provider for a category, scoped to
  their neighborhood (rating, price paid, times used, group interest). Powers
  "used by N neighbors."
- **GroupDeal** + **GroupDealCommitment:** neighborhood group-buying with
  critical-mass and savings math.
- **AskPost** + **AskReply:** persistent community Q&A.
- **Bookmark:** saved providers.

---

## 9. API reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` `/login` | — | Account + JWT |
| GET / PATCH | `/api/auth/me` | ✅ | Current user / update profile + neighborhood |
| GET | `/api/geo/neighborhoods` `/categories` `/tree` | — | Geography + categories |
| GET | `/api/providers` | — | Directory (filter by category, scope, search) |
| GET | `/api/providers/:id` | — | Provider detail + neighbor reviews |
| POST | `/api/providers` | ✅ | Create a provider |
| POST | `/api/recommendations` | ✅ | Add/update a recommendation |
| GET / POST | `/api/recommendations/bookmarks[/:id]` | ✅ | List / toggle saved providers |
| GET / POST | `/api/deals` | read: — / write: ✅ | List / create group deals |
| GET | `/api/deals/:id` | — | Deal detail |
| POST | `/api/deals/:id/commit` | ✅ | Toggle "I'm in!" |
| PATCH | `/api/deals/:id` | ✅ (organizer) | Set group price / status |
| GET / POST | `/api/ask` | read: — / write: ✅ | List / create Q&A posts |
| POST | `/api/ask/:id/replies` | ✅ | Reply to a question |
| GET | `/api/stats/neighborhood/:id` | — | Hub dashboard numbers |

---

## 10. Setup & running

Requires **Node.js 18+** (built/tested on Node 22).

```bash
npm run setup        # installs both apps, creates server/.env, seeds the DB
npm run dev:server   # http://localhost:4000
npm run dev:client   # http://localhost:5173
```

Open <http://localhost:5173>. **Demo login:** `alex@corbett.test` / `password123`
(other seeded neighbors also use `password123`).

> `npm run setup` auto-creates `server/.env` from `.env.example` (the `.env` is
> gitignored, so a fresh clone won't have one). Manual fallback — Windows
> PowerShell: `Copy-Item server\.env.example server\.env`; macOS/Linux:
> `cp server/.env.example server/.env`.

**Note on remote/cloud runs:** the Vite server binds to all interfaces
(`host: true`). To view an app running on a remote VM you still need the host's
port 5173 forwarded to your machine; otherwise run it locally.

---

## 11. Testing

Backend integration suite (**Vitest + Supertest**) runs against an isolated
SQLite test DB (`server/test.db`), re-seeded before each test.

```bash
npm test                 # from repo root
# or: cd server && npm test
```

**28 tests** cover: auth (register/login/me/profile + validation), the
directory's neighbor-scoped stats and **scope widening** (neighborhood → city),
recommendation create/upsert, group-deal commitments + critical-mass + savings
math + organizer permissions, Q&A posts/replies, and dashboard stats.

---

## 12. Security review

**Summary:** no critical vulnerabilities; the main items are deployment-hardening
gaps and one privacy design choice.

### Already good ✅
- **No exposed API keys** (no third-party integrations); **no `.env` tracked** by git.
- **No SQL injection** — all queries go through Prisma (parameterized).
- **Passwords** bcrypt-hashed (10 rounds), never returned to the client.
- **No privilege escalation** — register/update schemas don't accept `role` (mass-assignment safe).
- **All mutating routes behind `requireAuth`**; `PATCH /deals/:id` enforces organizer/admin ownership (no IDOR).
- **No stack-trace leakage** (generic 500); default 100 KB JSON body limit.

### Findings
| Severity | Issue | Fix |
|---|---|---|
| 🟠 High | Hardcoded JWT secret fallback (`auth.ts`) — known secret if `JWT_SECRET` unset | Fail fast in production; require strong secret |
| 🟡 Medium | No rate limiting on `/auth/*` — brute force / spam | Add `express-rate-limit` |
| 🟡 Medium | Public reads expose neighbor names, who-uses-whom, commitments | Require auth + neighborhood membership for reads (product decision) |
| 🟡 Medium | CORS falls back to reflect any origin if `CLIENT_ORIGIN` unset | Lock down prod default to a known list |
| 🟢 Low | No security headers | Add `helmet` |
| 🟢 Low | JWT in `localStorage`, 30-day expiry, no revocation | Shorter expiry / refresh, or httpOnly cookie + CSRF |
| 🟢 Low | Weak password policy (min 6) | Require 8+, optional breach check |
| 🟢 Low | Unbounded text fields | Add `.max()` length caps in Zod |
| 🟢 Low | `npm audit`: 3 high in client dev toolchain (not shipped) | Track; upgrade when feasible |

**Recommended quick wins:** JWT secret guard, `helmet`, `express-rate-limit`,
CORS lockdown (small, low-risk). The public-read item changes who can browse, so
it's a product decision.

---

## 13. Deployment options & cost

Three pieces: **frontend (static)**, **backend (Node API)**, **Postgres DB**.

| Piece | Cheap/free host | Cost |
|---|---|---|
| Frontend | Vercel / Netlify / Cloudflare Pages | Free |
| Backend | Render / Railway / Fly.io | Free tier → ~$5–7/mo always-on |
| Database | Neon / Supabase (Postgres) | Free tier |

**Path A — Free pilot (~$0/mo):** static frontend + free backend tier + Neon
Postgres. Caveat: free backends usually "sleep" after ~15 min idle (slow first
request). Fine for a small pilot.

**Path B — Always-on (~$5–7/mo):** paid small backend instance, or put everything
on one tiny **VPS** (Hetzner ~€4, DigitalOcean/Vultr/Linode ~$5–6) for a stable
IP and no sleeping.

**Custom domain (optional):** ~$10–12/year. Free hosts give a `*.vercel.app`-style URL.
HTTPS is included free on all the above.

**Only code change needed:** swap SQLite → Postgres (a small Prisma `datasource`
change since the ORM abstracts the DB).

### Repurposing a broken-screen MacBook as a server
Totally viable as a **headless** server:
- Do one-time setup with an external monitor; enable **Remote Login (SSH)**.
- Power settings: prevent sleep when display off, **auto-restart after power
  failure**; run in clamshell mode on power (battery = built-in UPS).
- Keep **macOS** (run with `pm2`/`launchd`) or install **Ubuntu Server**
  (lighter; Apple Silicon → easier to stay on macOS).
- **For exposure to neighbors**, prefer **Tailscale** or **Cloudflare Tunnel**
  over opening router ports (handles dynamic home IPs, safer).

**Recommendation:** great for dev/staging and an early private pilot; move the
public-facing app to a cheap cloud VPS once neighbors rely on it daily
(uptime, stable IP, easy HTTPS).

---

## 14. Honest success assessment

**The pain is real** and the existing options genuinely have gaps. The directory
overlaps with Nextdoor/Facebook (free, already have attention) — the **group
buying** is the truly differentiated wedge; lead with it.

**Hard truths every hyperlocal app faces:**
- **Cold-start / chicken-and-egg** — an empty hub is worthless; you win
  neighborhood-by-neighborhood from zero (the #1 killer).
- **Low frequency = weak retention** — people need these services rarely; the
  recurring + group-buy angle manufactures a reason to return seasonally.
- **Monetization is hard** — homeowners won't pay; providers only pay once you
  have density.
- **Coordination overhead** — early on, *you* are the glue for group deals.

**Success rate, by definition of success:**
- As a fundable, venture-scale company: low (single digits) — like most startups.
- As a useful tool that wins your community and a few nearby ones (possibly a
  modest local business): much higher with good execution.

> Idea quality is ~10% of the outcome; execution, distribution, and timing are
> the other 90%.

**Your unfair advantages:** you live in a brand-new community with *no*
established word-of-mouth (gap is widest exactly where you are); you feel the
pain yourself; it's small/concentrated (~40 homes → easy critical mass); and the
group-buy delivers immediate, tangible value.

**Highest-leverage next move:** don't build more — **make one real group
gutter-cleaning deal actually happen in Corbett Landing this fall.** That single
proof teaches more than any feature.

---

## 15. Roadmap & next steps

**Phase 1 (now):** single-hub directory + group deals (this repo) + no-code funnel.
**Phase 2:** multi-hub expansion across Pittsboro / Chatham County (data already
separates by geography).
**Phase 3:** provider self-service dashboards ("12 homes need gutters Oct 15 —
bid"), recurring-job reminders, monetization (freemium listings, featured
placements, anonymized demand insights).

**Concrete near-term checklist**
- [ ] Run the no-code Form/Sheet in parallel to recruit the first neighbors.
- [ ] Get to ≥3 "yes" on gutters, call 2–3 providers, close one group deal this fall.
- [ ] Apply the four security quick wins (JWT guard, helmet, rate-limit, CORS).
- [ ] Decide the read-access privacy model (public browse vs. members-only).
- [ ] Migrate SQLite → Postgres and deploy (free pilot path first).
- [ ] Optional: custom domain + "Powered by NeighborNest" branding on the pilot.

---

*Generated from the product discovery conversation and the implemented codebase.*
