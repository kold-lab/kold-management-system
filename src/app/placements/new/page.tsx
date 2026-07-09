import Link from "next/link";
import { getPlacementOptions, PlacementForm } from "@/modules/consignment";

export const dynamic = "force-dynamic";

export default async function NewPlacementPage({
  searchParams,
}: {
  searchParams: Promise<{ partner?: string }>;
}) {
  const { partner } = await searchParams;
  const defaultPartnerId = partner ? Number(partner) : undefined;
  const { partners, products } = await getPlacementOptions();

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div>
        <Link
          href="/placements"
          className="inline-flex h-9 items-center gap-1.5 rounded border border-brand-slate/30 bg-white px-3 text-sm font-semibold text-brand-deep hover:bg-brand-ice"
        >
          ← Placements
        </Link>
        <h1 className="mt-2 text-xl font-bold text-brand">Place stock</h1>
        <p className="text-sm text-brand-slate">
          Freshest batch goes by default (D19) — change per SKU if needed.
          Saving moves stock to the partner site and opens the delivery note.
        </p>
      </div>
      {partners.length === 0 ? (
        <p className="rounded-lg border border-brand-slate/20 bg-white p-4 text-sm text-brand-slate">
          No partners yet — add one on the{" "}
          <Link href="/partners" className="font-semibold text-brand-deep">
            Partners
          </Link>{" "}
          screen first.
        </p>
      ) : products.length === 0 ? (
        <p className="rounded-lg border border-brand-slate/20 bg-white p-4 text-sm text-brand-slate">
          No bottles in the warehouse —{" "}
          <Link href="/production/new" className="font-semibold text-brand-deep">
            record a brew
          </Link>{" "}
          first.
        </p>
      ) : (
        <PlacementForm partners={partners} products={products} defaultPartnerId={defaultPartnerId} />
      )}
    </div>
  );
}
