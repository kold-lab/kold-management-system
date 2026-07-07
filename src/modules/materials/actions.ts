"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { parsePriceInput } from "./logic";

export type UpdatePriceState = { error?: string };

/** Appends a new MaterialPrice row — current cost history is never overwritten (D16). */
export async function updateMaterialPriceAction(
  _prevState: UpdatePriceState,
  formData: FormData
): Promise<UpdatePriceState> {
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
