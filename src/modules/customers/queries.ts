import "server-only";
import { prisma } from "@/lib/prisma";

export type PartnerListItem = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  paymentTermsDays: number;
  bottlesOnSite: number;
};

/** Active consignment partners with the bottle count sitting at their sites. */
export async function listPartners(): Promise<PartnerListItem[]> {
  const partners = await prisma.customer.findMany({
    where: { type: "B2B_PARTNER", isActive: true },
    include: {
      locations: {
        include: { lots: { select: { qtyRemaining: true } } },
      },
    },
    orderBy: { name: "asc" },
  });

  return partners.map((p) => ({
    id: p.id,
    name: p.name,
    phone: p.phone,
    email: p.email,
    paymentTermsDays: p.paymentTermsDays,
    bottlesOnSite: p.locations.reduce(
      (sum, loc) => sum + loc.lots.reduce((s, l) => s + l.qtyRemaining, 0),
      0
    ),
  }));
}
