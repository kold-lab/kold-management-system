# Decision log

Source of truth for business rules. Each entry: the decision, and why.
Never contradict these in code without updating this file first.

## Business model

- **D1 — Channels.** Four flows: B2C brew-to-order (outright), B2B outright
  (pay on delivery), B2B consignment, and samples to prospects.
- **D2 — 7-day freshness.** Every bottle expires 7 days after brew date.
  Expiry is always computed, never manually entered. FEFO everywhere.
- **D3 — Brew-to-order B2C.** B2C bottles are brewed after the order exists,
  so B2C carries no waste risk. All waste risk lives in consignment.
- **D4 — Brand absorbs consignment losses.** Both expired AND damaged
  bottles at partner sites are the brand's loss (not charged to partner).
  They are still recorded under separate reason codes (`qty_expired` vs
  `qty_damaged`) because they diagnose different problems: expiry = weak
  sell-through (place fewer), damage = handling issue.
- **D5 — Consignment cadence.** Weekly on-site count + restock, recorded as
  a signed-off Reconciliation. Sold = placed − returned. Monthly invoice =
  sum of the month's sold × price.
- **D6 — Pricing.** RM7 per bottle, both outright and consignment, both
  sizes, for now. Pricing is per-SKU per-customer-type in the model, so
  this can change without schema work. Known trade-off: 350ml earns ~RM0.50
  less margin per bottle than 250ml at the same RM7.
- **D7 — Payment terms.** B2B outright: pay on delivery. Consignment
  invoices: Net 14 from issue (stored per customer in
  `paymentTermsDays`, changeable anytime).
- **D8 — Samples are acquisition cost, not COGS.** Samples decrement
  finished stock and are costed at unit material cost, booked per prospect
  as customer-acquisition cost. Never fold sample cost into COGS.
- **D9 — COGS = materials only** in the unit cost. Delivery is tracked per
  trip and allocated to the partner served; labor is a period operating
  cost. True partner profit = (sold × price) − (sold × unit cost) −
  (waste × unit cost) − allocated delivery.
- **D10 — Par levels.** Each partner × SKU has a target stock level;
  restock suggestion = target − last counted remaining.
- **D11 — B2C returns.** Simple replace-or-refund flow for quality issues,
  logged against the order.
- **D12 — Reorder alerts.** Each raw material has a low-stock threshold;
  alert when crossed.
- **D13 — Brew yield.** Batches record planned vs actual bottles; unit
  cost is computed from actual yield.

## Costing facts (seed data)

- 250ml bottle uses 2.5 g tea; 350ml uses 3.5 g tea. Tea is the only
  yield-scaled input; bottle, label, tag are one per bottle. Water is
  excluded as negligible (can be added as a BOM line later).
- Material prices (2026-07): PET 350ml RM1.446 · PET 250ml RM1.01 ·
  tag RM0.25 · label RM0.23 · osmanthus oolong RM51/500g (RM0.102/g) ·
  white peach oolong RM51/500g (RM0.102/g) · jasmine green RM30/500g
  (RM0.06/g).
- Resulting unit costs: 250ml oolongs RM1.745 · 250ml jasmine RM1.64 ·
  350ml oolongs RM2.283 · 350ml jasmine RM2.136.
- Packaging is ~85–91% of unit cost; the bottle alone is the biggest
  lever on COGS.

## Architecture

- **D14 — Modular monolith, not microservices, not a plugin engine.**
  Three layers: shared core → domain modules → channels/integrations.
  Dependencies point downward only. Revisit plugin architecture only if
  the system becomes a product others extend.
- **D15 — Stack.** Next.js + TypeScript (single app: internal ops, B2B
  portal, B2C form, as a PWA), Tailwind + shadcn/ui, PostgreSQL + Prisma,
  Redis + BullMQ for jobs (expiry sweep, invoice run, reminders), Clerk
  for auth + RBAC, PaaS hosting (Railway/Render), Sentry, GitHub Actions.
  Payment gateway chosen at Phase 3 (Billplz / iPay88 / Stripe).
- **D16 — Dynamic but safe.** All master data fully editable (new flavours,
  price updates are data entry, not code). Posted financial/stock records
  are correction-only with audit log (see CLAUDE.md rule 5).

## Open items (not yet decided)

- SST registration status and LHDN MyInvois e-invoicing scope — verify
  current thresholds before building the invoice schema's e-invoice
  fields (Phase 3).
- Payment gateway selection (Phase 3).
- Budget/timeline formalization.
