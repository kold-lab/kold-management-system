"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireWriter } from "@/lib/auth";
import {
  allocateFreshestFirst,
  buildReconLines,
  nextDnNumber,
  parseCountQty,
  parsePlacementQty,
  type LotAllocation,
} from "./logic";
import { getSiteStockForCount, warehouseLotsFor } from "./queries";

export type CreatePlacementState = { error?: string };

/**
 * Records a drop-off: moves bottles from warehouse lots (freshest-first,
 * D19, with optional per-SKU lot override) into lots at the partner's site,
 * grouped under one sequential delivery note. Stock movements are posted
 * records (rule 5) — the lot decrements plus AuditLog entry ARE the record.
 */
export async function createPlacementAction(
  _prevState: CreatePlacementState,
  formData: FormData
): Promise<CreatePlacementState> {
  let actor;
  try {
    actor = await requireWriter();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not signed in." };
  }

  const partnerId = Number(formData.get("partnerId"));
  if (!Number.isInteger(partnerId) || partnerId <= 0) {
    return { error: "Pick a partner." };
  }

  const partner = await prisma.customer.findUnique({
    where: { id: partnerId },
    include: { locations: { where: { type: "PARTNER_SITE", isActive: true } } },
  });
  if (!partner || !partner.isActive || partner.type !== "B2B_PARTNER") {
    return { error: "Unknown partner." };
  }
  const site = partner.locations[0];
  if (!site) {
    return { error: "This partner has no active site location." };
  }

  const deliveredAtRaw = String(formData.get("deliveredAt") ?? "").trim();
  const deliveredAt = deliveredAtRaw ? new Date(`${deliveredAtRaw}T00:00:00Z`) : new Date();
  if (Number.isNaN(deliveredAt.getTime())) {
    return { error: "Invalid delivery date." };
  }
  const notes = String(formData.get("notes") ?? "").trim() || null;

  // Collect requested lines: qty-<productId> plus optional lot-<productId>.
  const requests: Array<{ productId: number; qty: number; preferredLotId?: number }> = [];
  try {
    for (const [key, value] of formData.entries()) {
      if (!key.startsWith("qty-")) continue;
      const productId = Number(key.slice(4));
      if (!Number.isInteger(productId) || productId <= 0) continue;
      const qty = parsePlacementQty(String(value));
      if (qty === null) continue;
      const lotRaw = String(formData.get(`lot-${productId}`) ?? "").trim();
      const preferredLotId = lotRaw ? Number(lotRaw) : undefined;
      requests.push({ productId, qty, preferredLotId });
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid quantity." };
  }

  if (requests.length === 0) {
    return { error: "Enter a quantity for at least one SKU." };
  }

  let dnId = 0;
  try {
    await prisma.$transaction(async (tx) => {
      // Allocate inside the transaction so lot balances are re-checked.
      const allocationsByProduct: Array<{
        productId: number;
        allocations: LotAllocation[];
      }> = [];
      for (const req of requests) {
        const lots = await warehouseLotsFor(req.productId);
        allocationsByProduct.push({
          productId: req.productId,
          allocations: allocateFreshestFirst(lots, req.qty, req.preferredLotId),
        });
      }

      const last = await tx.deliveryNote.findFirst({
        orderBy: { id: "desc" },
        select: { dnNumber: true },
      });
      const dn = await tx.deliveryNote.create({
        data: {
          dnNumber: nextDnNumber(last?.dnNumber ?? null),
          customerId: partner.id,
          locationId: site.id,
          deliveredAt,
          notes,
        },
      });
      dnId = dn.id;

      for (const { productId, allocations } of allocationsByProduct) {
        for (const alloc of allocations) {
          // Guarded decrement — refuses to go negative even under a race.
          const updated = await tx.finishedLot.updateMany({
            where: { id: alloc.lotId, qtyRemaining: { gte: alloc.qty } },
            data: { qtyRemaining: { decrement: alloc.qty } },
          });
          if (updated.count !== 1) {
            throw new Error("Stock changed while saving — try again.");
          }
          await tx.finishedLot.create({
            data: {
              brewBatchId: alloc.brewBatchId,
              locationId: site.id,
              qtyRemaining: alloc.qty,
              expiryDate: alloc.expiryDate,
            },
          });
          await tx.consignmentPlacement.create({
            data: {
              deliveryNoteId: dn.id,
              customerId: partner.id,
              locationId: site.id,
              productId,
              brewBatchId: alloc.brewBatchId,
              qtyPlaced: alloc.qty,
              expiryDate: alloc.expiryDate,
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          userId: actor.id,
          action: "placement.create",
          entity: "DeliveryNote",
          entityId: String(dn.id),
          detail: {
            dnNumber: dn.dnNumber,
            partner: partner.name,
            deliveredAt: deliveredAt.toISOString().slice(0, 10),
            lines: allocationsByProduct.flatMap((p) =>
              p.allocations.map((a) => ({
                productId: p.productId,
                lotId: a.lotId,
                qty: a.qty,
                expiryDate: a.expiryDate.toISOString().slice(0, 10),
              }))
            ),
          },
        },
      });
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Placement failed." };
  }

  revalidatePath("/placements");
  revalidatePath("/partners");
  revalidatePath("/stock");
  revalidatePath("/");
  redirect(`/placements/${dnId}/note`);
}

export type SaveCountState = { error?: string };

/**
 * Saves a weekly count. "draft" keeps it editable (rule 5); "sign_off"
 * locks it with the partner rep's acknowledgement and closes out the
 * shelf — every count collects all unsold bottles, so the partner-site
 * lots are zeroed (sold bottles are gone, expired/damaged came home as
 * the brand's recorded loss, D4). Lines enforce invariant 2 via
 * buildReconLines. Re-submitting an existing draft updates it.
 */
export async function saveCountAction(
  _prevState: SaveCountState,
  formData: FormData
): Promise<SaveCountState> {
  let actor;
  try {
    actor = await requireWriter();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not signed in." };
  }

  const mode = String(formData.get("mode") ?? "");
  if (mode !== "draft" && mode !== "sign_off") {
    return { error: "Unknown save mode." };
  }

  const partnerId = Number(formData.get("partnerId"));
  if (!Number.isInteger(partnerId) || partnerId <= 0) {
    return { error: "Pick a partner." };
  }

  const draftIdRaw = String(formData.get("draftId") ?? "").trim();
  const draftId = draftIdRaw ? Number(draftIdRaw) : null;

  const reconDateRaw = String(formData.get("reconDate") ?? "").trim();
  const reconDate = reconDateRaw ? new Date(`${reconDateRaw}T00:00:00Z`) : new Date();
  if (Number.isNaN(reconDate.getTime())) {
    return { error: "Invalid count date." };
  }

  const signedOffBy = String(formData.get("signedOffBy") ?? "").trim();
  if (mode === "sign_off" && signedOffBy === "") {
    return { error: "Enter the partner rep's name to sign off." };
  }

  const site = await getSiteStockForCount(partnerId);
  if (!site) return { error: "Unknown partner." };
  if (site.lines.length === 0) {
    return { error: "Nothing is placed at this partner right now." };
  }

  let reconLines;
  try {
    reconLines = buildReconLines(
      site.lines.map((l) => ({
        productId: l.productId,
        qtyPlaced: l.qtyPlaced,
        qtyExpired: parseCountQty(String(formData.get(`expired-${l.productId}`) ?? "")),
        qtyDamaged: parseCountQty(String(formData.get(`damaged-${l.productId}`) ?? "")),
      }))
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid count." };
  }

  let reconId = 0;
  try {
    await prisma.$transaction(async (tx) => {
      if (draftId) {
        const existing = await tx.reconciliation.findUnique({ where: { id: draftId } });
        if (!existing || existing.status !== "DRAFT" || existing.customerId !== partnerId) {
          throw new Error("Draft not found or already signed off.");
        }
        await tx.reconciliationLine.deleteMany({ where: { reconciliationId: draftId } });
      }

      const recon = draftId
        ? await tx.reconciliation.update({
            where: { id: draftId },
            data: {
              reconDate,
              status: mode === "sign_off" ? "SIGNED_OFF" : "DRAFT",
              signedOffBy: mode === "sign_off" ? signedOffBy : null,
            },
          })
        : await tx.reconciliation.create({
            data: {
              customerId: partnerId,
              locationId: site.locationId,
              reconDate,
              status: mode === "sign_off" ? "SIGNED_OFF" : "DRAFT",
              signedOffBy: mode === "sign_off" ? signedOffBy : null,
            },
          });
      reconId = recon.id;

      await tx.reconciliationLine.createMany({
        data: reconLines.map((l) => ({
          reconciliationId: recon.id,
          productId: l.productId,
          qtyPlaced: l.qtyPlaced,
          qtySold: l.qtySold,
          qtyExpired: l.qtyExpired,
          qtyDamaged: l.qtyDamaged,
        })),
      });

      if (mode === "sign_off") {
        // Shelf closes out: every bottle is accounted for in the lines.
        await tx.finishedLot.updateMany({
          where: { locationId: site.locationId, qtyRemaining: { gt: 0 } },
          data: { qtyRemaining: 0 },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: actor.id,
          action: mode === "sign_off" ? "reconciliation.sign_off" : "reconciliation.save_draft",
          entity: "Reconciliation",
          entityId: String(recon.id),
          detail: {
            partner: site.partnerName,
            reconDate: reconDate.toISOString().slice(0, 10),
            ...(mode === "sign_off" ? { signedOffBy } : {}),
            lines: reconLines.map((l) => ({
              productId: l.productId,
              placed: l.qtyPlaced,
              sold: l.qtySold,
              expired: l.qtyExpired,
              damaged: l.qtyDamaged,
            })),
          },
        },
      });
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Count failed." };
  }

  revalidatePath("/counts");
  revalidatePath("/partners");
  revalidatePath("/stock");
  revalidatePath("/");
  redirect(`/counts/${reconId}`);
}
