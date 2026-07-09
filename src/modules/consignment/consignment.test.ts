import { describe, expect, it } from "vitest";
import {
  allocateFreshestFirst,
  buildReconLines,
  nextDnNumber,
  parseCountQty,
  parsePlacementQty,
  strandedBottles,
  type AllocatableLot,
} from "./logic";

describe("nextDnNumber", () => {
  it("starts at DN-001", () => {
    expect(nextDnNumber(null)).toBe("DN-001");
  });

  it("increments and keeps padding", () => {
    expect(nextDnNumber("DN-001")).toBe("DN-002");
    expect(nextDnNumber("DN-099")).toBe("DN-100");
  });

  it("grows past three digits without truncating", () => {
    expect(nextDnNumber("DN-999")).toBe("DN-1000");
  });

  it("throws on an unrecognized format", () => {
    expect(() => nextDnNumber("INV-001")).toThrow();
  });
});

const lots: AllocatableLot[] = [
  { lotId: 1, brewBatchId: 10, expiryDate: new Date("2026-07-10"), qtyRemaining: 8 },
  { lotId: 2, brewBatchId: 11, expiryDate: new Date("2026-07-14"), qtyRemaining: 15 },
  { lotId: 3, brewBatchId: 12, expiryDate: new Date("2026-07-12"), qtyRemaining: 5 },
];

describe("allocateFreshestFirst", () => {
  it("defaults to the freshest lot (D19)", () => {
    const alloc = allocateFreshestFirst(lots, 10);
    expect(alloc).toEqual([
      { lotId: 2, brewBatchId: 11, expiryDate: new Date("2026-07-14"), qty: 10 },
    ]);
  });

  it("spans to the next-freshest lot when one can't cover it", () => {
    const alloc = allocateFreshestFirst(lots, 18);
    expect(alloc.map((a) => [a.lotId, a.qty])).toEqual([
      [2, 15],
      [3, 3],
    ]);
  });

  it("lets a preferred lot jump the queue, remainder freshest-first", () => {
    const alloc = allocateFreshestFirst(lots, 10, 1);
    expect(alloc.map((a) => [a.lotId, a.qty])).toEqual([
      [1, 8],
      [2, 2],
    ]);
  });

  it("throws when total warehouse stock is short (invariant 3)", () => {
    expect(() => allocateFreshestFirst(lots, 29)).toThrow(/28 bottle/);
  });

  it("rejects zero, negative, and fractional quantities", () => {
    expect(() => allocateFreshestFirst(lots, 0)).toThrow();
    expect(() => allocateFreshestFirst(lots, -3)).toThrow();
    expect(() => allocateFreshestFirst(lots, 2.5)).toThrow();
  });
});

describe("strandedBottles", () => {
  it("warns when older sellable bottles are left behind", () => {
    const alloc = allocateFreshestFirst(lots, 10); // takes lot 2 only
    const stranded = strandedBottles(lots, alloc);
    expect(stranded).toEqual({
      count: 13, // lot 1 (8) + lot 3 (5) both expire before lot 2
      soonestExpiry: new Date("2026-07-10"),
    });
  });

  it("returns null when nothing older is left behind", () => {
    const alloc = allocateFreshestFirst(lots, 28); // everything
    expect(strandedBottles(lots, alloc)).toBeNull();
  });

  it("does not count leftovers in the allocated batch itself", () => {
    const single: AllocatableLot[] = [
      { lotId: 9, brewBatchId: 20, expiryDate: new Date("2026-07-14"), qtyRemaining: 30 },
    ];
    const alloc = allocateFreshestFirst(single, 10);
    expect(strandedBottles(single, alloc)).toBeNull();
  });
});

describe("parsePlacementQty", () => {
  it("treats blank and zero as 'not placing this SKU'", () => {
    expect(parsePlacementQty("")).toBeNull();
    expect(parsePlacementQty("0")).toBeNull();
  });

  it("parses whole numbers and rejects fractions/garbage", () => {
    expect(parsePlacementQty("12")).toBe(12);
    expect(() => parsePlacementQty("2.5")).toThrow();
    expect(() => parsePlacementQty("abc")).toThrow();
    expect(() => parsePlacementQty("-4")).toThrow();
  });
});

describe("parseCountQty", () => {
  it("treats blank as zero", () => {
    expect(parseCountQty("")).toBe(0);
    expect(parseCountQty("  ")).toBe(0);
  });

  it("parses whole numbers and rejects fractions/garbage/negatives", () => {
    expect(parseCountQty("7")).toBe(7);
    expect(() => parseCountQty("1.5")).toThrow();
    expect(() => parseCountQty("-2")).toThrow();
    expect(() => parseCountQty("x")).toThrow();
  });
});

describe("buildReconLines", () => {
  it("derives sold = placed − expired − damaged (invariant 2)", () => {
    const [line] = buildReconLines([
      { productId: 1, qtyPlaced: 20, qtyExpired: 3, qtyDamaged: 1 },
    ]);
    expect(line.qtySold).toBe(16);
    expect(line.qtySold + line.qtyExpired + line.qtyDamaged).toBe(line.qtyPlaced);
  });

  it("allows a full sell-through (nothing collected)", () => {
    const [line] = buildReconLines([
      { productId: 1, qtyPlaced: 12, qtyExpired: 0, qtyDamaged: 0 },
    ]);
    expect(line.qtySold).toBe(12);
  });

  it("allows a total loss (everything collected)", () => {
    const [line] = buildReconLines([
      { productId: 1, qtyPlaced: 10, qtyExpired: 8, qtyDamaged: 2 },
    ]);
    expect(line.qtySold).toBe(0);
  });

  it("throws when collected exceeds placed", () => {
    expect(() =>
      buildReconLines([{ productId: 1, qtyPlaced: 5, qtyExpired: 4, qtyDamaged: 2 }])
    ).toThrow(/Collected 6/);
  });

  it("throws on negative inputs", () => {
    expect(() =>
      buildReconLines([{ productId: 1, qtyPlaced: 5, qtyExpired: -1, qtyDamaged: 0 }])
    ).toThrow();
  });
});
