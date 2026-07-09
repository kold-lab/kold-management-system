import Link from "next/link";
import { listPartners } from "@/modules/customers";
import { CountForm, getSiteStockForCount } from "@/modules/consignment";

export const dynamic = "force-dynamic";

export default async function NewCountPage({
  searchParams,
}: {
  searchParams: Promise<{ partner?: string }>;
}) {
  const { partner } = await searchParams;
  const partnerId = partner ? Number(partner) : null;

  const backButton = (
    <Link
      href="/counts"
      className="inline-flex h-9 items-center gap-1.5 rounded border border-brand-slate/30 bg-white px-3 text-sm font-semibold text-brand-deep hover:bg-brand-ice"
    >
      ← Counts
    </Link>
  );

  // Step 1 — pick the partner (big tap targets, phone-first).
  if (!partnerId) {
    const partners = (await listPartners()).filter((p) => p.bottlesOnSite > 0);
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <div>
          {backButton}
          <h1 className="mt-2 text-xl font-bold text-brand">New count</h1>
          <p className="text-sm text-brand-slate">Whose shelf are you at?</p>
        </div>
        {partners.length === 0 ? (
          <p className="rounded-lg border border-brand-slate/20 bg-white p-4 text-sm text-brand-slate">
            No partner has stock right now —{" "}
            <Link href="/placements/new" className="font-semibold text-brand-deep">
              place stock
            </Link>{" "}
            first.
          </p>
        ) : (
          <div className="space-y-2">
            {partners.map((p) => (
              <Link
                key={p.id}
                href={`/counts/new?partner=${p.id}`}
                className="flex items-center justify-between rounded-lg border border-brand-slate/20 bg-white p-4 font-semibold text-brand-deep hover:bg-brand-ice"
              >
                {p.name}
                <span className="text-sm font-normal text-brand-slate">
                  {p.bottlesOnSite} btl on site
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Step 2 — the count itself.
  const site = await getSiteStockForCount(partnerId);
  if (!site || site.lines.length === 0) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        {backButton}
        <p className="rounded-lg border border-brand-slate/20 bg-white p-4 text-sm text-brand-slate">
          Nothing is placed at this partner right now.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div>
        {backButton}
        <h1 className="mt-2 text-xl font-bold text-brand">
          Count — {site.partnerName}
        </h1>
        <p className="text-sm text-brand-slate">
          Everything unsold comes home: count expired and damaged as you
          collect; the app derives sold.
        </p>
      </div>
      <CountForm site={site} />
    </div>
  );
}
