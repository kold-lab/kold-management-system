"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireWriter } from "@/lib/auth";
import { parsePartnerInput, partnerDeactivationBlockReason } from "./logic";

export type PartnerState = { error?: string };

/** Creates a partner plus its consignment site location in one transaction. */
export async function createPartnerAction(
  _prevState: PartnerState,
  formData: FormData
): Promise<PartnerState> {
  let actor;
  try {
    actor = await requireWriter();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not signed in." };
  }

  let input;
  try {
    input = parsePartnerInput(
      String(formData.get("name") ?? ""),
      String(formData.get("phone") ?? ""),
      String(formData.get("email") ?? ""),
      String(formData.get("paymentTermsDays") ?? "")
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid input." };
  }

  const existing = await prisma.customer.findFirst({
    where: { name: input.name, type: "B2B_PARTNER", isActive: true },
  });
  if (existing) {
    return { error: "An active partner with this name already exists." };
  }

  await prisma.$transaction(async (tx) => {
    const partner = await tx.customer.create({
      data: {
        name: input.name,
        type: "B2B_PARTNER",
        phone: input.phone,
        email: input.email,
        paymentTermsDays: input.paymentTermsDays,
        locations: {
          create: { name: input.name, type: "PARTNER_SITE" },
        },
      },
    });
    await tx.auditLog.create({
      data: {
        userId: actor.id,
        action: "partner.create",
        entity: "Customer",
        entityId: String(partner.id),
        detail: {
          name: input.name,
          paymentTermsDays: input.paymentTermsDays,
          ...(input.phone ? { phone: input.phone } : {}),
          ...(input.email ? { email: input.email } : {}),
        },
      },
    });
  });

  revalidatePath("/partners");
  return {};
}

/** Edits partner master data; the partner's site location follows a rename. */
export async function updatePartnerAction(
  _prevState: PartnerState,
  formData: FormData
): Promise<PartnerState> {
  let actor;
  try {
    actor = await requireWriter();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not signed in." };
  }

  const partnerId = Number(formData.get("partnerId"));
  if (!Number.isInteger(partnerId) || partnerId <= 0) {
    return { error: "Unknown partner." };
  }

  const partner = await prisma.customer.findUnique({
    where: { id: partnerId },
    include: { locations: true },
  });
  if (!partner || !partner.isActive || partner.type !== "B2B_PARTNER") {
    return { error: "Unknown partner." };
  }

  let input;
  try {
    input = parsePartnerInput(
      String(formData.get("name") ?? ""),
      String(formData.get("phone") ?? ""),
      String(formData.get("email") ?? ""),
      String(formData.get("paymentTermsDays") ?? "")
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid input." };
  }

  if (input.name !== partner.name) {
    const clash = await prisma.customer.findFirst({
      where: { name: input.name, type: "B2B_PARTNER", isActive: true, NOT: { id: partnerId } },
    });
    if (clash) return { error: "An active partner with this name already exists." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.customer.update({
      where: { id: partnerId },
      data: {
        name: input.name,
        phone: input.phone,
        email: input.email,
        paymentTermsDays: input.paymentTermsDays,
      },
    });
    // Site locations named after the partner follow the rename.
    if (input.name !== partner.name) {
      await tx.location.updateMany({
        where: { customerId: partnerId, name: partner.name },
        data: { name: input.name },
      });
    }
    await tx.auditLog.create({
      data: {
        userId: actor.id,
        action: "partner.update_details",
        entity: "Customer",
        entityId: String(partnerId),
        detail: {
          before: {
            name: partner.name,
            phone: partner.phone,
            email: partner.email,
            paymentTermsDays: partner.paymentTermsDays,
          },
          after: {
            name: input.name,
            phone: input.phone,
            email: input.email,
            paymentTermsDays: input.paymentTermsDays,
          },
        },
      },
    });
  });

  revalidatePath("/partners");
  return {};
}

/**
 * Soft-deletes a partner and its site locations (rule 5). Blocked while
 * consignment stock still sits at any of the partner's sites.
 */
export async function deactivatePartnerAction(
  _prevState: PartnerState,
  formData: FormData
): Promise<PartnerState> {
  let actor;
  try {
    actor = await requireWriter();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not signed in." };
  }

  const partnerId = Number(formData.get("partnerId"));
  if (!Number.isInteger(partnerId) || partnerId <= 0) {
    return { error: "Unknown partner." };
  }

  const partner = await prisma.customer.findUnique({
    where: { id: partnerId },
    include: { locations: { include: { lots: { select: { qtyRemaining: true } } } } },
  });
  if (!partner || !partner.isActive || partner.type !== "B2B_PARTNER") {
    return { error: "Unknown partner." };
  }

  const bottles = partner.locations.reduce(
    (sum, loc) => sum + loc.lots.reduce((s, l) => s + l.qtyRemaining, 0),
    0
  );
  const blockReason = partnerDeactivationBlockReason(bottles);
  if (blockReason) return { error: blockReason };

  await prisma.$transaction([
    prisma.customer.update({ where: { id: partnerId }, data: { isActive: false } }),
    prisma.location.updateMany({
      where: { customerId: partnerId },
      data: { isActive: false },
    }),
    prisma.auditLog.create({
      data: {
        userId: actor.id,
        action: "partner.deactivate",
        entity: "Customer",
        entityId: String(partnerId),
        detail: { name: partner.name },
      },
    }),
  ]);

  revalidatePath("/partners");
  return {};
}
