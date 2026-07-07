import Link from "next/link";
import { listMaterials } from "@/modules/materials";
import {
  listFinishedLots,
  summarizeStock,
  StockTable,
} from "@/modules/production";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

function StatCard({
  label,
  value,
  tone = "ok",
}: {
  label: string;
  value: number;
  tone?: "ok" | "warn";
}) {
  return (
    <div className="rounded-lg border border-brand-slate/20 bg-white px-4 py-3">
      <p className="text-xs font-semibold text-brand-slate">{label}</p>
      <p
        className={`text-2xl font-bold ${
          tone === "warn" && value > 0 ? "text-warning" : "text-brand-deep"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default async function DashboardPage() {
  const [lots, materials] = await Promise.all([
    listFinishedLots(),
    listMaterials(),
  ]);
  const summary = summarizeStock(lots);
  const expiringLots = lots.filter((l) => l.expiryStatus !== "ok");
  const lowStockMaterials = materials.filter((m) => m.isLowStock);
  const totalBottles = summary.reduce((sum, r) => sum + r.totalBottles, 0);
  const urgentBottles = summary.reduce((sum, r) => sum + r.urgentBottles, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-brand-deep">Dashboard</h1>
        <p className="text-sm text-brand-slate">
          Stock at a glance and what needs attention.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Bottles on hand" value={totalBottles} />
        <StatCard label="Expiring ≤2 days" value={urgentBottles} tone="warn" />
        <StatCard
          label="Low materials"
          value={lowStockMaterials.length}
          tone="warn"
        />
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-bold text-brand-deep">Stock at a glance</h2>
        {summary.length === 0 ? (
          <p className="rounded-lg border border-brand-slate/20 bg-white p-6 text-sm text-brand-slate">
            No finished stock.{" "}
            <Link
              href="/production/new"
              className="font-semibold text-brand-deep"
            >
              Record a brew
            </Link>{" "}
            to fill the shelf.
          </p>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Product</TableHeaderCell>
                <TableHeaderCell>Bottles</TableHeaderCell>
                <TableHeaderCell>Expiring soon</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {summary.map((row) => (
                <TableRow key={row.skuCode}>
                  <TableCell className="font-semibold">
                    {row.label}{" "}
                    <span className="font-mono text-xs text-brand-slate">
                      {row.skuCode}
                    </span>
                  </TableCell>
                  <TableCell>{row.totalBottles}</TableCell>
                  <TableCell>
                    {row.urgentBottles > 0 ? (
                      <Badge variant="warning">{row.urgentBottles}</Badge>
                    ) : (
                      <span className="text-brand-slate">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      {expiringLots.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-brand-deep">
            Expiring soon — sell or write off
          </h2>
          <StockTable lots={expiringLots} />
        </section>
      )}

      {lowStockMaterials.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-brand-deep">
            Materials to reorder
          </h2>
          <ul className="space-y-1 rounded-lg border border-brand-slate/20 bg-white p-4">
            {lowStockMaterials.map((m) => (
              <li
                key={m.id}
                className="flex items-baseline justify-between text-sm"
              >
                <Link
                  href="/materials"
                  className="font-semibold text-brand-deep"
                >
                  {m.name}
                </Link>
                <span className="text-brand-slate">
                  {m.stockQty.toString()} {m.unit} on hand · reorder at{" "}
                  {m.lowStockThreshold.toString()} {m.unit}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
