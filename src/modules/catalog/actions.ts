"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  parseFlavourNameInput,
  parseQuantityInput,
  skuCode,
  SIZES_ML,
} from "./logic";

function parseId(value: FormDataEntryValue | null): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export type AddFlavourState = { error?: string };

/** Creates a flavour plus its SKUs in both sizes — adding a flavour is data entry, not code (D16). */
export async function addFlavourAction(
  _prevState: AddFlavourState,
  formData: FormData
): Promise<AddFlavourState> {
  let name;
  try {
    name = parseFlavourNameInput(String(formData.get("name") ?? ""));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid flavour name." };
  }

  const codes = SIZES_ML.map((sizeMl) => skuCode(name, sizeMl));

  try {
    await prisma.$transaction(async (tx) => {
      const flavour = await tx.flavour.create({
        data: {
          name,
          products: {
            create: SIZES_ML.map((sizeMl) => ({
              sizeMl,
              skuCode: skuCode(name, sizeMl),
            })),
          },
        },
      });
      await tx.auditLog.create({
        data: {
          action: "catalog.add_flavour",
          entity: "Flavour",
          entityId: String(flavour.id),
          detail: { name, skuCodes: codes },
        },
      });
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const target = (e.meta?.target as string[] | undefined) ?? [];
      if (target.includes("skuCode")) {
        return {
          error: `SKU code ${codes.join(" / ")} is already taken — another flavour has the same initials. Pick a distinguishing name.`,
        };
      }
      return { error: "A flavour with this name already exists." };
    }
    throw e;
  }

  revalidatePath("/catalog");
  return {};
}

export type BomLineState = { error?: string };

/** Sets a recipe line (product × material × per-bottle quantity). Upserts, so re-adding a material updates its quantity. */
export async function setBomLineAction(
  _prevState: BomLineState,
  formData: FormData
): Promise<BomLineState> {
  const productId = parseId(formData.get("productId"));
  const materialId = parseId(formData.get("materialId"));
  if (!productId) return { error: "Unknown product." };
  if (!materialId) return { error: "Pick a material." };

  let quantity;
  try {
    quantity = parseQuantityInput(String(formData.get("quantity") ?? ""));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid quantity." };
  }

  const [product, material] = await Promise.all([
    prisma.product.findUnique({ where: { id: productId } }),
    prisma.material.findUnique({ where: { id: materialId } }),
  ]);
  if (!product || !product.isActive) return { error: "Unknown product." };
  if (!material || !material.isActive) return { error: "Unknown material." };

  await prisma.$transaction([
    prisma.bomLine.upsert({
      where: { productId_materialId: { productId, materialId } },
      update: { quantity },
      create: { productId, materialId, quantity },
    }),
    prisma.auditLog.create({
      data: {
        action: "catalog.set_bom_line",
        entity: "Product",
        entityId: String(productId),
        detail: {
          skuCode: product.skuCode,
          material: material.name,
          quantity: quantity.toString(),
          unit: material.unit,
        },
      },
    }),
  ]);

  revalidatePath("/catalog");
  revalidatePath(`/catalog/${productId}/recipe`);
  return {};
}

/** Removes a recipe line. Recipes are editable master data (D16); batches keep their own cost snapshots. */
export async function removeBomLineAction(
  _prevState: BomLineState,
  formData: FormData
): Promise<BomLineState> {
  const productId = parseId(formData.get("productId"));
  const materialId = parseId(formData.get("materialId"));
  if (!productId || !materialId) return { error: "Unknown recipe line." };

  const line = await prisma.bomLine.findUnique({
    where: { productId_materialId: { productId, materialId } },
    include: { product: true, material: true },
  });
  if (!line) return { error: "Recipe line not found." };

  await prisma.$transaction([
    prisma.bomLine.delete({ where: { id: line.id } }),
    prisma.auditLog.create({
      data: {
        action: "catalog.remove_bom_line",
        entity: "Product",
        entityId: String(productId),
        detail: {
          skuCode: line.product.skuCode,
          material: line.material.name,
          quantity: line.quantity.toString(),
        },
      },
    }),
  ]);

  revalidatePath("/catalog");
  revalidatePath(`/catalog/${productId}/recipe`);
  return {};
}
