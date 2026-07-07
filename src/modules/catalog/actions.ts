"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseFlavourNameInput, skuCode, SIZES_ML } from "./logic";

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
