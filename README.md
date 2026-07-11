<div align="center">

<img src="public/favicon.svg" width="88" height="88" alt="Moments logo" />

# Moments

### Share your best moments.

A premium, full‑stack social app — photos, videos, reels, stories, likes, comments, saves, follows, and real‑time‑feel direct messaging. Built with **React + Express + PostgreSQL** and an aurora‑glass design system that's cleaner, faster and more beautiful than the app that inspired it.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)

</div>

---

## ✨ Features

| | |
|---|---|
| 📸 **Feed** | Personalized home feed of the people you follow, with image carousels, double‑tap to like, captions, comments & saves |
| 🎞️ **Reels** | Full‑screen vertical video feed with autoplay‑in‑view, mute toggle, and side‑rail actions |
| ⭕ **Stories** | Gradient story rings, an immersive full‑screen viewer with tap‑to‑advance, progress bars & auto‑play |
| 🧭 **Explore** | Masonry discovery grid with feature tiles, ranked by engagement |
| 👤 **Profiles** | Avatars, verified badges, bios, follower/following counts, follow/unfollow, editable profile, Posts & Saved tabs |
| 💬 **Direct Messages** | Conversation list + chat threads with gradient bubbles, optimistic sending, and live polling for new messages |
| ❤️ **Notifications** | Likes, comments & follows grouped by time, with follow‑back |
| 🔍 **Search** | Debounced people search |
| ➕ **Create** | Upload (auto‑resized) or pick a sample, add a caption & location, and post instantly |
| 🌗 **Theming** | Dark‑first with a one‑tap light mode; fully responsive with a mobile bottom‑nav |
| 🔐 **Auth** | JWT auth with register / login and a one‑click demo account |

---

## 🧱 Tech Stack

**Frontend** — React 18 · Vite 6 · React Router 6 · Zustand (state) · Framer Motion (animation) · Tailwind CSS v4 · Lucide icons

**Backend** — Node + Express · PostgreSQL (`pg`) · JWT (`jsonwebtoken`) · `bcryptjs`

**Design** — Custom design‑token system, aurora gradients, glassmorphism, `Sora` + `Plus Jakarta Sans` type.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+
- **PostgreSQL** 13+ running locally

### 1. Install
```bash
npm install
```

### 2. Configure the database
Copy the example env and set your Postgres password:
```bash
cp .env.example .env
```
```ini
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=your_postgres_password
PGDATABASE=moments
JWT_SECRET=some_long_random_string
VITE_API_URL=http://localhost:4000/api
```

### 3. Create the schema & seed demo data
```bash
npm run db:setup   # creates the `moments` database + tables
npm run db:seed    # loads 10 users, posts, reels, stories & chats
```

### 4. Run it
```bash
npm run dev        # starts the API (4000) and the web app (5173) together
```
Open **http://localhost:5173** and click **“Try the demo account.”**

> 🔑 **Demo login:** any seeded username + password `moments123` — e.g. `you` / `moments123`

---

## 📜 Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Runs API + web concurrently (hot reload) |
| `npm run dev:web` | Vite dev server only |
| `npm run dev:api` | Express API only (`node --watch`) |
| `npm run db:setup` | Creates the database and applies `server/schema.sql` |
| `npm run db:seed` | Truncates & seeds rich demo data |
| `npm run build` | Production build of the frontend |
| `npm run preview` | Preview the production build |

---

## 🗂️ Project Structure

```
Moments/
├─ server/                  # Express + PostgreSQL API
│  ├─ index.js              # app entry, route mounting, health check
│  ├─ db.js                 # pg pool + transaction helper
│  ├─ schema.sql            # full relational schema (idempotent)
│  ├─ setup.js  seed.js     # db bootstrap + demo data
│  ├─ queries.js            # shared enriched-post / profile queries
│  ├─ middleware/auth.js    # JWT sign + require/optional guards
│  └─ routes/               # auth · posts · users · stories · chat · notifications
├─ src/                     # React frontend
│  ├─ lib/                  # api client + formatters
│  ├─ store/                # zustand: auth + ui/theme/toasts
│  ├─ components/           # ui · layout · feed · create · search
│  └─ pages/                # Home · Explore · Reels · Profile · Messages · …
├─ .env.example
└─ vite.config.js
```

---

## 🔌 API Overview

```
POST   /api/auth/register | /login            GET /api/auth/me
GET    /api/posts/feed | /explore | /reels | /saved | /:id
POST   /api/posts                             DELETE /api/posts/:id
POST   /api/posts/:id/like | /save            (+ DELETE to undo)
GET/POST /api/posts/:id/comments
GET    /api/users/:username(/posts|/followers|/following)
POST   /api/users/:username/follow            PATCH /api/users/me/profile
GET    /api/users/search?q= | /suggestions
GET/POST /api/stories                         POST /api/stories/:id/view
GET    /api/chat/conversations                POST /api/chat/with/:username
GET/POST /api/chat/conversations/:id/messages
GET    /api/notifications                     POST /api/notifications/read
```

---

## 🧭 Design Notes

- **Swappable data layer** — the frontend talks to a single typed `api` client, so the backend can evolve (or move to Supabase/another host) without touching UI code.
- **Optimistic UI** — likes, saves, follows and messages update instantly and reconcile with the server.
- **Accessibility & motion** — focus rings, keyboard support in the story viewer & modals, and `prefers-reduced-motion` respected throughout.

---

## ☁️ Deploying

The frontend deploys to **Vercel** as a static SPA (`vercel.json` includes SPA rewrites). Point `VITE_API_URL` at your hosted API, and deploy the `server/` app to any Node host (Render, Railway, Fly.io, a VPS…) with a managed Postgres instance.

---

<div align="center">

**Made with ❤️ — © 2026 Moments**

</div>
