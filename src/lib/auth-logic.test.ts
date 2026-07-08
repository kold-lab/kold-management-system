import { describe, expect, it } from "vitest";
import { canMutate, roleForNewUser } from "./auth-logic";

describe("canMutate", () => {
  it("allows ADMIN and OPS to mutate", () => {
    expect(canMutate("ADMIN")).toBe(true);
    expect(canMutate("OPS")).toBe(true);
  });

  it("blocks FINANCE and PARTNER from mutating in Phase 1", () => {
    expect(canMutate("FINANCE")).toBe(false);
    expect(canMutate("PARTNER")).toBe(false);
  });
});

describe("roleForNewUser", () => {
  it("bootstraps the first user ever as ADMIN", () => {
    expect(roleForNewUser(0)).toBe("ADMIN");
  });

  it("defaults every later user to OPS", () => {
    expect(roleForNewUser(1)).toBe("OPS");
    expect(roleForNewUser(42)).toBe("OPS");
  });
});
