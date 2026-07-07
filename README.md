# Kold Business Management System

Internal + partner + customer system for a ready-to-drink cold brew tea
business. Start by reading `CLAUDE.md` (rules) and `docs/` (design).

## First-time setup
1. `npx create-next-app@latest . --typescript --tailwind --app` (merge into this folder)
2. `npm i @prisma/client @clerk/nextjs` and `npm i -D prisma tsx`
3. Add to package.json: `"prisma": { "seed": "tsx prisma/seed.ts" }`
4. Copy `.env.example` → `.env`, fill in `DATABASE_URL` (local Postgres or Railway/Render)
5. `npx prisma migrate dev --name init` then `npx prisma db seed`
6. Build Phase 1 screens in the order listed in `docs/phases.md`

## Layout
- `CLAUDE.md` — standing orders for AI-assisted sessions
- `docs/` — decisions, data model, phases, brand
- `prisma/` — schema (canonical data model) + seed (real catalog & prices)
- `src/modules/` — business logic, one sealed module per domain
- `src/core/` — auth/roles, audit log, events, notifications
- `tests/` — money & stock invariants (see docs/data-model.md)
