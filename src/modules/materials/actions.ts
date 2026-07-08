"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireWriter } from "@/lib/auth";
import {
  deactivationBlockReason,
  parseNewMaterialInput,
  parsePriceInput,
  parseQuantityInput,
  parseThresholdInput,
  receiveStock,
} from "./logic";

export type UpdatePriceState = { error?: string };
export type ReceiveStockState = { error?: string };
export type CreateMaterialState = { error?: string };
export type DeactivateMaterialState = { error?: string };

/**
 * Receives a delivery: stock goes up, and an optional cost per unit appends
 * a MaterialPrice row (a delivery is when prices change — D16 still holds,
 * history is appended, never overwritten).
 */
export async function receiveMaterialStockAction(
  _prevState: ReceiveStockState,
  formData: FormData
): Promise<ReceiveStockState> {
  let actor;
  try {
    actor = await requireWriter();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not signed in." };
  }

  const materialId = Number(formData.get("materialId"));
  if (!Number.isInteger(materialId) || materialId <= 0) {
    return { error: "Unknown material." };
  }

  let qty;
  try {
    qty = parseQuantityInput(String(formData.get("quantity") ?? ""));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid quantity." };
  }

  const rawCost = String(formData.get("costPerUnit") ?? "").trim();
  let cost = null;
  if (rawCost !== "") {
    try {
      cost = parsePriceInput(rawCost);
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Invalid cost." };
    }
  }

  const material = await prisma.material.findUnique({ where: { id: materialId } });
  if (!material || !material.isActive) {
    return { error: "Unknown material." };
  }

  const newStock = receiveStock(material.stockQty, qty);

  await prisma.$transaction([
    prisma.material.update({
      where: { id: materialId },
      data: { stockQty: newStock },
    }),
    ...(cost
      ? [prisma.materialPrice.create({ data: { materialId, costPerUnit: cost } })]
      : []),
    prisma.auditLog.create({
      data: {
        userId: actor.id,
        action: "material.receive_stock",
        entity: "Material",
        entityId: String(materialId),
        detail: {
          quantity: qty.toString(),
          stockAfter: newStock.toString(),
          ...(cost ? { costPerUnit: cost.toString() } : {}),
        },
      },
    }),
  ]);

  revalidatePath("/materials");
  return {};
}

/**
 * Creates a material with its first price row. Stock starts at 0 — receiving
 * a delivery is the only way stock goes up, so there is one audited path.
 */
export async function createMaterialAction(
  _prevState: CreateMaterialState,
  formData: FormData
): Promise<CreateMaterialState> {
  let actor;
  try {
    actor = await requireWriter();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not signed in." };
  }

  let input, cost, threshold;
  try {
    input = parseNewMaterialInput(
      String(formData.get("name") ?? ""),
      String(formData.get("type") ?? ""),
      String(formData.get("unit") ?? "")
    );
    cost = parsePriceInput(String(formData.get("costPerUnit") ?? ""));
    threshold = parseThresholdInput(String(formData.get("lowStockThreshold") ?? ""));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid input." };
  }

  const existing = await prisma.material.findUnique({ where: { name: input.name } });
  if (existing) {
    return {
      error: existing.isActive
        ? "A material with this name already exists."
        : "A deactivated material with this name exists — rename it or reactivate in the database.",
    };
  }

  await prisma.$transaction(async (tx) => {
    const material = await tx.material.create({
      data: {
        name: input.name,
        type: input.type,
        unit: input.unit,
        lowStockThreshold: threshold,
        prices: { create: { costPerUnit: cost } },
      },
    });
    await tx.auditLog.create({
      data: {
        userId: actor.id,
        action: "material.create",
        entity: "Material",
        entityId: String(material.id),
        detail: {
          name: input.name,
          type: input.type,
          unit: input.unit,
          costPerUnit: cost.toString(),
          lowStockThreshold: threshold.toString(),
        },
      },
    });
  });

  revalidatePath("/materials");
  return {};
}

export type UpdateMaterialDetailsState = { error?: string };

/**
 * Edits master-data details: name, type, low-stock threshold (D16 — master
 * data is fully editable). Unit is locked: stock, prices, and recipes are
 * all denominated in it, so changing it would silently corrupt history.
 */
export async function updateMaterialDetailsAction(
  _prevState: UpdateMaterialDetailsState,
  formData: FormData
): Promise<UpdateMaterialDetailsState> {
  let actor;
  try {
    actor = await requireWriter();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not signed in." };
  }

  const materialId = Number(formData.get("materialId"));
  if (!Number.isInteger(materialId) || materialId <= 0) {
    return { error: "Unknown material." };
  }

  const material = await prisma.material.findUnique({ where: { id: materialId } });
  if (!material || !material.isActive) {
    return { error: "Unknown material." };
  }

  let input, threshold;
  try {
    input = parseNewMaterialInput(
      String(formData.get("name") ?? ""),
      String(formData.get("type") ?? ""),
      material.unit // unit is not editable; validate against the existing one
    );
    threshold = parseThresholdInput(String(formData.get("lowStockThreshold") ?? ""));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid input." };
  }

  if (input.name !== material.name) {
    const clash = await prisma.material.findUnique({ where: { name: input.name } });
    if (clash) return { error: "A material with this name already exists." };
  }

  await prisma.$transaction([
    prisma.material.update({
      where: { id: materialId },
      data: { name: input.name, type: input.type, lowStockThreshold: threshold },
    }),
    prisma.auditLog.create({
      data: {
        userId: actor.id,
        action: "material.update_details",
        entity: "Material",
        entityId: String(materialId),
        detail: {
          before: {
            name: material.name,
            type: material.type,
            lowStockThreshold: material.lowStockThreshold.toString(),
          },
          after: {
            name: input.name,
            type: input.type,
            lowStockThreshold: threshold.toString(),
          },
        },
      },
    }),
  ]);

  revalidatePath("/materials");
  return {};
}

/**
 * Soft-deletes a material (isActive = false — rule 5, master data referenced
 * by history is never hard-deleted). Blocked while any active product's
 * recipe still consumes it.
 */
export async function deactivateMaterialAction(
  _prevState: DeactivateMaterialState,
  formData: FormData
): Promise<DeactivateMaterialState> {
  let actor;
  try {
    actor = await requireWriter();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not signed in." };
  }

  const materialId = Number(formData.get("materialId"));
  if (!Number.isInteger(materialId) || materialId <= 0) {
    return { error: "Unknown material." };
  }

  const material = await prisma.material.findUnique({
    where: { id: materialId },
    include: {
      bomLines: {
        where: { product: { isActive: true } },
        include: { product: { include: { flavour: true } } },
      },
    },
  });
  if (!material || !material.isActive) {
    return { error: "Unknown material." };
  }

  const blockReason = deactivationBlockReason(
    material.bomLines.map(
      (l) => `${l.product.flavour.name} ${l.product.sizeMl}ml`
    )
  );
  if (blockReason) {
    return { error: blockReason };
  }

  await prisma.$transaction([
    prisma.material.update({
      where: { id: materialId },
      data: { isActive: false },
    }),
    prisma.auditLog.create({
      data: {
        userId: actor.id,
        action: "material.deactivate",
        entity: "Material",
        entityId: String(materialId),
        detail: { name: material.name, stockQtyAtDeactivation: material.stockQty.toString() },
      },
    }),
  ]);

  revalidatePath("/materials");
  return {};
}

/** Appends a new MaterialPrice row — current cost history is never overwritten (D16). */
export async function updateMaterialPriceAction(
  _prevState: UpdatePriceState,
  formData: FormData
): Promise<UpdatePriceState> {
  let actor;
  try {
    actor = await requireWriter();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not signed in." };
  }

  const materialId = Number(formData.get("materialId"));
  if (!Number.isInteger(materialId) || materialId <= 0) {
    return { error: "Unknown material." };
  }

  let cost;
  try {
    cost = parsePriceInput(String(formData.get("costPerUnit") ?? ""));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid price." };
  }

  const material = await prisma.material.findUnique({ where: { id: materialId } });
  if (!material) {
    return { error: "Unknown material." };
  }

  await prisma.$transaction([
    prisma.materialPrice.create({
      data: { materialId, costPerUnit: cost },
    }),
    prisma.auditLog.create({
      data: {
        userId: actor.id,
        action: "material.update_price",
        entity: "Material",
        entityId: String(materialId),
        detail: { costPerUnit: cost.toString(), previousName: material.name },
      },
    }),
  ]);

  revalidatePath("/materials");
  return {};
}
