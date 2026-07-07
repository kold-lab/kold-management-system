// Pure functions only — no DB calls, no side effects. See CLAUDE.md rule 4.
import { Decimal } from "decimal.js";

/** D2 — every bottle expires 7 days after brew date. */
export const SHELF_LIFE_DAYS = 7;

/** Expiry is computed, never typed: brewDate + 7 days (invariant 1). Dates are UTC-midnight calendar days. */
export function computeExpiryDate(brewDate: Date): Date {
  return new Date(brewDate.getTime() + SHELF_LIFE_DAYS * 86_400_000);
}

/** Validates a "YYYY-MM-DD" brew-date input into a UTC-midnight Date. Throws on invalid input. */
export function parseBrewDateInput(raw: string): Date {
  const trimmed = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new Error("Enter the brew date as YYYY-MM-DD.");
  }
  const date = new Date(`${trimmed}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== trimmed) {
    throw new Error("That brew date doesn't exist.");
  }
  return date;
}

/** Validates a bottle-count input into a positive integer. Throws on invalid input. */
export function parseBottleCountInput(raw: string, label: string): number {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) {
    throw new Error(`Enter ${label} as a whole number of bottles.`);
  }
  const value = Number(trimmed);
  if (value <= 0) {
    throw new Error(`${label} must be at least 1 bottle.`);
  }
  return value;
}

export type CostedBomLine = {
  quantity: Decimal;
  costPerUnit: Decimal | null;
};

/**
 * unitCostSnapshot = Σ(BOM qty × material price effective at brew date)
 * (invariant 4). Null when the recipe is empty or any material lacks a
 * price effective that day — a batch must never freeze a partial cost.
 */
export function batchUnitCost(lines: CostedBomLine[]): Decimal | null {
  if (lines.length === 0) return null;
  let total = new Decimal(0);
  for (const line of lines) {
    if (line.costPerUnit === null) return null;
    total = total.plus(line.quantity.mul(line.costPerUnit));
  }
  return total;
}

/** Material consumed by a brew = BOM per-bottle quantity × actual bottles (data model: BOM × actual yield). */
export function consumedQty(perBottle: Decimal, bottles: number): Decimal {
  return perBottle.mul(bottles);
}

/**
 * Material stock left after a brew. May go negative — the brew physically
 * happened, so the record stays truthful and the shortfall surfaces as a
 * low-stock/negative indicator instead of blocking entry.
 */
export function remainingAfterConsumption(
  stockQty: Decimal,
  consumed: Decimal
): Decimal {
  return stockQty.minus(consumed);
}

/** Whole days from today until expiry; negative once expired. Both dates are UTC-midnight days. */
export function daysToExpiry(expiryDate: Date, today: Date): number {
  return Math.round((expiryDate.getTime() - today.getTime()) / 86_400_000);
}

export type ExpiryStatus = "expired" | "today" | "soon" | "ok";

/**
 * Expiry-watch bucket. A bottle sold on its expiry day gives the customer
 * zero fresh days, so day 0 already reads as urgent ("today"), and ≤2 days
 * out is the restock/clearance window ("soon").
 */
export function expiryStatus(daysLeft: number): ExpiryStatus {
  if (daysLeft < 0) return "expired";
  if (daysLeft === 0) return "today";
  if (daysLeft <= 2) return "soon";
  return "ok";
}

export const WRITE_OFF_REASONS = ["expired", "damaged", "other"] as const;
export type WriteOffReason = (typeof WRITE_OFF_REASONS)[number];

/** Validates a write-off reason from form input. Throws on invalid input. */
export function parseWriteOffReason(raw: string): WriteOffReason {
  if ((WRITE_OFF_REASONS as readonly string[]).includes(raw)) {
    return raw as WriteOffReason;
  }
  throw new Error("Pick a write-off reason.");
}

/**
 * Validates a write-off quantity against the lot's remaining bottles.
 * A lot's qtyRemaining can never go negative (invariant 3). Throws on
 * invalid input.
 */
export function parseWriteOffQty(raw: string, qtyRemaining: number): number {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) {
    throw new Error("Enter the write-off as a whole number of bottles.");
  }
  const qty = Number(trimmed);
  if (qty <= 0) {
    throw new Error("Write off at least 1 bottle.");
  }
  if (qty > qtyRemaining) {
    throw new Error(
      `Only ${qtyRemaining} bottle${qtyRemaining === 1 ? "" : "s"} remain in this lot.`
    );
  }
  return qty;
}

export type StockSummaryInput = {
  skuCode: string;
  label: string;
  qtyRemaining: number;
  expiryStatus: ExpiryStatus;
};

export type StockSummaryRow = {
  skuCode: string;
  label: string;
  totalBottles: number;
  /** Bottles expired, expiring today, or within the 2-day window. */
  urgentBottles: number;
};

/** Stock at a glance: bottles on hand per SKU, with the urgent share, sorted by SKU label. */
export function summarizeStock(lots: StockSummaryInput[]): StockSummaryRow[] {
  const bySku = new Map<string, StockSummaryRow>();
  for (const lot of lots) {
    const row = bySku.get(lot.skuCode) ?? {
      skuCode: lot.skuCode,
      label: lot.label,
      totalBottles: 0,
      urgentBottles: 0,
    };
    row.totalBottles += lot.qtyRemaining;
    if (lot.expiryStatus !== "ok") {
      row.urgentBottles += lot.qtyRemaining;
    }
    bySku.set(lot.skuCode, row);
  }
  return [...bySku.values()].sort((a, b) => a.label.localeCompare(b.label));
}
