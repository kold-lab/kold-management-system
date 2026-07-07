import "server-only";
import { Decimal } from "@prisma/client/runtime/library";
import type { MaterialType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { currentCost, isLowStock } from "./logic";

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
