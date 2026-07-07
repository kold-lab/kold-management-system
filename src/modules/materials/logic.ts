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

/** Stock received adds to the running balance (rule 4 — stock math lives here). */
export function receiveStock(current: Decimal, received: Decimal): Decimal {
  return current.plus(received);
}

/**
 * Validates a received-quantity input: positive, at most 3 decimal places
 * (stockQty is Decimal(12,3)). Throws on invalid input.
 */
export function parseQuantityInput(raw: string): Decimal {
  const trimmed = raw.trim();
  if (trimmed === "" || !/^\d+(\.\d{1,3})?$/.test(trimmed)) {
    throw new Error("Enter a quantity with up to 3 decimal places.");
  }
  const value = new Decimal(trimmed);
  if (value.lessThanOrEqualTo(0)) {
    throw new Error("Quantity must be greater than zero.");
  }
  return value;
}

/** Validates a low-stock threshold: non-negative, ≤3 decimal places; empty means 0. */
export function parseThresholdInput(raw: string): Decimal {
  const trimmed = raw.trim();
  if (trimmed === "") return new Decimal(0);
  if (!/^\d+(\.\d{1,3})?$/.test(trimmed)) {
    throw new Error("Enter a threshold with up to 3 decimal places.");
  }
  return new Decimal(trimmed);
}

export const MATERIAL_TYPES = ["PACKAGING", "INGREDIENT"] as const;
export const MATERIAL_UNITS = ["pcs", "g"] as const;

export type NewMaterialInput = {
  name: string;
  type: (typeof MATERIAL_TYPES)[number];
  unit: (typeof MATERIAL_UNITS)[number];
};

/** Validates the add-material form fields. Throws on invalid input. */
export function parseNewMaterialInput(
  name: string,
  type: string,
  unit: string
): NewMaterialInput {
  const trimmedName = name.trim();
  if (trimmedName === "") {
    throw new Error("Enter a material name.");
  }
  if (!MATERIAL_TYPES.includes(type as NewMaterialInput["type"])) {
    throw new Error("Choose a material type.");
  }
  if (!MATERIAL_UNITS.includes(unit as NewMaterialInput["unit"])) {
    throw new Error("Choose a unit (pcs or g).");
  }
  return {
    name: trimmedName,
    type: type as NewMaterialInput["type"],
    unit: unit as NewMaterialInput["unit"],
  };
}

/**
 * A material still in an active product's recipe cannot be deactivated —
 * brews would consume a material that no longer appears anywhere.
 * Returns the blocking message, or null when deactivation is allowed.
 */
export function deactivationBlockReason(activeRecipeProducts: string[]): string | null {
  if (activeRecipeProducts.length === 0) return null;
  return `Still used in recipes: ${activeRecipeProducts.join(", ")}. Remove it from those recipes first.`;
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
