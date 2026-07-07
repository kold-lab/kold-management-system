import Link from "next/link";
import { listNewBatchProducts, NewBatchForm } from "@/modules/production";
import { todayMYT } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function NewBatchPage() {
  const products = await listNewBatchProducts();

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div>
        <Link
          href="/production"
          className="text-sm font-semibold text-brand-slate"
        >
          ← Production
        </Link>
        <h1 className="text-xl font-bold text-brand-deep">New brew batch</h1>
        <p className="text-sm text-brand-slate">
          Record a brew — bottles land in the warehouse, materials are consumed.
        </p>
      </div>
      {products.length === 0 ? (
        <p className="rounded-lg border border-brand-slate/20 bg-white p-6 text-sm text-brand-slate">
          No brewable SKUs — every SKU needs a recipe first. Set them up in the{" "}
          <Link href="/catalog" className="font-semibold text-brand-deep">
            catalog
          </Link>
          .
        </p>
      ) : (
        <NewBatchForm
          products={products}
          defaultBrewDate={todayMYT().toISOString().slice(0, 10)}
        />
      )}
    </div>
  );
}
