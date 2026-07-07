import "server-only";
import type { Decimal } from "@prisma/client/runtime/library";
import type { BatchStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { listFlavours, getRecipe } from "@/modules/catalog";

export type NewBatchLine = {
  materialId: number;
  materialName: string;
  unit: string;
  /** Per-bottle quantity, serialized for the client form. */
  perBottle: string;
  /** Current stock on hand, serialized for the client form. */
  stockQty: string;
};

export type NewBatchProduct = {
  productId: number;
  skuCode: string;
  label: string;
  /** Per-bottle cost at today's prices — preview only; the save freezes prices effective on brew date. */
  unitCostPreview: string | null;
  lines: NewBatchLine[];
};

/** SKUs that can be brewed (active, with a recipe), shaped for the new-batch form. */
export async function listNewBatchProducts(): Promise<NewBatchProduct[]> {
  const flavours = await listFlavours();
  const products: NewBatchProduct[] = [];
  for (const flavour of flavours) {
    for (const sku of flavour.skus) {
      if (!sku.hasRecipe) continue;
      const recipe = await getRecipe(sku.id);
      if (!recipe || recipe.lines.length === 0) continue;
      const stockById = new Map(
        recipe.materialOptions.map((m) => [m.id, m.stockQty])
      );
      products.push({
        productId: sku.id,
        skuCode: sku.skuCode,
        label: `${flavour.name} ${sku.sizeMl}ml`,
        unitCostPreview: recipe.unitCost ? recipe.unitCost.toFixed(3) : null,
        lines: recipe.lines.map((l) => ({
          materialId: l.materialId,
          materialName: l.materialName,
          unit: l.unit,
          perBottle: l.quantity.toString(),
          stockQty: (stockById.get(l.materialId) ?? "0").toString(),
        })),
      });
    }
  }
  return products;
}

export type BrewBatchListItem = {
  id: number;
  label: string;
  skuCode: string;
  brewDate: Date;
  expiryDate: Date;
  qtyPlanned: number;
  qtyProduced: number;
  unitCostSnapshot: Decimal;
  status: BatchStatus;
};

export async function listBrewBatches(): Promise<BrewBatchListItem[]> {
  const batches = await prisma.brewBatch.findMany({
    include: { product: { include: { flavour: true } } },
    orderBy: [{ brewDate: "desc" }, { id: "desc" }],
  });
  return batches.map((b) => ({
    id: b.id,
    label: `${b.product.flavour.name} ${b.product.sizeMl}ml`,
    skuCode: b.product.skuCode,
    brewDate: b.brewDate,
    expiryDate: b.expiryDate,
    qtyPlanned: b.qtyPlanned,
    qtyProduced: b.qtyProduced,
    unitCostSnapshot: b.unitCostSnapshot,
    status: b.status,
  }));
}
