// Pure functions only — no DB calls, no side effects. See CLAUDE.md rule 4.
import { Decimal } from "@prisma/client/runtime/library";

/** Every flavour is bottled in both sizes; adding a flavour generates both SKUs. */
export const SIZES_ML = [250, 350] as const;
export type SizeMl = (typeof SIZES_ML)[number];

/**
 * SKU code = flavour-name initials + size, e.g. "Osmanthus oolong" × 350 → "OO-350".
 * Must stay in sync with the seed's convention (prisma/seed.ts).
 */
export function skuCode(flavourName: string, sizeMl: number): string {
  const initials = flavourName
    .trim()
    .split(/\s+/)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return `${initials}-${sizeMl}`;
}

/** Validates raw BOM-line quantity input into a positive Decimal. Throws on invalid input. */
export function parseQuantityInput(raw: string): Decimal {
  const trimmed = raw.trim();
  if (trimmed === "" || !/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error("Enter a valid quantity.");
  }
  const value = new Decimal(trimmed);
  if (value.lessThanOrEqualTo(0)) {
    throw new Error("Quantity must be greater than zero.");
  }
  return value;
}

/** Cost of one BOM line = quantity × material's current cost; null when the material has no price yet. */
export function lineCost(
  quantity: Decimal,
  costPerUnit: Decimal | null
): Decimal | null {
  return costPerUnit === null ? null : quantity.mul(costPerUnit);
}

/**
 * Unit material cost of a recipe = Σ(line quantity × current cost) — the
 * per-bottle COGS preview (D9: COGS = materials only). Returns null when any
 * line's material lacks a price, so an incomplete figure is never shown.
 */
export function recipeUnitCost(
  lines: Array<{ quantity: Decimal; costPerUnit: Decimal | null }>
): Decimal | null {
  let total = new Decimal(0);
  for (const line of lines) {
    const cost = lineCost(line.quantity, line.costPerUnit);
    if (cost === null) return null;
    total = total.plus(cost);
  }
  return total;
}

/** Validates raw "add flavour" form input into a clean flavour name. Throws on invalid input. */
export function parseFlavourNameInput(raw: string): string {
  const name = raw.trim().replace(/\s+/g, " ");
  if (name === "") {
    throw new Error("Enter a flavour name.");
  }
  if (name.length > 60) {
    throw new Error("Flavour name must be 60 characters or fewer.");
  }
  if (!/^[\p{L}\p{N}][\p{L}\p{N} '&-]*$/u.test(name)) {
    throw new Error("Flavour name contains unsupported characters.");
  }
  return name;
}
