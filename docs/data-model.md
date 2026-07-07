# Data model

Two connected halves. Canonical schema: `prisma/schema.prisma`.

## Make side (production)

- **Flavour** — e.g. Osmanthus oolong. Adding a flavour is data entry.
- **Product** — a SKU = flavour × size (250ml / 350ml). Carries `skuCode`.
- **Material** — raw input: bottle, label, tag, tea leaves (typed via
  `type`). `stockQty` in the material's `unit` (pcs or g). Has
  `lowStockThreshold` for reorder alerts (D12).
- **MaterialPrice** — append-only price history. Current cost = latest row
  by `effectiveFrom`. Never overwrite (D16).
- **BomLine** — recipe row: product × material × quantity
  (e.g. 350ml oolong → 3.5 g tea, 1 bottle, 1 label, 1 tag).
- **BrewBatch** — one brew day event for one product. Records
  `qtyPlanned` vs `qtyProduced` (D13), computes
  `expiryDate = brewDate + 7d` (D2), consumes materials per BOM ×
  actual yield, freezes `unitCostSnapshot` (D16).
- **FinishedLot** — bottles from a batch sitting at a location, with
  `qtyRemaining` and the batch's `expiryDate`. Stock = sum of lots.
  This is what makes multi-location + FEFO + expiry watch work.
- **Location** — warehouse or a partner site (`customerId` set for
  partner sites).

## Sell side (customers & money)

- **Customer** — hub for B2C, B2B partners, and prospects (`type`).
  `paymentTermsDays` (D7). Prospects are early-stage customers who
  receive samples.
- **ParLevel** — target stock per customer × product (D10).
- **SalesOrder / OrderLine** — B2C and B2B outright. `status`:
  pending → brewing → ready → fulfilled (brew-to-order, D3), plus
  cancelled. `expectedReadyDate` quoted to the customer. Lines snapshot
  `unitPrice`.
- **Return** — B2C replace-or-refund, linked to order (D11).
- **ConsignmentPlacement** — bottles dropped at a partner: product,
  source `brewBatchId`, `qtyPlaced`, `expiryDate`. Batch link is what
  lets the system know which dated stock sits where.
- **Reconciliation / ReconciliationLine** — the signed-off weekly count
  (D5). Per line: `qtyPlaced = qtySold + qtyExpired + qtyDamaged` —
  this identity is enforced in logic. Expired and damaged both absorbed
  by brand but kept separate (D4).
- **Invoice / InvoiceLine** — `type`: consignment_monthly | outright.
  `dueDate = issueDate + customer.paymentTermsDays`. Status:
  draft → issued → paid | void. Issued invoices are never deleted.
- **Payment** — settlement rows; partial payments supported; AR aging
  derives from issued minus payments vs due date.
- **CreditNote** — correction path for disputed issued invoices.
- **Sample** — bottles to a prospect, costed at unit material cost,
  booked as acquisition cost outside COGS (D8). Decrements stock.

## Core

- **User** — app-side record keyed to Clerk user id; `role`:
  admin | ops | finance | partner.
- **AuditLog** — who/what/when for every mutation on money, stock, and
  master data. Append-only.

## Invariants (test these)

1. `expiryDate` is always `brewDate + 7 days`.
2. ReconciliationLine: `qtyPlaced === qtySold + qtyExpired + qtyDamaged`.
3. A FinishedLot's `qtyRemaining` never goes negative.
4. Batch `unitCostSnapshot` = Σ(BOM qty × material price effective at
   brew date) — and never changes after creation.
5. Invoice totals = Σ(lines); consignment monthly invoice = Σ(that
   month's reconciliation `qtySold`) × snapshotted unit price.
6. Sample cost never appears in any COGS/margin figure.
