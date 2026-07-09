// Pure functions only — no DB calls, no side effects. See CLAUDE.md rule 4.

/** Next sequential delivery-note number: "DN-001", "DN-002", … never reused. */
export function nextDnNumber(lastDnNumber: string | null): string {
  if (!lastDnNumber) return "DN-001";
  const match = /^DN-(\d+)$/.exec(lastDnNumber);
  if (!match) {
    throw new Error(`Unrecognized delivery note number: ${lastDnNumber}`);
  }
  const next = Number(match[1]) + 1;
  return `DN-${String(next).padStart(3, "0")}`;
}

export type AllocatableLot = {
  lotId: number;
  brewBatchId: number;
  expiryDate: Date;
  qtyRemaining: number;
};

export type LotAllocation = {
  lotId: number;
  brewBatchId: number;
  expiryDate: Date;
  qty: number;
};

/**
 * Allocates a placement quantity across warehouse lots, freshest batch first
 * (D19 — longest shelf life at the partner). Spans to the next-freshest lot
 * when one lot can't cover the quantity. `preferredLotId` lets the operator
 * pull from a specific lot first (the "change if necessary" option); any
 * remainder still fills freshest-first. Throws when total stock is short.
 */
export function allocateFreshestFirst(
  lots: AllocatableLot[],
  qty: number,
  preferredLotId?: number
): LotAllocation[] {
  if (!Number.isInteger(qty) || qty <= 0) {
    throw new Error("Quantity must be a positive whole number.");
  }

  const available = lots.filter((l) => l.qtyRemaining > 0);
  const totalAvailable = available.reduce((s, l) => s + l.qtyRemaining, 0);
  if (totalAvailable < qty) {
    throw new Error(
      `Only ${totalAvailable} bottle(s) in the warehouse — ${qty} requested.`
    );
  }

  // Freshest first = latest expiry first; preferred lot jumps the queue.
  const ordered = [...available].sort((a, b) => {
    if (a.lotId === preferredLotId) return -1;
    if (b.lotId === preferredLotId) return 1;
    return b.expiryDate.getTime() - a.expiryDate.getTime();
  });

  const allocations: LotAllocation[] = [];
  let remaining = qty;
  for (const lot of ordered) {
    if (remaining === 0) break;
    const take = Math.min(lot.qtyRemaining, remaining);
    allocations.push({
      lotId: lot.lotId,
      brewBatchId: lot.brewBatchId,
      expiryDate: lot.expiryDate,
      qty: take,
    });
    remaining -= take;
  }
  return allocations;
}

/**
 * Bottles stranded by an allocation: stock in lots that expire SOONER than
 * the oldest allocated lot and are left behind. B2C is brew-to-order, so
 * stranded warehouse bottles have no other outlet (D19 warning).
 */
export function strandedBottles(
  lots: AllocatableLot[],
  allocations: LotAllocation[]
): { count: number; soonestExpiry: Date } | null {
  if (allocations.length === 0) return null;
  const oldestAllocated = Math.min(
    ...allocations.map((a) => a.expiryDate.getTime())
  );
  const taken = new Map(allocations.map((a) => [a.lotId, a.qty]));

  let count = 0;
  let soonest: Date | null = null;
  for (const lot of lots) {
    const left = lot.qtyRemaining - (taken.get(lot.lotId) ?? 0);
    if (left > 0 && lot.expiryDate.getTime() < oldestAllocated) {
      count += left;
      if (!soonest || lot.expiryDate < soonest) soonest = lot.expiryDate;
    }
  }
  return count > 0 && soonest ? { count, soonestExpiry: soonest } : null;
}

/** Parses a count field (expired/damaged): blank means 0, must be a whole number. */
export function parseCountQty(raw: string): number {
  const trimmed = raw.trim();
  if (trimmed === "") return 0;
  if (!/^\d+$/.test(trimmed)) {
    throw new Error("Counts must be whole numbers.");
  }
  return Number(trimmed);
}

export type CountLineInput = {
  productId: number;
  qtyPlaced: number; // bottles at the site when the count starts
  qtyExpired: number;
  qtyDamaged: number;
};

export type ReconLine = CountLineInput & { qtySold: number };

/**
 * Derives sold per line and enforces invariant 2:
 * qtyPlaced = qtySold + qtyExpired + qtyDamaged (D4, D5 — every count
 * closes the shelf out; whatever wasn't collected was sold).
 * Throws when collected bottles exceed what was placed.
 */
export function buildReconLines(lines: CountLineInput[]): ReconLine[] {
  return lines.map((l) => {
    if (l.qtyExpired < 0 || l.qtyDamaged < 0 || l.qtyPlaced < 0) {
      throw new Error("Counts cannot be negative.");
    }
    const collected = l.qtyExpired + l.qtyDamaged;
    if (collected > l.qtyPlaced) {
      throw new Error(
        `Collected ${collected} bottle(s) but only ${l.qtyPlaced} were placed — recheck the count.`
      );
    }
    return { ...l, qtySold: l.qtyPlaced - collected };
  });
}

/** Validates a per-SKU placement quantity field; empty means "not placing". */
export function parsePlacementQty(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  if (!/^\d+$/.test(trimmed)) {
    throw new Error("Quantities must be whole numbers.");
  }
  const qty = Number(trimmed);
  if (qty === 0) return null;
  return qty;
}
