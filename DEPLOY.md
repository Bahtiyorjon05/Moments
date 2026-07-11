# Deploying Moments to Vercel

Moments is a single Vercel project: the **Vite frontend** (static) + the **Express API** running as a serverless function at `/api/*`, backed by a **hosted PostgreSQL** database.

```
Browser ──▶ Vercel (static SPA + /api serverless fn) ──▶ Postgres (Supabase / Neon / Vercel)
```

---

## 1. Create a free Postgres (pick one)

### Option A — Supabase (recommended, free tier)
1. Create a project at <https://supabase.com>.
2. Go to **Project Settings → Database → Connection string → URI** and copy it.
   Use the **Connection pooling** string (port `6543`) for serverless — it looks like:
   ```
   postgresql://postgres.xxxx:PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres
   ```

### Option B — Neon (also free)
1. Create a project at <https://neon.tech>, copy the **pooled** connection string.

Either way you now have a `DATABASE_URL`.

---

## 2. Load the schema + demo data into the hosted DB

From the project root, point the setup scripts at your hosted DB:

```bash
# macOS / Linux
DATABASE_URL="postgresql://…" npm run db:setup
DATABASE_URL="postgresql://…" npm run db:seed

# Windows PowerShell
$env:DATABASE_URL="postgresql://…"; npm run db:setup
$env:DATABASE_URL="postgresql://…"; npm run db:seed
```

(You can also paste `server/schema.sql` into the Supabase **SQL Editor** and run it.)

---

## 3. Set environment variables on Vercel

In the Vercel project → **Settings → Environment Variables** (or via CLI):

| Name | Value | Notes |
|---|---|---|
| `DATABASE_URL` | your pooled Postgres URI | required |
| `JWT_SECRET` | a long random string | required |

```bash
# via CLI (run once each, choose "Production")
vercel env add DATABASE_URL
vercel env add JWT_SECRET
```

> `VITE_API_URL` is **not** needed — in production the app calls the same-origin `/api` automatically.

---

## 4. Deploy

```bash
vercel --prod
```

Or connect the GitHub repo in the Vercel dashboard for automatic deploys on every push.

That's it — visit your `*.vercel.app` URL, and **Install** the PWA right from the browser on iPhone or Android. 🎉

---

## Notes
- The API is stateless; it uses a small pooled `pg` connection suited to serverless.
- Chat uses lightweight polling, which works fine on serverless (no websockets required).
- To run entirely locally instead, see the main [README](README.md) (`npm run dev` + local Postgres).
