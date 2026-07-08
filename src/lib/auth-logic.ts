// Pure role rules — no DB calls, no side effects.
import type { Role } from "@prisma/client";

/**
 * Phase 1 role gate: ADMIN and OPS run the make side and may mutate.
 * FINANCE is read-only until Phase 3; PARTNER is portal-only (Phase 2).
 */
export function canMutate(role: Role): boolean {
  return role === "ADMIN" || role === "OPS";
}

/** The first user ever to sign in bootstraps as ADMIN; everyone after is OPS. */
export function roleForNewUser(existingUserCount: number): Role {
  return existingUserCount === 0 ? "ADMIN" : "OPS";
}
