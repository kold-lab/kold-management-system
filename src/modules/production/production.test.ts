import { describe, expect, it } from "vitest";
import { Decimal } from "@prisma/client/runtime/library";
import {
  batchUnitCost,
  computeExpiryDate,
  consumedQty,
  daysToExpiry,
  expiryStatus,
  parseBottleCountInput,
  parseBrewDateInput,
  parseWriteOffQty,
  parseWriteOffReason,
  remainingAfterConsumption,
} from "./logic";

describe("computeExpiryDate", () => {
  it("is always brewDate + 7 days (invariant 1)", () => {
    expect(
      computeExpiryDate(new Date("2026-07-07T00:00:00.000Z")).toISOString()
    ).toBe("2026-07-14T00:00:00.000Z");
  });

  it("rolls over month and year boundaries", () => {
    expect(
      computeExpiryDate(new Date("2026-07-28T00:00:00.000Z"))
        .toISOString()
        .slice(0, 10)
    ).toBe("2026-08-04");
    expect(
      computeExpiryDate(new Date("2026-12-28T00:00:00.000Z"))
        .toISOString()
        .slice(0, 10)
    ).toBe("2027-01-04");
  });
});

describe("parseBrewDateInput", () => {
  it("parses YYYY-MM-DD to a UTC-midnight date", () => {
    expect(parseBrewDateInput("2026-07-07").toISOString()).toBe(
      "2026-07-07T00:00:00.000Z"
    );
  });

  it("rejects malformed and impossible dates", () => {
    expect(() => parseBrewDateInput("07/07/2026")).toThrow();
    expect(() => parseBrewDateInput("2026-02-30")).toThrow();
    expect(() => parseBrewDateInput("")).toThrow();
  });
});

describe("parseBottleCountInput", () => {
  it("parses a positive integer", () => {
    expect(parseBottleCountInput("18", "actual bottles")).toBe(18);
  });

  it("rejects zero, negatives, decimals, and junk", () => {
    expect(() => parseBottleCountInput("0", "planned bottles")).toThrow();
    expect(() => parseBottleCountInput("-3", "planned bottles")).toThrow();
    expect(() => parseBottleCountInput("2.5", "planned bottles")).toThrow();
    expect(() => parseBottleCountInput("abc", "planned bottles")).toThrow();
  });
});

describe("batchUnitCost", () => {
  it("matches the documented 250ml jasmine unit cost (RM1.64, invariant 4)", () => {
    const lines = [
      { quantity: new Decimal("1"), costPerUnit: new Decimal("1.01") },
      { quantity: new Decimal("1"), costPerUnit: new Decimal("0.23") },
      { quantity: new Decimal("1"), costPerUnit: new Decimal("0.25") },
      { quantity: new Decimal("2.5"), costPerUnit: new Decimal("0.06") },
    ];
    expect(batchUnitCost(lines)!.toString()).toBe("1.64");
  });

  it("returns null for an empty recipe — no partial snapshots", () => {
    expect(batchUnitCost([])).toBeNull();
  });

  it("returns null when any material lacks a price effective on brew date", () => {
    const lines = [
      { quantity: new Decimal("1"), costPerUnit: new Decimal("1.01") },
      { quantity: new Decimal("2.5"), costPerUnit: null },
    ];
    expect(batchUnitCost(lines)).toBeNull();
  });
});

describe("consumedQty", () => {
  it("scales the per-bottle BOM quantity by actual yield", () => {
    expect(consumedQty(new Decimal("2.5"), 18).toString()).toBe("45");
    expect(consumedQty(new Decimal("1"), 18).toString()).toBe("18");
  });
});

describe("remainingAfterConsumption", () => {
  it("subtracts consumption from stock", () => {
    expect(
      remainingAfterConsumption(new Decimal("200"), new Decimal("45")).toString()
    ).toBe("155");
  });

  it("goes negative rather than blocking a brew that already happened", () => {
    const remaining = remainingAfterConsumption(
      new Decimal("30"),
      new Decimal("45")
    );
    expect(remaining.isNegative()).toBe(true);
    expect(remaining.toString()).toBe("-15");
  });
});

describe("daysToExpiry", () => {
  const today = new Date("2026-07-07T00:00:00.000Z");

  it("counts whole days until expiry", () => {
    expect(daysToExpiry(new Date("2026-07-14T00:00:00.000Z"), today)).toBe(7);
    expect(daysToExpiry(new Date("2026-07-08T00:00:00.000Z"), today)).toBe(1);
  });

  it("is 0 on expiry day and negative after", () => {
    expect(daysToExpiry(new Date("2026-07-07T00:00:00.000Z"), today)).toBe(0);
    expect(daysToExpiry(new Date("2026-07-05T00:00:00.000Z"), today)).toBe(-2);
  });
});

describe("expiryStatus", () => {
  it("buckets days-left into expired / today / soon / ok", () => {
    expect(expiryStatus(-1)).toBe("expired");
    expect(expiryStatus(0)).toBe("today");
    expect(expiryStatus(1)).toBe("soon");
    expect(expiryStatus(2)).toBe("soon");
    expect(expiryStatus(3)).toBe("ok");
    expect(expiryStatus(7)).toBe("ok");
  });
});

describe("parseWriteOffReason", () => {
  it("accepts the known reason codes", () => {
    expect(parseWriteOffReason("expired")).toBe("expired");
    expect(parseWriteOffReason("damaged")).toBe("damaged");
    expect(parseWriteOffReason("other")).toBe("other");
  });

  it("rejects anything else", () => {
    expect(() => parseWriteOffReason("")).toThrow();
    expect(() => parseWriteOffReason("shrinkage")).toThrow();
  });
});

describe("parseWriteOffQty", () => {
  it("parses a quantity within the lot's remaining bottles", () => {
    expect(parseWriteOffQty("5", 10)).toBe(5);
    expect(parseWriteOffQty("10", 10)).toBe(10);
  });

  it("never lets qtyRemaining go negative (invariant 3)", () => {
    expect(() => parseWriteOffQty("11", 10)).toThrow();
  });

  it("rejects zero, decimals, and junk", () => {
    expect(() => parseWriteOffQty("0", 10)).toThrow();
    expect(() => parseWriteOffQty("1.5", 10)).toThrow();
    expect(() => parseWriteOffQty("abc", 10)).toThrow();
  });
});
