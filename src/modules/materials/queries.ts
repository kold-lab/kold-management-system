import "server-only";
import { Decimal } from "@prisma/client/runtime/library";
import type { MaterialType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { currentCost, isLowStock, priceEffectiveOn } from "./logic";

export type MaterialListItem = {
  id: number;
  name: string;
  type: MaterialType;
  unit: string;
  stockQty: Decimal;
  lowStockThreshold: Decimal;
  currentCost: Decimal | null;
  isLowStock: boolean;
};

/**
 * Cost per unit of every active material as effective on the given calendar
 * day (invariant 4). Value is null for materials with no price yet that day.
 */
export async function listMaterialCostsOn(
  day: Date
): Promise<Map<number, Decimal | null>> {
  const materials = await prisma.material.findMany({
    where: { isActive: true },
    include: { prices: true },
  });
  return new Map(
    materials.map((m) => [m.id, priceEffectiveOn(m.prices, day)])
  );
}

export async function listMaterials(): Promise<MaterialListItem[]> {
  const materials = await prisma.material.findMany({
    where: { isActive: true },
    include: { prices: { orderBy: { effectiveFrom: "desc" } } },
    orderBy: { name: "asc" },
  });

  return materials.map((m) => ({
    id: m.id,
    name: m.name,
    type: m.type,
    unit: m.unit,
    stockQty: m.stockQty,
    lowStockThreshold: m.lowStockThreshold,
    currentCost: currentCost(m.prices),
    isLowStock: isLowStock(m.stockQty, m.lowStockThreshold),
  }));
}
