// Pure functions only — no DB calls, no side effects. See CLAUDE.md rule 4.

/** Every flavour is bottled in both sizes; adding a flavour generates both SKUs. */
export const SIZES_ML = [250, 350] as const;
export type SizeMl = (typeof SIZES_ML)[number];

/**
 * SKU code = flavour-name initials + size, e.g. "Osmanthus oolong" × 350 → "OO-350".
 * Must stay in sync with the seed's convention (prisma/seed.ts).
 */
export function skuCode(flavourName: string, sizeMl: number): string {
  const initials = flavourName
    .trim()
    .split(/\s+/)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return `${initials}-${sizeMl}`;
}

/** Validates raw "add flavour" form input into a clean flavour name. Throws on invalid input. */
export function parseFlavourNameInput(raw: string): string {
  const name = raw.trim().replace(/\s+/g, " ");
  if (name === "") {
    throw new Error("Enter a flavour name.");
  }
  if (name.length > 60) {
    throw new Error("Flavour name must be 60 characters or fewer.");
  }
  if (!/^[\p{L}\p{N}][\p{L}\p{N} '&-]*$/u.test(name)) {
    throw new Error("Flavour name contains unsupported characters.");
  }
  return name;
}
