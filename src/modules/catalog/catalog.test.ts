import { describe, expect, it } from "vitest";
import { parseFlavourNameInput, skuCode, SIZES_ML } from "./logic";

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
