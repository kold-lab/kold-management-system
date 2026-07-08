# Kold Business Management System — standing orders

This repo is a business management system for a ready-to-drink cold brew tea
business (brand: Kold). Read the relevant file in `docs/` before modifying a
module. `docs/decisions.md` is the source of truth for business rules — never
contradict it silently; if a task conflicts with it, stop and flag the conflict.

## Architecture rules (non-negotiable)

1. **Modular monolith.** All business logic lives in `src/modules/<module>/`.
   Pages and API routes in `src/app/` stay thin — they call module functions
   and render. No queries or business math in page files.
2. **Modules are sealed.** A module may import from another module ONLY via
   that module's `index.ts` public interface. Never reach into another
   module's internals (`actions.ts`, `queries.ts`, etc. are private).
3. **Module skeleton is fixed.** Every module uses the same layout:
   `index.ts` (public interface), `actions.ts` (mutations), `queries.ts`
   (reads), `logic.ts` (pure functions — no DB calls, no side effects),
   `components/` (UI), `<module>.test.ts`.
4. **Money and stock math is sacred.**
   - Always `Prisma.Decimal` / decimal columns for money. Never `number`
     floats for currency.
   - All cost, margin, invoice, and stock-movement math lives in `logic.ts`
     as pure functions and MUST have a test in `tests/` or the module test
     file. No exceptions, even for "trivial" changes.
5. **Posted records are never hard-deleted.** Issued invoices, completed
   reconciliations, payments, and stock movements get corrected via void,
   credit note, or adjustment — plus an `AuditLog` entry. Drafts may be
   edited or deleted freely. Master data (flavours, materials, customers)
   uses soft-delete (`isActive = false`) when referenced by history.
6. **Prices are history, not state.** Material cost changes append a
   `MaterialPrice` row (effective-dated). Brew batches freeze
   `unitCostSnapshot` at creation. Order/invoice lines snapshot
   `unitPrice`. Never recompute historical figures from current prices.
7. **Expiry is computed, never typed.** `expiryDate = brewDate + 7 days`,
   derived in code. Picking and placement follow FEFO (first expired,
   first out).

## Conventions

- TypeScript `strict`. Next.js App Router. Prisma + PostgreSQL. Tailwind +
  shadcn/ui themed with Kold tokens (`docs/brand.md`).
- Deep Blue `#0F2D4D` for text/primary buttons; Kold Blue `#4A90E2` is an
  accent only (fails contrast as body text). Semantic colors per
  `docs/brand.md`.
- Currency is MYR (RM). Dates are Malaysia time (UTC+8).
- UI must work well on a phone — counts and brews happen standing up.
- Commit small, one feature per session, tests green before commit.

## Current phase

Phase 2 (consignment), since 2026-07-08: partners, placements +
delivery notes, phone-first weekly count screen, reconciliation
sign-off, par levels, consignment stock per partner site. Phase 1
(make side) is live and being dogfooded in parallel. Do NOT build
orders, invoicing, or payments yet — those are Phase 3. See
`docs/phases.md` and D17/D18 in `docs/decisions.md`.
