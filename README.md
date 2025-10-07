<div align="center">
  <h1>Stook — elke sessie beter</h1>
  <p>Kamado‑first BBQ webapp. Next.js 15 + Supabase + Drizzle + Tailwind + shadcn/ui.</p>
</div>

## Stack
- Next.js 15 (App Router, RSC), TypeScript
- Tailwind CSS v4, shadcn/ui (Radix), lucide‑react
- Supabase (Postgres + Auth + Storage), regio eu‑central (Frankfurt)
- Drizzle ORM + drizzle‑kit (migraties in `drizzle/`)
- Vitest + Testing Library, Playwright (e2e)

## Setup
1) Installeer dependencies
```bash
pnpm install
```

2) Zet `.env.local` op basis van `.env.example`
- `SITE_URL`, `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server‑only)
- `DATABASE_URL` (Postgres, gebruik Pooler in prod met sslmode=require)

3) Database migraties (Drizzle)
```bash
pnpm db:push
```

4) RLS en Storage
```bash
pnpm db:rls        # voert policies uit indien nodig
pnpm db:bucket     # maakt 'photos' bucket aan
```

5) Start dev server
```bash
pnpm dev
```

## Scripts
- `pnpm db:push` — Drizzle migraties pushen
- `pnpm db:rls` — RLS policies toepassen
- `pnpm db:bucket` — Supabase Storage bucket `photos` aanmaken

## Conventies
- Schema in `drizzle/schema.ts`, migraties in `drizzle/migrations/`
- Server‑only keys nooit client‑side of in logs
- Muterende API‑routes draaien op Node runtime (geen Edge)

## Deploy (Vercel)
- Repo koppelen, env vars instellen (zie `.env.example`)
- Prod `DATABASE_URL`: Supabase Pooler + `sslmode=require`
- Domeinen: `stookboek.nl` primair; `stook-boek.nl` 301 → `stookboek.nl`

## Roadmap Sprint 0
- Pages: `/`, `/recipes`, `/recipes/new`, `/recipes/[id]`, `/recipes/[id]/edit`, `/sessions/[id]`, `/import`, `/profile`
- API: recepten, reviews, sessies, foto‑upload, events
- Seeds + demo user, tests (vitest/playwright), CI workflow
