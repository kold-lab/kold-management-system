import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { QuickActions } from "@/components/QuickActions";
import { listMaterials } from "@/modules/materials";
import { listFinishedLots, summarizeStock } from "@/modules/production";
import {
  getPartnerPilot,
  isCountOverdue,
  listReconciliations,
} from "@/modules/consignment";

export const dynamic = "force-dynamic";

// Validated pair for the split bar (dataviz six checks, light surface):
// warehouse #1f6ba8, partners #409bd8 — direct labels carry identity.
const SPLIT = { warehouse: "#1f6ba8", partners: "#409bd8" };

function myToday(): Date {
  // Malaysia time (UTC+8) — the business day, not the server's.
  return new Date(Date.now() + 8 * 3600_000);
}

function greeting(hourMy: number): string {
  if (hourMy < 12) return "Good morning";
  if (hourMy < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const [user, lots, materials, pilot, recons] = await Promise.all([
    currentUser(),
    listFinishedLots(),
    listMaterials(),
    getPartnerPilot(),
    listReconciliations(),
  ]);

  const nowMy = myToday();
  const today = new Date();

  // ── derive the day ──
  const warehouseLots = lots.filter((l) => l.locationType === "WAREHOUSE");
  const warehouseBottles = warehouseLots.reduce((s, l) => s + l.qtyRemaining, 0);
  const partnerBottles = pilot.reduce((s, c) => s + c.totalBottles, 0);
  const totalBottles = warehouseBottles + partnerBottles;

  const urgentWarehouse = warehouseLots
    .filter((l) => l.expiryStatus !== "ok")
    .reduce((s, l) => s + l.qtyRemaining, 0);
  const urgentPartnerCards = pilot.filter(
    (c) => c.worstStatus !== null && c.worstStatus !== "ok"
  );
  const urgentPartnerBottles = urgentPartnerCards.reduce(
    (s, c) => s + c.lines.filter((l) => l.status !== "ok").reduce((x, l) => x + l.qty, 0),
    0
  );

  const overdueCounts = pilot.filter((c) =>
    isCountOverdue(
      c.lastCount ? new Date(`${c.lastCount.reconDate}T00:00:00Z`) : null,
      today,
      c.totalBottles
    )
  );
  const lowMaterials = materials.filter((m) => m.isLowStock);

  const weekAgoIso = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);
  const weekRecons = recons.filter(
    (r) => r.status === "SIGNED_OFF" && r.reconDate >= weekAgoIso
  );
  const soldWeek = weekRecons.reduce((s, r) => s + r.totalSold, 0);
  const wasteWeek = weekRecons.reduce((s, r) => s + r.totalExpired + r.totalDamaged, 0);

  // ── the day-summary sentence ──
  const attention: string[] = [];
  if (urgentWarehouse + urgentPartnerBottles > 0) {
    attention.push(
      `${urgentWarehouse + urgentPartnerBottles} bottles expiring soon${urgentPartnerBottles > 0 ? ` (${urgentPartnerBottles} at partners)` : ""}`
    );
  }
  if (overdueCounts.length > 0) {
    attention.push(
      `${overdueCounts.length} ${overdueCounts.length === 1 ? "partner" : "partners"} due for a count`
    );
  }
  if (lowMaterials.length > 0) {
    attention.push(
      `${lowMaterials.length} ${lowMaterials.length === 1 ? "material" : "materials"} to reorder`
    );
  }
  const summary =
    attention.length > 0 ? attention.join(" · ") : "All clear — nothing needs you right now.";

  const skuRows = summarizeStock(warehouseLots);
  const maxSkuBottles = Math.max(1, ...skuRows.map((r) => r.totalBottles));

  return (
    <div className="space-y-4">
      {/* ── Hero + remote pad, side by side ── */}
      <div className="flex flex-wrap items-stretch gap-3">
        <div className="min-w-[240px] flex-1 rounded-lg bg-gradient-to-br from-brand-deep to-[#1f6ba8] p-5 text-white">
          <p className="text-sm text-white/70">
            {greeting(nowMy.getUTCHours())}
            {user?.firstName ? `, ${user.firstName}` : ""} ·{" "}
            {nowMy.toLocaleDateString("en-MY", {
              weekday: "long",
              day: "numeric",
              month: "long",
              timeZone: "UTC",
            })}
          </p>
          <p className="mt-2 text-lg font-bold leading-snug">{summary}</p>
        </div>
        <QuickActions />
      </div>

      {/* ── Action queue ── */}
      {attention.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {urgentWarehouse + urgentPartnerBottles > 0 && (
            <Link
              href="/stock"
              className="flex min-w-[240px] flex-1 items-center justify-between gap-3 rounded-lg border-l-4 border-danger bg-white p-4 shadow-sm hover:bg-danger-soft/40"
            >
              <div className="min-w-0">
                <p className="text-2xl font-bold text-brand-deep">
                  {urgentWarehouse + urgentPartnerBottles}
                  <span className="ml-1 text-sm font-semibold text-brand-slate">btl</span>
                </p>
                <p className="text-sm text-brand-slate">
                  expiring ≤2 days
                  {urgentPartnerBottles > 0 && ` · ${urgentPartnerBottles} at partners`}
                </p>
              </div>
              <span className="shrink-0 text-sm font-bold text-danger">Act →</span>
            </Link>
          )}
          {overdueCounts.slice(0, 2).map((c) => (
            <Link
              key={c.partnerId}
              href={`/counts/new?partner=${c.partnerId}`}
              className="flex min-w-[240px] flex-1 items-center justify-between gap-3 rounded-lg border-l-4 border-warning bg-white p-4 shadow-sm hover:bg-warning-soft/40"
            >
              <div className="min-w-0">
                <p className="truncate font-bold text-brand-deep">{c.partnerName}</p>
                <p className="text-sm text-brand-slate">
                  {c.lastCount ? `count due — last ${c.lastCount.reconDate}` : "never counted"} ·{" "}
                  {c.totalBottles} btl on site
                </p>
              </div>
              <span className="shrink-0 text-sm font-bold text-warning">Count →</span>
            </Link>
          ))}
          {overdueCounts.length > 2 && (
            <Link
              href="/partners"
              className="flex min-w-[160px] items-center justify-center rounded-lg border border-brand-slate/20 bg-white p-4 text-sm font-semibold text-brand-deep hover:bg-brand-ice"
            >
              +{overdueCounts.length - 2} more due →
            </Link>
          )}
          {lowMaterials.length > 0 && (
            <Link
              href="/materials"
              className="flex min-w-[240px] flex-1 items-center justify-between gap-3 rounded-lg border-l-4 border-warning bg-white p-4 shadow-sm hover:bg-warning-soft/40"
            >
              <div className="min-w-0">
                <p className="text-2xl font-bold text-brand-deep">
                  {lowMaterials.length}
                  <span className="ml-1 text-sm font-semibold text-brand-slate">
                    material{lowMaterials.length === 1 ? "" : "s"}
                  </span>
                </p>
                <p className="truncate text-sm text-brand-slate">
                  to reorder — {lowMaterials.map((m) => m.name).slice(0, 2).join(", ")}
                  {lowMaterials.length > 2 && "…"}
                </p>
              </div>
              <span className="shrink-0 text-sm font-bold text-warning">Reorder →</span>
            </Link>
          )}
        </div>
      )}

      {/* ── Pulse ── */}
      <div className="flex flex-wrap gap-3">
        {/* Stock split */}
        <div className="min-w-[260px] flex-1 rounded-lg border border-brand-slate/20 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-slate">
            Bottles in play
          </p>
          <p className="mt-1 text-3xl font-bold text-brand-deep">{totalBottles}</p>
          {totalBottles > 0 ? (
            <>
              <div className="mt-3 flex h-3 w-full gap-[2px] overflow-hidden rounded">
                {warehouseBottles > 0 && (
                  <div
                    className="rounded-l"
                    style={{
                      backgroundColor: SPLIT.warehouse,
                      width: `${(warehouseBottles / totalBottles) * 100}%`,
                    }}
                  />
                )}
                {partnerBottles > 0 && (
                  <div
                    className="rounded-r"
                    style={{
                      backgroundColor: SPLIT.partners,
                      width: `${(partnerBottles / totalBottles) * 100}%`,
                    }}
                  />
                )}
              </div>
              <p className="mt-2 text-sm text-brand-slate">
                <span className="font-semibold text-brand-deep">{warehouseBottles}</span> warehouse ·{" "}
                <span className="font-semibold text-brand-deep">{partnerBottles}</span> at partners
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-brand-slate">
              Shelf is empty —{" "}
              <Link href="/production/new" className="font-semibold text-brand-deep">
                record a brew
              </Link>
              .
            </p>
          )}
        </div>

        {/* Week pulse */}
        <div className="min-w-[130px] flex-1 rounded-lg border border-brand-slate/20 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-slate">
            Sold · 7 days
          </p>
          <p className="mt-1 text-3xl font-bold text-brand-deep">{soldWeek}</p>
          <p className="mt-2 text-sm text-brand-slate">
            {weekRecons.length === 0 ? "no signed-off counts yet" : `${weekRecons.length} count${weekRecons.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <div className="min-w-[130px] flex-1 rounded-lg border border-brand-slate/20 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-slate">
            Waste · 7 days
          </p>
          <p className={`mt-1 text-3xl font-bold ${wasteWeek > 0 ? "text-warning" : "text-brand-deep"}`}>
            {wasteWeek}
          </p>
          <p className="mt-2 text-sm text-brand-slate">expired + damaged</p>
        </div>
      </div>

      {/* ── Warehouse levels per SKU ── */}
      {skuRows.length > 0 && (
        <div className="rounded-lg border border-brand-slate/20 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-slate">
            Warehouse by flavour
          </p>
          <ul className="mt-3 space-y-2.5">
            {skuRows.map((row) => (
              <li key={row.skuCode} title={`${row.label}: ${row.totalBottles} bottles${row.urgentBottles > 0 ? `, ${row.urgentBottles} urgent` : ""}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="text-sm font-semibold text-brand-deep">{row.label}</span>
                  <span className="text-sm text-brand-slate">
                    <span className="font-semibold text-brand-deep">{row.totalBottles}</span> btl
                    {row.urgentBottles > 0 && (
                      <span className="ml-1 font-semibold text-danger">
                        · {row.urgentBottles} urgent
                      </span>
                    )}
                  </span>
                </div>
                <div className="mt-1 h-2 w-full rounded bg-brand-mist">
                  <div
                    className="h-2 rounded"
                    style={{
                      backgroundColor: SPLIT.partners,
                      width: `${(row.totalBottles / maxSkuBottles) * 100}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
