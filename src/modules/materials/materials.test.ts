import { describe, expect, it } from "vitest";
import { Decimal } from "@prisma/client/runtime/library";
import {
  currentCost,
  deactivationBlockReason,
  isLowStock,
  parseNewMaterialInput,
  parsePriceInput,
  parseQuantityInput,
  parseThresholdInput,
  priceEffectiveOn,
  receiveStock,
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

describe("receiveStock", () => {
  it("adds the received quantity to the running balance", () => {
    expect(receiveStock(new Decimal("10.5"), new Decimal("2.25")).toString()).toBe("12.75");
  });

  it("recovers a negative balance (pre-receive-flow brews drove stock below zero)", () => {
    expect(receiveStock(new Decimal("-70"), new Decimal("500")).toString()).toBe("430");
  });

  it("keeps decimal precision exactly (no float drift)", () => {
    expect(receiveStock(new Decimal("0.1"), new Decimal("0.2")).toString()).toBe("0.3");
  });
});

describe("parseQuantityInput", () => {
  it("parses a valid quantity", () => {
    expect(parseQuantityInput("500").toString()).toBe("500");
    expect(parseQuantityInput("2.125").toString()).toBe("2.125");
  });

  it("rejects blank, non-numeric, zero, and negative input", () => {
    expect(() => parseQuantityInput(" ")).toThrow();
    expect(() => parseQuantityInput("abc")).toThrow();
    expect(() => parseQuantityInput("0")).toThrow();
    expect(() => parseQuantityInput("-5")).toThrow();
  });

  it("rejects more than 3 decimal places (stockQty is Decimal(12,3))", () => {
    expect(() => parseQuantityInput("1.0001")).toThrow();
  });
});

describe("parseThresholdInput", () => {
  it("treats empty input as zero", () => {
    expect(parseThresholdInput("  ").toString()).toBe("0");
  });

  it("accepts zero and positive values", () => {
    expect(parseThresholdInput("0").toString()).toBe("0");
    expect(parseThresholdInput("50").toString()).toBe("50");
  });

  it("rejects negative and non-numeric input", () => {
    expect(() => parseThresholdInput("-1")).toThrow();
    expect(() => parseThresholdInput("abc")).toThrow();
  });
});

describe("parseNewMaterialInput", () => {
  it("trims the name and passes through valid type and unit", () => {
    expect(parseNewMaterialInput("  Honey ", "INGREDIENT", "g")).toEqual({
      name: "Honey",
      type: "INGREDIENT",
      unit: "g",
    });
  });

  it("rejects a blank name", () => {
    expect(() => parseNewMaterialInput("   ", "PACKAGING", "pcs")).toThrow();
  });

  it("rejects an unknown type or unit", () => {
    expect(() => parseNewMaterialInput("Honey", "LIQUID", "g")).toThrow();
    expect(() => parseNewMaterialInput("Honey", "INGREDIENT", "ml")).toThrow();
  });
});

describe("deactivationBlockReason", () => {
  it("allows deactivation when no active recipe uses the material", () => {
    expect(deactivationBlockReason([])).toBeNull();
  });

  it("blocks deactivation and names the recipes still using it", () => {
    const reason = deactivationBlockReason(["Oolong 350ml", "Oolong 250ml"]);
    expect(reason).toContain("Oolong 350ml");
    expect(reason).toContain("Oolong 250ml");
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
