import Link from "next/link";
import { listBrewBatches, BatchHistoryTable } from "@/modules/production";

export const dynamic = "force-dynamic";

export default async function ProductionPage() {
  const batches = await listBrewBatches();

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-brand-deep">Production</h1>
          <p className="text-sm text-brand-slate">
            Brew history — every batch with its frozen unit cost.
          </p>
        </div>
        <Link
          href="/production/new"
          className="inline-flex h-8 items-center whitespace-nowrap rounded bg-brand-deep px-3 text-sm font-semibold text-white hover:bg-brand-deep/90"
        >
          New brew batch
        </Link>
      </div>
      <BatchHistoryTable batches={batches} />
    </div>
  );
}
