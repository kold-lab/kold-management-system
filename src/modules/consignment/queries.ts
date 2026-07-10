import "server-only";
import { prisma } from "@/lib/prisma";
import { daysToExpiry, expiryStatus, type ExpiryStatus } from "@/modules/production";
import type { AllocatableLot } from "./logic";

export type PlacementPartnerOption = { id: number; name: string };

export type PlacementProductOption = {
  productId: number;
  skuCode: string;
  label: string;
  warehouseQty: number;
  lots: Array<{
    lotId: number;
    expiryDate: string; // ISO date — serializable for the client form
    qtyRemaining: number;
    brewDate: string;
  }>;
};

/** Partners + per-SKU warehouse lots for the new-placement form. */
export async function getPlacementOptions(): Promise<{
  partners: PlacementPartnerOption[];
  products: PlacementProductOption[];
}> {
  const [partners, products] = await Promise.all([
    prisma.customer.findMany({
      where: { type: "B2B_PARTNER", isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      include: {
        flavour: true,
        brewBatches: {
          include: {
            lots: {
              where: { qtyRemaining: { gt: 0 }, location: { type: "WAREHOUSE" } },
            },
          },
        },
      },
      orderBy: { skuCode: "asc" },
    }),
  ]);

  return {
    partners,
    products: products
      .map((p) => {
        const lots = p.brewBatches
          .flatMap((b) =>
            b.lots.map((l) => ({
              lotId: l.id,
              expiryDate: l.expiryDate.toISOString().slice(0, 10),
              qtyRemaining: l.qtyRemaining,
              brewDate: b.brewDate.toISOString().slice(0, 10),
            }))
          )
          .sort((a, b) => (a.expiryDate < b.expiryDate ? 1 : -1)); // freshest first
        return {
          productId: p.id,
          skuCode: p.skuCode,
          label: `${p.flavour.name} ${p.sizeMl}ml`,
          warehouseQty: lots.reduce((s, l) => s + l.qtyRemaining, 0),
          lots,
        };
      })
      .filter((p) => p.warehouseQty > 0),
  };
}

/** Warehouse lots of one product as allocation input (server-side re-check). */
export async function warehouseLotsFor(productId: number): Promise<AllocatableLot[]> {
  const lots = await prisma.finishedLot.findMany({
    where: {
      qtyRemaining: { gt: 0 },
      location: { type: "WAREHOUSE" },
      brewBatch: { productId },
    },
    include: { brewBatch: { select: { id: true } } },
  });
  return lots.map((l) => ({
    lotId: l.id,
    brewBatchId: l.brewBatch.id,
    expiryDate: l.expiryDate,
    qtyRemaining: l.qtyRemaining,
  }));
}

export type DeliveryNoteListItem = {
  id: number;
  dnNumber: string;
  partnerName: string;
  deliveredAt: string;
  totalBottles: number;
  skuSummary: string;
};

export async function listDeliveryNotes(): Promise<DeliveryNoteListItem[]> {
  const notes = await prisma.deliveryNote.findMany({
    include: {
      customer: { select: { name: true } },
      placements: { include: { product: { include: { flavour: true } } } },
    },
    orderBy: { id: "desc" },
  });
  return notes.map((n) => ({
    id: n.id,
    dnNumber: n.dnNumber,
    partnerName: n.customer.name,
    deliveredAt: n.deliveredAt.toISOString().slice(0, 10),
    totalBottles: n.placements.reduce((s, p) => s + p.qtyPlaced, 0),
    skuSummary: n.placements
      .map((p) => `${p.qtyPlaced}× ${p.product.skuCode}`)
      .join(", "),
  }));
}

export type DeliveryNoteDetail = {
  id: number;
  dnNumber: string;
  deliveredAt: string;
  notes: string | null;
  partner: { name: string; phone: string | null; email: string | null };
  lines: Array<{
    label: string;
    skuCode: string;
    qty: number;
    expiryDate: string;
  }>;
  totalBottles: number;
};

export async function getDeliveryNote(id: number): Promise<DeliveryNoteDetail | null> {
  const note = await prisma.deliveryNote.findUnique({
    where: { id },
    include: {
      customer: true,
      placements: { include: { product: { include: { flavour: true } } } },
    },
  });
  if (!note) return null;
  return {
    id: note.id,
    dnNumber: note.dnNumber,
    deliveredAt: note.deliveredAt.toISOString().slice(0, 10),
    notes: note.notes,
    partner: {
      name: note.customer.name,
      phone: note.customer.phone,
      email: note.customer.email,
    },
    lines: note.placements.map((p) => ({
      label: `${p.product.flavour.name} ${p.product.sizeMl}ml`,
      skuCode: p.product.skuCode,
      qty: p.qtyPlaced,
      expiryDate: p.expiryDate.toISOString().slice(0, 10),
    })),
    totalBottles: note.placements.reduce((s, p) => s + p.qtyPlaced, 0),
  };
}

// ── weekly counts ──

export type CountSiteStock = {
  partnerId: number;
  partnerName: string;
  locationId: number;
  lines: Array<{
    productId: number;
    skuCode: string;
    label: string;
    qtyPlaced: number;
  }>;
};

/** Bottles currently at a partner's site, grouped per SKU — the count's base. */
export async function getSiteStockForCount(partnerId: number): Promise<CountSiteStock | null> {
  const partner = await prisma.customer.findUnique({
    where: { id: partnerId },
    include: {
      locations: {
        where: { type: "PARTNER_SITE", isActive: true },
        include: {
          lots: {
            where: { qtyRemaining: { gt: 0 } },
            include: { brewBatch: { include: { product: { include: { flavour: true } } } } },
          },
        },
      },
    },
  });
  if (!partner || !partner.isActive || partner.type !== "B2B_PARTNER") return null;
  const site = partner.locations[0];
  if (!site) return null;

  const byProduct = new Map<number, { skuCode: string; label: string; qtyPlaced: number }>();
  for (const lot of site.lots) {
    const p = lot.brewBatch.product;
    const entry = byProduct.get(p.id) ?? {
      skuCode: p.skuCode,
      label: `${p.flavour.name} ${p.sizeMl}ml`,
      qtyPlaced: 0,
    };
    entry.qtyPlaced += lot.qtyRemaining;
    byProduct.set(p.id, entry);
  }

  return {
    partnerId: partner.id,
    partnerName: partner.name,
    locationId: site.id,
    lines: [...byProduct.entries()]
      .map(([productId, e]) => ({ productId, ...e }))
      .sort((a, b) => a.skuCode.localeCompare(b.skuCode)),
  };
}

export type ReconListItem = {
  id: number;
  partnerName: string;
  reconDate: string;
  status: "DRAFT" | "SIGNED_OFF";
  totalSold: number;
  totalExpired: number;
  totalDamaged: number;
};

export async function listReconciliations(): Promise<ReconListItem[]> {
  const recons = await prisma.reconciliation.findMany({
    include: { customer: { select: { name: true } }, lines: true },
    orderBy: { id: "desc" },
  });
  return recons.map((r) => ({
    id: r.id,
    partnerName: r.customer.name,
    reconDate: r.reconDate.toISOString().slice(0, 10),
    status: r.status,
    totalSold: r.lines.reduce((s, l) => s + l.qtySold, 0),
    totalExpired: r.lines.reduce((s, l) => s + l.qtyExpired, 0),
    totalDamaged: r.lines.reduce((s, l) => s + l.qtyDamaged, 0),
  }));
}

export type ReconDetail = {
  id: number;
  partnerId: number;
  partnerName: string;
  reconDate: string;
  status: "DRAFT" | "SIGNED_OFF";
  signedOffBy: string | null;
  lines: Array<{
    productId: number;
    skuCode: string;
    label: string;
    qtyPlaced: number;
    qtySold: number;
    qtyExpired: number;
    qtyDamaged: number;
  }>;
};

export async function getReconciliation(id: number): Promise<ReconDetail | null> {
  const r = await prisma.reconciliation.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true } },
      lines: { include: { product: { include: { flavour: true } } } },
    },
  });
  if (!r) return null;
  return {
    id: r.id,
    partnerId: r.customer.id,
    partnerName: r.customer.name,
    reconDate: r.reconDate.toISOString().slice(0, 10),
    status: r.status,
    signedOffBy: r.signedOffBy,
    lines: r.lines.map((l) => ({
      productId: l.productId,
      skuCode: l.product.skuCode,
      label: `${l.product.flavour.name} ${l.product.sizeMl}ml`,
      qtyPlaced: l.qtyPlaced,
      qtySold: l.qtySold,
      qtyExpired: l.qtyExpired,
      qtyDamaged: l.qtyDamaged,
    })),
  };
}

// ── partner pilot (bird's-eye view) ──

export type PartnerPilotCard = {
  partnerId: number;
  partnerName: string;
  phone: string | null;
  email: string | null;
  paymentTermsDays: number;
  totalBottles: number;
  worstStatus: ExpiryStatus | null; // null when the shelf is empty
  soonestExpiry: string | null;
  lastCount: { reconDate: string; status: "DRAFT" | "SIGNED_OFF" } | null;
  lines: Array<{
    label: string;
    qty: number;
    expiryDate: string;
    status: ExpiryStatus;
  }>;
};

const STATUS_RANK: Record<ExpiryStatus, number> = {
  expired: 0,
  today: 1,
  soon: 2,
  ok: 3,
};

/** Every active partner with what sits on their shelf, expiry-watched. */
export async function getPartnerPilot(): Promise<PartnerPilotCard[]> {
  const today = new Date();
  const partners = await prisma.customer.findMany({
    where: { type: "B2B_PARTNER", isActive: true },
    include: {
      locations: {
        where: { type: "PARTNER_SITE" },
        include: {
          lots: {
            where: { qtyRemaining: { gt: 0 } },
            include: {
              brewBatch: { include: { product: { include: { flavour: true } } } },
            },
          },
        },
      },
      recons: { orderBy: { id: "desc" }, take: 1 },
    },
    orderBy: { name: "asc" },
  });

  const cards = partners.map((p) => {
    const lots = p.locations.flatMap((l) => l.lots);
    const lines = lots
      .map((lot) => {
        const days = daysToExpiry(lot.expiryDate, today);
        return {
          label: `${lot.brewBatch.product.flavour.name} ${lot.brewBatch.product.sizeMl}ml`,
          qty: lot.qtyRemaining,
          expiryDate: lot.expiryDate.toISOString().slice(0, 10),
          status: expiryStatus(days),
        };
      })
      .sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status]);

    const worstStatus = lines.length
      ? lines.reduce(
          (worst, l) => (STATUS_RANK[l.status] < STATUS_RANK[worst] ? l.status : worst),
          lines[0].status
        )
      : null;

    const recon = p.recons[0];
    return {
      partnerId: p.id,
      partnerName: p.name,
      phone: p.phone,
      email: p.email,
      paymentTermsDays: p.paymentTermsDays,
      totalBottles: lines.reduce((s, l) => s + l.qty, 0),
      worstStatus,
      soonestExpiry: lines.length
        ? lines.reduce((min, l) => (l.expiryDate < min ? l.expiryDate : min), lines[0].expiryDate)
        : null,
      lastCount: recon
        ? { reconDate: recon.reconDate.toISOString().slice(0, 10), status: recon.status }
        : null,
      lines,
    };
  });

  // Most urgent shelves first; empty shelves last.
  return cards.sort((a, b) => {
    const ra = a.worstStatus ? STATUS_RANK[a.worstStatus] : 99;
    const rb = b.worstStatus ? STATUS_RANK[b.worstStatus] : 99;
    return ra - rb || a.partnerName.localeCompare(b.partnerName);
  });
}
