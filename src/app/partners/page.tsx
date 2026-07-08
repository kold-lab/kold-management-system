import { AddPartnerDialog, listPartners, PartnersTable } from "@/modules/customers";

export const dynamic = "force-dynamic";

export default async function PartnersPage() {
  const partners = await listPartners();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-brand">Partners</h1>
          <p className="text-sm text-brand-slate">
            Consignment outlets — who stocks kold and what sits at their site.
          </p>
        </div>
        <AddPartnerDialog />
      </div>
      <PartnersTable partners={partners} />
    </div>
  );
}
