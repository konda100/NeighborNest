# 🏡 NeighborNest

**Your neighborhood's home services hub** — trusted, hyper-local recommendations and neighbor group-buying, organized by micro-geography (neighborhood → city → county → state).

NeighborNest started as a real problem: *"I live in Corbett Landing, a new community in Pittsboro, and I still can't find a decent gutter cleaning company my neighbors actually trust."* Existing options (Google, Facebook groups, Nextdoor, HOA emails, Thumbtack) are either generic marketplaces or messy feeds where recommendations get buried. NeighborNest is a **community-first directory**, not a lead marketplace — and it adds **group deals** so neighbors can pool demand for recurring jobs (like annual gutter cleaning) and negotiate a better rate.

---

## What it does

### For homeowners
- **Address-based onboarding** maps you to your neighborhood → city → county → state.
- **Browse by service** (gutter cleaning, lawn care, pressure washing, handyman, HVAC, pest control, house cleaning) with **"Used by N neighbors"** social-proof badges.
- **Neighborhood-scoped views** — see providers neighbors *actually* used, not a generic list. Widen the scope to city / county / everywhere when your hub is still small.
- **Price checks** — neighbors share what they paid ("$180 for 2-story gutters").
- **Ask Neighbors** — persistent, searchable Q&A threads that don't get buried like Facebook posts.
- **Save providers** you like.

### Group deals (the differentiator)
- Start a **group deal** for a recurring service ("Fall 2026 gutter cleaning block deal").
- Neighbors tap **"I'm in!"** to commit. A progress bar tracks **critical mass** (e.g. 8 homes).
- The organizer records the **negotiated group rate**; NeighborNest computes **savings per home** and **total community savings**.
- One provider runs the whole street in a single efficient visit — homeowners save, providers win.

### For providers (foundation in place)
- Provider profiles (contact, service area, categories, verified badge).
- Neighbor-scoped reputation built from real recommendations.

---

## Tech stack

| Layer    | Tech                                                        |
| -------- | ---------------------------------------------------------- |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router     |
| Backend  | Node.js, Express, TypeScript, Zod, JWT auth                |
| Database | SQLite via Prisma ORM                                       |

Monorepo layout:

```
.
├── server/   # Express + Prisma API
│   ├── prisma/schema.prisma   # data model
│   ├── prisma/seed.ts         # Corbett Landing demo data
│   └── src/                   # routes, auth, server
└── client/   # React + Vite single-page app
    └── src/                   # pages, components, contexts
```

---

## Getting started

Requires **Node.js 18+** (built and tested on Node 22).

### 1. Backend

```bash
cd server
npm install
cp .env.example .env          # adjust if needed
npm run db:reset              # creates SQLite db + seeds demo data
npm run dev                   # http://localhost:4000
```

### 2. Frontend

```bash
cd client
npm install
npm run dev                   # http://localhost:5173 (proxies /api -> :4000)
```

Open http://localhost:5173.

### Demo login

The seed creates the Corbett Landing hub (plus Fearrington Village and Briar Chapel for cross-scope testing).

```
email:    alex@corbett.test
password: password123          (admin / deal organizer)
```

Other seeded neighbors all use the password `password123` (e.g. `priya@corbett.test`, `marcus@corbett.test`).

---

## Data model

- **Geography:** `State → County → City → Neighborhood` (each user belongs to a neighborhood).
- **Providers** linked many-to-many to **ServiceCategories**.
- **Recommendations:** a resident's review of a provider for a category, scoped to their neighborhood (rating, price paid, times used, group interest). Powers the "used by N neighbors" stats.
- **GroupDeals** + **GroupDealCommitments:** neighborhood group-buying with critical-mass and savings math.
- **AskPosts** + **AskReplies:** persistent community Q&A.
- **Bookmarks:** saved providers.

---

## API overview

| Method | Endpoint                          | Description                                  |
| ------ | --------------------------------- | -------------------------------------------- |
| POST   | `/api/auth/register` `/login`     | Account + JWT                                |
| GET    | `/api/auth/me`, PATCH `/me`       | Current user / update profile + neighborhood |
| GET    | `/api/geo/neighborhoods`          | Neighborhoods with full geo path             |
| GET    | `/api/geo/categories`             | Service categories                           |
| GET    | `/api/providers`                  | Directory (filter by category, scope, search)|
| GET    | `/api/providers/:id`              | Provider detail + neighbor reviews           |
| POST   | `/api/recommendations`            | Add/update a recommendation                  |
| POST   | `/api/recommendations/bookmarks/:id` | Toggle a saved provider                   |
| GET/POST | `/api/deals`                    | List / create group deals                    |
| POST   | `/api/deals/:id/commit`           | Toggle "I'm in!"                             |
| PATCH  | `/api/deals/:id`                  | Organizer: set group price / status          |
| GET/POST | `/api/ask`                      | List / create Q&A posts                       |
| POST   | `/api/ask/:id/replies`            | Reply to a question                          |
| GET    | `/api/stats/neighborhood/:id`     | Hub dashboard numbers                        |

---

## Roadmap

This MVP intentionally starts with one neighborhood (Corbett Landing) and the highest-need categories, then scales the same structure outward:

- **Phase 1 (now):** Single-hub directory + group deals (this repo).
- **Phase 2:** Multi-hub expansion across Pittsboro / Chatham County (data already separates by geography).
- **Phase 3:** Provider self-service dashboards ("12 homes need gutters Oct 15 — bid"), recurring-job reminders, monetization (freemium provider listings, featured placements, demand insights).

---

## License

MIT
