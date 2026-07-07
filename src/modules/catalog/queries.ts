import "server-only";
import type { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";
import { listMaterials, type MaterialListItem } from "@/modules/materials";
import { lineCost, recipeUnitCost } from "./logic";

export type SkuListItem = {
  id: number;
  skuCode: string;
  sizeMl: number;
  hasRecipe: boolean;
};

export type FlavourListItem = {
  id: number;
  name: string;
  skus: SkuListItem[];
};

export type RecipeLine = {
  materialId: number;
  materialName: string;
  unit: string;
  quantity: Decimal;
  costPerUnit: Decimal | null;
  lineCost: Decimal | null;
};

export type RecipeView = {
  productId: number;
  skuCode: string;
  sizeMl: number;
  flavourName: string;
  lines: RecipeLine[];
  /** Per-bottle material cost preview; null while any line's material has no price. */
  unitCost: Decimal | null;
  /** Active materials available for the add-line picker. */
  materialOptions: MaterialListItem[];
};

export async function getRecipe(productId: number): Promise<RecipeView | null> {
  const [product, materials] = await Promise.all([
    prisma.product.findUnique({
      where: { id: productId },
      include: { flavour: true, bomLines: true },
    }),
    listMaterials(),
  ]);
  if (!product || !product.isActive) return null;

  const materialById = new Map(materials.map((m) => [m.id, m]));
  const lines = product.bomLines
    .map((l) => {
      const material = materialById.get(l.materialId);
      const costPerUnit = material?.currentCost ?? null;
      return {
        materialId: l.materialId,
        materialName: material?.name ?? `Material #${l.materialId}`,
        unit: material?.unit ?? "",
        quantity: l.quantity,
        costPerUnit,
        lineCost: lineCost(l.quantity, costPerUnit),
      };
    })
    .sort((a, b) => a.materialName.localeCompare(b.materialName));

  return {
    productId: product.id,
    skuCode: product.skuCode,
    sizeMl: product.sizeMl,
    flavourName: product.flavour.name,
    lines,
    unitCost: lines.length > 0 ? recipeUnitCost(lines) : null,
    materialOptions: materials,
  };
}

export async function listFlavours(): Promise<FlavourListItem[]> {
  const flavours = await prisma.flavour.findMany({
    where: { isActive: true },
    include: {
      products: {
        where: { isActive: true },
        orderBy: { sizeMl: "asc" },
        include: { _count: { select: { bomLines: true } } },
      },
    },
    orderBy: { name: "asc" },
  });

  return flavours.map((f) => ({
    id: f.id,
    name: f.name,
    skus: f.products.map((p) => ({
      id: p.id,
      skuCode: p.skuCode,
      sizeMl: p.sizeMl,
      hasRecipe: p._count.bomLines > 0,
    })),
  }));
}
