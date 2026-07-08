// Pure functions only — no DB calls, no side effects. See CLAUDE.md rule 4.

export type PartnerInput = {
  name: string;
  phone: string | null;
  email: string | null;
  paymentTermsDays: number;
};

/**
 * Validates the add/edit partner form. Name is required; phone and email are
 * optional; payment terms default to Net 14 (D7) and must be 0–365 days.
 * Throws on invalid input.
 */
export function parsePartnerInput(
  name: string,
  phone: string,
  email: string,
  paymentTermsDays: string
): PartnerInput {
  const trimmedName = name.trim();
  if (trimmedName === "") {
    throw new Error("Enter the partner / outlet name.");
  }

  const trimmedEmail = email.trim();
  if (trimmedEmail !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    throw new Error("Enter a valid email address, or leave it blank.");
  }

  const trimmedTerms = paymentTermsDays.trim();
  const terms = trimmedTerms === "" ? 14 : Number(trimmedTerms);
  if (!Number.isInteger(terms) || terms < 0 || terms > 365) {
    throw new Error("Payment terms must be a whole number of days (0–365).");
  }

  return {
    name: trimmedName,
    phone: phone.trim() || null,
    email: trimmedEmail || null,
    paymentTermsDays: terms,
  };
}

/**
 * A partner holding unsold consignment stock cannot be deactivated — those
 * bottles would vanish from stock tracking. Returns the blocking message,
 * or null when deactivation is allowed.
 */
export function partnerDeactivationBlockReason(bottlesAtSites: number): string | null {
  if (bottlesAtSites <= 0) return null;
  return `${bottlesAtSites} bottle(s) still sit at this partner's site. Reconcile or collect them first.`;
}
