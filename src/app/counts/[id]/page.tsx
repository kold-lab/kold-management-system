import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  CountForm,
  getReconciliation,
  getSiteStockForCount,
} from "@/modules/consignment";

export const dynamic = "force-dynamic";

export default async function CountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reconId = Number(id);
  if (!Number.isInteger(reconId) || reconId <= 0) notFound();

  const recon = await getReconciliation(reconId);
  if (!recon) notFound();

  const backButton = (
    <Link
      href="/counts"
      className="inline-flex h-9 items-center gap-1.5 rounded border border-brand-slate/30 bg-white px-3 text-sm font-semibold text-brand-deep hover:bg-brand-ice"
    >
      ← Counts
    </Link>
  );

  // Drafts stay editable (rule 5) — reopen the form against live site stock.
  if (recon.status === "DRAFT") {
    const site = await getSiteStockForCount(recon.partnerId);
    if (site && site.lines.length > 0) {
      return (
        <div className="mx-auto max-w-lg space-y-4">
          <div>
            {backButton}
            <h1 className="mt-2 text-xl font-bold text-brand">
              Draft count — {recon.partnerName}
            </h1>
            <p className="text-sm text-brand-slate">
              Continue where you left off; sign off to lock it.
            </p>
          </div>
          <CountForm
            site={site}
            draft={{
              id: recon.id,
              reconDate: recon.reconDate,
              lines: Object.fromEntries(
                recon.lines.map((l) => [
                  l.productId,
                  { expired: String(l.qtyExpired || ""), damaged: String(l.qtyDamaged || "") },
                ])
              ),
            }}
          />
        </div>
      );
    }
  }

  // Signed-off (or stockless draft): read-only record.
  const totalSold = recon.lines.reduce((s, l) => s + l.qtySold, 0);
  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {backButton}
        {recon.status === "SIGNED_OFF" ? (
          <Badge variant="success">Signed off</Badge>
        ) : (
          <Badge variant="warning">Draft</Badge>
        )}
      </div>
      <div>
        <h1 className="text-xl font-bold text-brand">
          Count — {recon.partnerName}
        </h1>
        <p className="text-sm text-brand-slate">
          {recon.reconDate}
          {recon.signedOffBy && <> · acknowledged by {recon.signedOffBy}</>}
        </p>
      </div>
      {recon.ackSignature && (
        <div className="flex flex-wrap items-end justify-between gap-3 rounded-lg border border-brand-slate/20 bg-white p-4">
          <div className="min-w-0">
            <p className="text-sm font-bold text-brand-deep">{recon.signedOffBy}</p>
            {recon.ackAt && (
              <p className="text-xs text-brand-slate">signed {recon.ackAt.slice(0, 10)}</p>
            )}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={recon.ackSignature}
            alt={`Signature of ${recon.signedOffBy ?? "partner rep"}`}
            className="h-16 max-w-[200px] object-contain"
          />
        </div>
      )}
      <div className="space-y-3 rounded-lg border border-brand-slate/20 bg-white p-4">
        {recon.lines.map((l) => (
          <div
            key={l.productId}
            className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-brand-slate/10 pb-2 last:border-b-0 last:pb-0"
          >
            <span className="text-sm font-semibold text-brand-deep">{l.label}</span>
            <span className="text-sm text-brand-slate">
              {l.qtyPlaced} placed · <strong className="text-brand-deep">{l.qtySold} sold</strong>
              {l.qtyExpired > 0 && <> · {l.qtyExpired} expired</>}
              {l.qtyDamaged > 0 && <> · {l.qtyDamaged} damaged</>}
            </span>
          </div>
        ))}
        <div className="flex items-baseline justify-between border-t border-brand-slate/20 pt-2">
          <span className="text-sm font-semibold text-brand-deep">Total sold</span>
          <span className="text-xl font-bold text-brand">{totalSold}</span>
        </div>
      </div>
      <Link
        href={`/placements/new?partner=${recon.partnerId}`}
        className="block rounded-lg border border-brand-slate/20 bg-brand-ice p-4 text-center text-sm font-semibold text-brand-deep hover:bg-brand-ice/70"
      >
        Restock this partner → Place stock
      </Link>
    </div>
  );
}
