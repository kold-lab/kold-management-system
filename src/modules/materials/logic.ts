// Pure functions only — no DB calls, no side effects. See CLAUDE.md rule 4.
import { Decimal } from "decimal.js";

export type PricePoint = {
  costPerUnit: Decimal;
  effectiveFrom: Date;
};

/** Current cost = latest MaterialPrice row by effectiveFrom (D16 — prices are history, never overwritten). */
export function currentCost(prices: PricePoint[]): Decimal | null {
  if (prices.length === 0) return null;
  return prices.reduce((latest, p) =>
    p.effectiveFrom > latest.effectiveFrom ? p : latest
  ).costPerUnit;
}

/**
 * Price effective on a calendar day = latest row with effectiveFrom on or
 * before the end of that day (invariant 4 — batch costs use the price
 * effective at brew date). Null when no price existed yet.
 */
export function priceEffectiveOn(prices: PricePoint[], day: Date): Decimal | null {
  const endOfDay = new Date(
    Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 23, 59, 59, 999)
  );
  let effective: PricePoint | null = null;
  for (const p of prices) {
    if (p.effectiveFrom > endOfDay) continue;
    if (effective === null || p.effectiveFrom > effective.effectiveFrom) {
      effective = p;
    }
  }
  return effective?.costPerUnit ?? null;
}

/** Low-stock indicator (D12): crossed when stock is at or below the reorder threshold. */
export function isLowStock(stockQty: Decimal, lowStockThreshold: Decimal): boolean {
  return stockQty.lessThanOrEqualTo(lowStockThreshold);
}

/** Validates raw "update price" form input into a positive Decimal. Throws on invalid input. */
export function parsePriceInput(raw: string): Decimal {
  const trimmed = raw.trim();
  if (trimmed === "" || !/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error("Enter a valid non-negative price.");
  }
  const value = new Decimal(trimmed);
  if (value.lessThanOrEqualTo(0)) {
    throw new Error("Price must be greater than zero.");
  }
  return value;
}
