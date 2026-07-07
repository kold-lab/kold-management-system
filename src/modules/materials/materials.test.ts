import { describe, expect, it } from "vitest";
import { Decimal } from "@prisma/client/runtime/library";
import {
  currentCost,
  isLowStock,
  parsePriceInput,
  priceEffectiveOn,
} from "./logic";

describe("currentCost", () => {
  it("returns null when there is no price history", () => {
    expect(currentCost([])).toBeNull();
  });

  it("returns the latest price by effectiveFrom, regardless of array order", () => {
    const prices = [
      { costPerUnit: new Decimal("1.446"), effectiveFrom: new Date("2026-01-01") },
      { costPerUnit: new Decimal("1.60"), effectiveFrom: new Date("2026-07-01") },
      { costPerUnit: new Decimal("1.50"), effectiveFrom: new Date("2026-04-01") },
    ];
    expect(currentCost(prices)!.toString()).toBe("1.6");
  });
});

describe("priceEffectiveOn", () => {
  const prices = [
    { costPerUnit: new Decimal("1.446"), effectiveFrom: new Date("2026-01-01T09:00:00Z") },
    { costPerUnit: new Decimal("1.50"), effectiveFrom: new Date("2026-04-01T09:00:00Z") },
    { costPerUnit: new Decimal("1.60"), effectiveFrom: new Date("2026-07-01T09:00:00Z") },
  ];

  it("picks the latest price on or before the given day (invariant 4)", () => {
    expect(priceEffectiveOn(prices, new Date("2026-05-15T00:00:00Z"))!.toString()).toBe("1.5");
  });

  it("includes a price recorded later the same day", () => {
    // Brew date is stored as midnight; a price updated that morning still applies.
    expect(priceEffectiveOn(prices, new Date("2026-07-01T00:00:00Z"))!.toString()).toBe("1.6");
  });

  it("returns null before the first price existed", () => {
    expect(priceEffectiveOn(prices, new Date("2025-12-31T00:00:00Z"))).toBeNull();
  });
});

describe("isLowStock", () => {
  it("flags stock at or below the threshold", () => {
    expect(isLowStock(new Decimal("50"), new Decimal("50"))).toBe(true);
    expect(isLowStock(new Decimal("49"), new Decimal("50"))).toBe(true);
  });

  it("does not flag stock above the threshold", () => {
    expect(isLowStock(new Decimal("51"), new Decimal("50"))).toBe(false);
  });
});

describe("parsePriceInput", () => {
  it("parses a valid positive decimal string", () => {
    expect(parsePriceInput("1.446").toString()).toBe("1.446");
  });

  it("rejects blank input", () => {
    expect(() => parsePriceInput("  ")).toThrow();
  });

  it("rejects non-numeric input", () => {
    expect(() => parsePriceInput("abc")).toThrow();
  });

  it("rejects negative input", () => {
    expect(() => parsePriceInput("-1")).toThrow();
  });

  it("rejects zero", () => {
    expect(() => parsePriceInput("0")).toThrow();
  });
});
