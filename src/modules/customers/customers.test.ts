import { describe, expect, it } from "vitest";
import { parsePartnerInput, partnerDeactivationBlockReason } from "./logic";

describe("parsePartnerInput", () => {
  it("trims fields and returns null for blank optionals", () => {
    expect(parsePartnerInput("  Kopi Tiam Bangsar ", " ", "  ", "")).toEqual({
      name: "Kopi Tiam Bangsar",
      phone: null,
      email: null,
      paymentTermsDays: 14,
    });
  });

  it("keeps provided phone, email, and terms", () => {
    expect(
      parsePartnerInput("Outlet", "012-3456789", "hi@outlet.com", "30")
    ).toEqual({
      name: "Outlet",
      phone: "012-3456789",
      email: "hi@outlet.com",
      paymentTermsDays: 30,
    });
  });

  it("rejects a blank name", () => {
    expect(() => parsePartnerInput("  ", "", "", "")).toThrow();
  });

  it("rejects a malformed email but allows blank", () => {
    expect(() => parsePartnerInput("Outlet", "", "not-an-email", "")).toThrow();
    expect(parsePartnerInput("Outlet", "", "", "").email).toBeNull();
  });

  it("rejects non-integer or out-of-range payment terms", () => {
    expect(() => parsePartnerInput("Outlet", "", "", "14.5")).toThrow();
    expect(() => parsePartnerInput("Outlet", "", "", "-1")).toThrow();
    expect(() => parsePartnerInput("Outlet", "", "", "400")).toThrow();
  });

  it("defaults empty terms to Net 14 (D7)", () => {
    expect(parsePartnerInput("Outlet", "", "", "").paymentTermsDays).toBe(14);
  });
});

describe("partnerDeactivationBlockReason", () => {
  it("allows deactivation when no stock sits at the partner's sites", () => {
    expect(partnerDeactivationBlockReason(0)).toBeNull();
  });

  it("blocks deactivation while consignment stock remains", () => {
    expect(partnerDeactivationBlockReason(12)).toContain("12 bottle(s)");
  });
});
