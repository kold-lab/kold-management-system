"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { LocationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireWriter } from "@/lib/auth";
import { getRecipe } from "@/modules/catalog";
import { listMaterialCostsOn } from "@/modules/materials";
import {
  batchUnitCost,
  computeExpiryDate,
  consumedQty,
  parseBottleCountInput,
  parseBrewDateInput,
  parseWriteOffQty,
  parseWriteOffReason,
} from "./logic";

export type CreateBatchState = { error?: string };

/**
 * Records a brew: creates the batch (expiry computed, unit cost frozen from
 * prices effective on brew date — invariant 4), puts the bottles in a
 * warehouse FinishedLot, and consumes materials per BOM × actual yield.
 */
export async function createBrewBatchAction(
  _prevState: CreateBatchState,
  formData: FormData
): Promise<CreateBatchState> {
  let actor;
  try {
    actor = await requireWriter();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not signed in." };
  }

  const productId = Number(formData.get("productId"));
  if (!Number.isInteger(productId) || productId <= 0) {
    return { error: "Pick a SKU." };
  }

  let brewDate, qtyPlanned, qtyProduced;
  try {
    brewDate = parseBrewDateInput(String(formData.get("brewDate") ?? ""));
    qtyPlanned = parseBottleCountInput(
      String(formData.get("qtyPlanned") ?? ""),
      "planned bottles"
    );
    qtyProduced = parseBottleCountInput(
      String(formData.get("qtyProduced") ?? ""),
      "actual bottles"
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid input." };
  }

  const recipe = await getRecipe(productId);
  if (!recipe) return { error: "Unknown SKU." };
  if (recipe.lines.length === 0) {
    return { error: `${recipe.skuCode} has no recipe yet — set it in the catalog first.` };
  }

  const costs = await listMaterialCostsOn(brewDate);
  const unitCost = batchUnitCost(
    recipe.lines.map((l) => ({
      quantity: l.quantity,
      costPerUnit: costs.get(l.materialId) ?? null,
    }))
  );
  if (unitCost === null) {
    return {
      error:
        "A material in this recipe has no price effective on the brew date, so the cost snapshot can't be frozen.",
    };
  }

  const warehouse = await prisma.location.findFirst({
    where: { type: LocationType.WAREHOUSE, isActive: true },
  });
  if (!warehouse) {
    return { error: "No warehouse location exists — seed or create one first." };
  }

  const expiryDate = computeExpiryDate(brewDate);
  const consumption = recipe.lines.map((l) => ({
    materialId: l.materialId,
    materialName: l.materialName,
    unit: l.unit,
    consumed: consumedQty(l.quantity, qtyProduced),
  }));

  await prisma.$transaction(async (tx) => {
    const batch = await tx.brewBatch.create({
      data: {
        productId,
        brewDate,
        expiryDate,
        qtyPlanned,
        qtyProduced,
        unitCostSnapshot: unitCost,
        lots: {
          create: {
            locationId: warehouse.id,
            qtyRemaining: qtyProduced,
            expiryDate,
          },
        },
      },
    });
    for (const line of consumption) {
      await tx.material.update({
        where: { id: line.materialId },
        data: { stockQty: { decrement: line.consumed } },
      });
    }
    await tx.auditLog.create({
      data: {
        userId: actor.id,
        action: "brew_batch.create",
        entity: "BrewBatch",
        entityId: String(batch.id),
        detail: {
          skuCode: recipe.skuCode,
          brewDate: brewDate.toISOString().slice(0, 10),
          expiryDate: expiryDate.toISOString().slice(0, 10),
          qtyPlanned,
          qtyProduced,
          unitCostSnapshot: unitCost.toString(),
          consumed: consumption.map((c) => ({
            material: c.materialName,
            qty: c.consumed.toString(),
            unit: c.unit,
          })),
        },
      },
    });
  });

  revalidatePath("/production");
  revalidatePath("/materials");
  redirect("/production");
}

export type WriteOffState = { error?: string };

/**
 * Writes off bottles from a finished lot with a reason code. Stock movements
 * are never hard-deleted or edited — the decrement plus its AuditLog entry
 * IS the record (CLAUDE.md rule 5). qtyRemaining is re-checked inside the
 * transaction so it can never go negative (invariant 3).
 */
export async function writeOffLotAction(
  _prevState: WriteOffState,
  formData: FormData
): Promise<WriteOffState> {
  let actor;
  try {
    actor = await requireWriter();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not signed in." };
  }

  const lotId = Number(formData.get("lotId"));
  if (!Number.isInteger(lotId) || lotId <= 0) {
    return { error: "Unknown lot." };
  }

  let reason;
  try {
    reason = parseWriteOffReason(String(formData.get("reason") ?? ""));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid reason." };
  }
  const note = String(formData.get("note") ?? "").trim();
  const rawQty = String(formData.get("qty") ?? "");

  try {
    await prisma.$transaction(async (tx) => {
      const lot = await tx.finishedLot.findUnique({
        where: { id: lotId },
        include: {
          brewBatch: { include: { product: true } },
          location: true,
        },
      });
      if (!lot) throw new Error("Lot not found.");

      const qty = parseWriteOffQty(rawQty, lot.qtyRemaining);

      await tx.finishedLot.update({
        where: { id: lot.id },
        data: { qtyRemaining: { decrement: qty } },
      });
      await tx.auditLog.create({
        data: {
          userId: actor.id,
          action: "finished_lot.write_off",
          entity: "FinishedLot",
          entityId: String(lot.id),
          detail: {
            skuCode: lot.brewBatch.product.skuCode,
            location: lot.location.name,
            qty,
            reason,
            ...(note ? { note } : {}),
            remainingAfter: lot.qtyRemaining - qty,
            unitCostSnapshot: lot.brewBatch.unitCostSnapshot.toString(),
          },
        },
      });
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Write-off failed." };
  }

  revalidatePath("/stock");
  return {};
}
