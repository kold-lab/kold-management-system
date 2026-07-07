import { describe, expect, it } from "vitest";
import { Decimal } from "@prisma/client/runtime/library";
import {
  lineCost,
  parseFlavourNameInput,
  parseQuantityInput,
  recipeUnitCost,
  skuCode,
  SIZES_ML,
} from "./logic";

describe("skuCode", () => {
  it("builds initials + size, matching the seed convention", () => {
    expect(skuCode("Osmanthus oolong", 350)).toBe("OO-350");
    expect(skuCode("Jasmine green tea", 250)).toBe("JGT-250");
  });

  it("uppercases initials and ignores extra whitespace", () => {
    expect(skuCode("  white  peach oolong ", 250)).toBe("WPO-250");
  });

  it("covers both catalogue sizes", () => {
    expect(SIZES_ML.map((s) => skuCode("Honey chrysanthemum", s))).toEqual([
      "HC-250",
      "HC-350",
    ]);
  });
});

describe("parseFlavourNameInput", () => {
  it("trims and collapses internal whitespace", () => {
    expect(parseFlavourNameInput("  Honey   chrysanthemum ")).toBe(
      "Honey chrysanthemum"
    );
  });

  it("accepts letters, digits, apostrophes, ampersands, and hyphens", () => {
    expect(parseFlavourNameInput("Earl Grey's 2nd")).toBe("Earl Grey's 2nd");
    expect(parseFlavourNameInput("Peach & jasmine")).toBe("Peach & jasmine");
    expect(parseFlavourNameInput("Ti-kuan-yin")).toBe("Ti-kuan-yin");
  });

  it("rejects blank input", () => {
    expect(() => parseFlavourNameInput("   ")).toThrow();
  });

  it("rejects names over 60 characters", () => {
    expect(() => parseFlavourNameInput("x".repeat(61))).toThrow();
  });

  it("rejects unsupported characters", () => {
    expect(() => parseFlavourNameInput("DROP TABLE;")).toThrow();
    expect(() => parseFlavourNameInput("<script>")).toThrow();
  });
});

describe("parseQuantityInput", () => {
  it("parses a valid positive decimal string", () => {
    expect(parseQuantityInput("2.5").toString()).toBe("2.5");
  });

  it("rejects blank, non-numeric, zero, and negative input", () => {
    expect(() => parseQuantityInput("  ")).toThrow();
    expect(() => parseQuantityInput("abc")).toThrow();
    expect(() => parseQuantityInput("0")).toThrow();
    expect(() => parseQuantityInput("-2.5")).toThrow();
  });
});

describe("lineCost", () => {
  it("multiplies quantity by current cost", () => {
    expect(lineCost(new Decimal("2.5"), new Decimal("0.06"))!.toString()).toBe(
      "0.15"
    );
  });

  it("returns null when the material has no price", () => {
    expect(lineCost(new Decimal("2.5"), null)).toBeNull();
  });
});

describe("recipeUnitCost", () => {
  it("matches the documented 250ml jasmine unit cost (RM1.64, docs/decisions.md)", () => {
    const lines = [
      { quantity: new Decimal("1"), costPerUnit: new Decimal("1.01") }, // bottle
      { quantity: new Decimal("1"), costPerUnit: new Decimal("0.23") }, // label
      { quantity: new Decimal("1"), costPerUnit: new Decimal("0.25") }, // tag
      { quantity: new Decimal("2.5"), costPerUnit: new Decimal("0.06") }, // tea
    ];
    expect(recipeUnitCost(lines)!.toString()).toBe("1.64");
  });

  it("matches the documented 350ml oolong unit cost (RM2.283, docs/decisions.md)", () => {
    const lines = [
      { quantity: new Decimal("1"), costPerUnit: new Decimal("1.446") },
      { quantity: new Decimal("1"), costPerUnit: new Decimal("0.23") },
      { quantity: new Decimal("1"), costPerUnit: new Decimal("0.25") },
      { quantity: new Decimal("3.5"), costPerUnit: new Decimal("0.102") },
    ];
    expect(recipeUnitCost(lines)!.toString()).toBe("2.283");
  });

  it("returns null when any line's material lacks a price", () => {
    const lines = [
      { quantity: new Decimal("1"), costPerUnit: new Decimal("1.01") },
      { quantity: new Decimal("2.5"), costPerUnit: null },
    ];
    expect(recipeUnitCost(lines)).toBeNull();
  });
});
