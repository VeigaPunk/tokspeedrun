# TokSpeedrun

The token speedrunning leaderboard. Fixed tasks, a live clock, and a token meter — sign in with Kimi, publish a run with proof, and a steward verifies it or rejects it. The board decides what stands.

## Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind + shadcn/ui
- **Backend**: Hono + tRPC 11 (end-to-end typed)
- **DB**: Drizzle ORM + MySQL
- **Auth**: Kimi OAuth (app creator is auto-admin / "steward")

## What's inside

- `src/pages/Board.tsx` — the leaderboard: track filters, sort by fastest / fewest tokens / cheapest / latest
- `src/pages/Submit.tsx` — publish a run (wall time, tokens in/out, cost, proof URL)
- `src/pages/Admin.tsx` — steward console: moderation queue, track management, runner list
- `api/runRouter.ts`, `api/trackRouter.ts` — public board queries, authed publishing, admin moderation
- `db/schema.ts` — `users`, `tracks`, `runs` (status: pending → verified / rejected)
- `db/seed.ts` — the four launch tracks (`npx tsx db/seed.ts`)

## Run it

```bash
cp .env.example .env   # fill in Kimi OAuth + DATABASE_URL
npm install
npm run db:push        # sync schema
npx tsx db/seed.ts     # seed the tracks
npm run dev            # http://localhost:3000
```

## Deploy

Dockerfile included: `npm run build` then `npm start` (port 3000).

## Note on the lockfile

`package-lock.json` is intentionally not in this repo (pushed via API, size limits).
Generate it locally with `npm install` and commit it if you want pinned builds.

---

Built on Kimi. Every run is a receipt.
