import { describe, expect, it } from "vitest";
import { Decimal } from "@prisma/client/runtime/library";
import { currentCost, isLowStock, parsePriceInput } from "./logic";

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
