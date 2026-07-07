import "server-only";
import { prisma } from "@/lib/prisma";

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
