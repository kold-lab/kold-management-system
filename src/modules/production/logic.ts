// Pure functions only — no DB calls, no side effects. See CLAUDE.md rule 4.
import { Decimal } from "@prisma/client/runtime/library";

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
