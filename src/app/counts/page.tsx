import Link from "next/link";
import { CountsTable, listReconciliations } from "@/modules/consignment";

export const dynamic = "force-dynamic";

export default async function CountsPage() {
  const recons = await listReconciliations();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-brand">Counts</h1>
          <p className="text-sm text-brand-slate">
            Weekly shelf counts — signed off, they feed the monthly invoice.
          </p>
        </div>
        <Link
          href="/counts/new"
          aria-label="New count"
          title="New count"
          className="inline-flex h-10 w-10 items-center justify-center rounded bg-brand text-2xl font-semibold leading-none text-white hover:bg-brand/90"
        >
          +
        </Link>
      </div>
      <CountsTable recons={recons} />
    </div>
  );
}
