import Link from "next/link";
import { listBrewBatches, BatchHistoryTable } from "@/modules/production";

export const dynamic = "force-dynamic";

export default async function ProductionPage() {
  const batches = await listBrewBatches();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-brand">Production</h1>
          <p className="text-sm text-brand-slate">
            Brew history — every batch with its frozen unit cost.
          </p>
        </div>
        <Link
          href="/production/new"
          aria-label="New brew batch"
          title="New brew batch"
          className="inline-flex h-10 w-10 items-center justify-center rounded bg-brand text-2xl font-semibold leading-none text-white hover:bg-brand/90"
        >
          +
        </Link>
      </div>
      <BatchHistoryTable batches={batches} />
    </div>
  );
}
