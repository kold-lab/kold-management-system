# Build phases

Each phase is independently useful the day it ships. Do not pull later-phase
features forward — shippable slices beat half-built breadth.

## Phase 1 — foundation & make side  ← CURRENT

Scope: project scaffold, Clerk auth + roles, catalog (flavours/products),
materials with price history + reorder thresholds, recipes (BOM), brew
batches (planned vs actual, cost snapshot, material consumption), finished
lots with expiry, stock screen with expiry watch + write-offs, dashboard.

Screens (build order):
1. Materials — list, current cost, "update price" (appends history),
   low-stock indicator.
2. Catalog — flavours + SKUs; add-flavour flow generates both sizes.
3. Recipe editor per SKU.
4. **New brew batch** (the workhorse — mockup agreed in design sessions):
   SKU picker, brew date, auto expiry chip, planned/actual bottles, live
   "will consume" panel, unit cost snapshot, save.
5. Batch history list.
6. Stock — finished lots sorted by days-to-expiry, write-off with reason.
7. Dashboard — stock at a glance + expiring-soon list. Built last.

Out of scope: customers, orders, invoices, consignment, notifications.

## Phase 2 — consignment

Partners (CRM basics), placements, weekly count screen (phone-first),
par-level restock suggestions, reconciliation sign-off, waste split
(expired vs damaged), consignment stock per partner site.

Delivery note generation (added 2026-07-08): a placement renders as a
print-styled page (browser print → PDF, no PDF library) with DN number,
partner block, per-flavour quantities, delivery + return acknowledgement
signature blocks, and a manual return section for the collection visit.
Layout/content reference: the standalone tools in `document_generation/`,
which this replaces — partner details, quantities, and numbering come
from system data instead of being retyped. Business identity (legal name
"kold brew hub", reg no., bank ref) lives in one shared config used by
all generated documents.

## Phase 3 — money

Monthly consignment invoicing (job-generated), outright B2B invoices,
payments + partial payments, AR aging, credit notes, payment reminders.
Decide payment gateway. Verify LHDN MyInvois scope before schema work.
Document rendering follows the Phase 2 delivery-note approach; layout
reference for consignment + outright invoices: `document_generation/`
(SST % line, payment box with bank ref, unpaid/paid status).

## Phase 4 — edges

B2C order form (replaces Google Form) with brew-to-order status +
expected-ready date, notifications service (order ready, low stock,
expiry, reconciliation due, payment due), reporting dashboard
(sell-through & waste per partner, true margin per SKU/partner, AR
aging, demand trend), delivery cost per trip.

Later candidates: B2B portal self-service ordering, accounting sync,
MyInvois integration, marketplace channels, brew-quantity suggestions
from sell-through.
