import { listFinishedLots, StockTable } from "@/modules/production";

export const dynamic = "force-dynamic";

export default async function StockPage() {
  const lots = await listFinishedLots();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-brand">Stock</h1>
        <p className="text-sm text-brand-slate">
          Finished bottles by lot, first-expiring first (FEFO).
        </p>
      </div>
      <StockTable lots={lots} />
    </div>
  );
}
