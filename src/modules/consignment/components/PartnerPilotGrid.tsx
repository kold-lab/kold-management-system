import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DeactivatePartnerDialog, EditPartnerDialog } from "@/modules/customers";
import type { PartnerPilotCard } from "../queries";

function statusBadge(card: PartnerPilotCard) {
  if (card.worstStatus === null) return <Badge variant="neutral">Empty</Badge>;
  switch (card.worstStatus) {
    case "expired":
      return <Badge variant="danger">Expired on shelf</Badge>;
    case "today":
      return <Badge variant="danger">Expires today</Badge>;
    case "soon":
      return <Badge variant="warning">Expiring ≤2d</Badge>;
    default:
      return <Badge variant="success">Fresh</Badge>;
  }
}

export function PartnerPilotGrid({ cards }: { cards: PartnerPilotCard[] }) {
  if (cards.length === 0) {
    return (
      <p className="rounded-lg border border-brand-slate/20 bg-white p-4 text-sm text-brand-slate">
        No partners yet. Add your first consignment outlet to start placing
        stock.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {cards.map((c) => (
        <div
          key={c.partnerId}
          className="flex w-full flex-col rounded-lg border border-brand-slate/20 bg-white p-4 sm:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.5rem)]"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-bold text-brand-deep">{c.partnerName}</p>
              <p className="text-xs text-brand-slate">
                {c.lastCount
                  ? `last count ${c.lastCount.reconDate}${c.lastCount.status === "DRAFT" ? " (draft)" : ""}`
                  : "never counted"}
              </p>
            </div>
            {statusBadge(c)}
          </div>

          <div className="mt-3 flex-1">
            {c.lines.length === 0 ? (
              <p className="text-sm text-brand-slate">Nothing on the shelf.</p>
            ) : (
              <ul className="space-y-1">
                {c.lines.map((l, i) => (
                  <li
                    key={i}
                    className="flex flex-wrap items-baseline justify-between gap-x-2 text-sm"
                  >
                    <span className="text-brand-deep">{l.label}</span>
                    <span
                      className={
                        l.status === "ok"
                          ? "text-brand-slate"
                          : l.status === "soon"
                            ? "font-semibold text-warning"
                            : "font-semibold text-danger"
                      }
                    >
                      {l.qty} btl · exp {l.expiryDate}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-3 flex items-baseline justify-between border-t border-brand-slate/10 pt-2">
            <span className="text-xs text-brand-slate">bottles on site</span>
            <span className="text-xl font-bold text-brand">{c.totalBottles}</span>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {c.totalBottles > 0 && (
              <Link
                href={`/counts/new?partner=${c.partnerId}`}
                className="inline-flex h-8 items-center rounded bg-brand px-3 text-sm font-semibold text-white hover:bg-brand/90"
              >
                Count
              </Link>
            )}
            <Link
              href={`/placements/new?partner=${c.partnerId}`}
              className="inline-flex h-8 items-center rounded border border-brand-slate/30 bg-white px-3 text-sm font-semibold text-brand-deep hover:bg-brand-ice"
            >
              Restock
            </Link>
            <span className="ml-auto flex gap-1">
              <EditPartnerDialog
                partnerId={c.partnerId}
                name={c.partnerName}
                phone={c.phone}
                email={c.email}
                paymentTermsDays={c.paymentTermsDays}
              />
              <DeactivatePartnerDialog partnerId={c.partnerId} name={c.partnerName} />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
