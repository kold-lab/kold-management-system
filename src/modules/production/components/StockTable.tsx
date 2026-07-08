import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { FinishedLotItem } from "../queries";
import { WriteOffDialog } from "./WriteOffDialog";

function day(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function ExpiryBadge({ lot }: { lot: FinishedLotItem }) {
  switch (lot.expiryStatus) {
    case "expired":
      return <Badge variant="danger">Expired</Badge>;
    case "today":
      return <Badge variant="danger">Expires today</Badge>;
    case "soon":
      return (
        <Badge variant="warning">
          {lot.daysToExpiry} day{lot.daysToExpiry === 1 ? "" : "s"} left
        </Badge>
      );
    default:
      return <Badge variant="neutral">{lot.daysToExpiry} days</Badge>;
  }
}

export function StockTable({ lots }: { lots: FinishedLotItem[] }) {
  if (lots.length === 0) {
    return (
      <p className="rounded-lg border border-brand-slate/20 bg-white p-4 text-sm text-brand-slate">
        No finished stock on hand. Record a brew to fill the shelf.
      </p>
    );
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Product</TableHeaderCell>
          <TableHeaderCell>Location</TableHeaderCell>
          <TableHeaderCell>Bottles</TableHeaderCell>
          <TableHeaderCell>Brewed</TableHeaderCell>
          <TableHeaderCell>Expires</TableHeaderCell>
          <TableHeaderCell />
        </TableRow>
      </TableHead>
      <TableBody>
        {lots.map((lot) => (
          <TableRow key={lot.id}>
            <TableCell className="font-semibold">
              {lot.label}{" "}
              <span className="font-mono text-xs text-brand-slate">
                {lot.skuCode}
              </span>
            </TableCell>
            <TableCell>{lot.locationName}</TableCell>
            <TableCell>{lot.qtyRemaining}</TableCell>
            <TableCell>{day(lot.brewDate)}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <span>{day(lot.expiryDate)}</span>
                <ExpiryBadge lot={lot} />
              </div>
            </TableCell>
            <TableCell className="text-right">
              <WriteOffDialog
                lotId={lot.id}
                lotLabel={`${lot.label} · brewed ${day(lot.brewDate)}`}
                qtyRemaining={lot.qtyRemaining}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
