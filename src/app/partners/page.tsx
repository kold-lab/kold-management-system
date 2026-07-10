import { AddPartnerDialog } from "@/modules/customers";
import { getPartnerPilot, PartnerPilotGrid } from "@/modules/consignment";

export const dynamic = "force-dynamic";

export default async function PartnersPage() {
  const cards = await getPartnerPilot();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-brand">Partners</h1>
          <p className="text-sm text-brand-slate">
            Every shelf at a glance — most urgent first.
          </p>
        </div>
        <AddPartnerDialog />
      </div>
      <PartnerPilotGrid cards={cards} />
    </div>
  );
}
