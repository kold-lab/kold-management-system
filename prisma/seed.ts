// Seed: real catalog, materials, prices (2026-07), recipes, warehouse.
// Run: npx prisma db seed
import { PrismaClient, MaterialType, LocationType } from "@prisma/client";

const prisma = new PrismaClient();

// ── real material prices (docs/decisions.md, costing facts) ──
const materials = [
  { name: "PET bottle 350ml", type: MaterialType.PACKAGING, unit: "pcs", cost: "1.446", low: "50" },
  { name: "PET bottle 250ml", type: MaterialType.PACKAGING, unit: "pcs", cost: "1.01", low: "50" },
  { name: "Label", type: MaterialType.PACKAGING, unit: "pcs", cost: "0.23", low: "100" },
  { name: "Tag", type: MaterialType.PACKAGING, unit: "pcs", cost: "0.25", low: "100" },
  // tea priced per gram: RM51/500g = 0.102, RM30/500g = 0.06
  { name: "Tea leaves — osmanthus oolong", type: MaterialType.INGREDIENT, unit: "g", cost: "0.102", low: "200" },
  { name: "Tea leaves — white peach oolong", type: MaterialType.INGREDIENT, unit: "g", cost: "0.102", low: "200" },
  { name: "Tea leaves — jasmine green tea", type: MaterialType.INGREDIENT, unit: "g", cost: "0.06", low: "200" },
] as const;

const flavours = [
  { name: "Osmanthus oolong", tea: "Tea leaves — osmanthus oolong" },
  { name: "White peach oolong", tea: "Tea leaves — white peach oolong" },
  { name: "Jasmine green tea", tea: "Tea leaves — jasmine green tea" },
] as const;

// tea grams per bottle by size (25g→10×250ml, 35g→10×350ml)
const teaGrams: Record<number, string> = { 250: "2.5", 350: "3.5" };
const sizes = [250, 350] as const;

function skuCode(flavour: string, sizeMl: number): string {
  const initials = flavour
    .split(/\s+/)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return `${initials}-${sizeMl}`; // e.g. OO-350, JGT-250
}

async function main() {
  // materials + opening price history
  const matByName = new Map<string, number>();
  for (const m of materials) {
    const rec = await prisma.material.upsert({
      where: { name: m.name },
      update: {},
      create: {
        name: m.name,
        type: m.type,
        unit: m.unit,
        lowStockThreshold: m.low,
        prices: { create: { costPerUnit: m.cost } },
      },
    });
    matByName.set(m.name, rec.id);
  }

  // flavours → products (both sizes) → recipes
  for (const f of flavours) {
    const flavour = await prisma.flavour.upsert({
      where: { name: f.name },
      update: {},
      create: { name: f.name },
    });
    for (const sizeMl of sizes) {
      const product = await prisma.product.upsert({
        where: { skuCode: skuCode(f.name, sizeMl) },
        update: {},
        create: { flavourId: flavour.id, sizeMl, skuCode: skuCode(f.name, sizeMl) },
      });
      const bom: Array<{ material: string; quantity: string }> = [
        { material: `PET bottle ${sizeMl}ml`, quantity: "1" },
        { material: "Label", quantity: "1" },
        { material: "Tag", quantity: "1" },
        { material: f.tea, quantity: teaGrams[sizeMl]! },
      ];
      for (const line of bom) {
        await prisma.bomLine.upsert({
          where: {
            productId_materialId: {
              productId: product.id,
              materialId: matByName.get(line.material)!,
            },
          },
          update: { quantity: line.quantity },
          create: {
            productId: product.id,
            materialId: matByName.get(line.material)!,
            quantity: line.quantity,
          },
        });
      }
    }
  }

  // home base
  const existing = await prisma.location.findFirst({
    where: { type: LocationType.WAREHOUSE },
  });
  if (!existing) {
    await prisma.location.create({
      data: { name: "Main warehouse", type: LocationType.WAREHOUSE },
    });
  }

  console.log("Seed complete: 7 materials, 3 flavours, 6 SKUs, recipes, warehouse.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
