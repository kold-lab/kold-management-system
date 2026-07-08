import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { BrewBatchListItem } from "../queries";

function day(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function BatchHistoryTable({ batches }: { batches: BrewBatchListItem[] }) {
  if (batches.length === 0) {
    return (
      <p className="rounded-lg border border-brand-slate/20 bg-white p-4 text-sm text-brand-slate">
        No brews recorded yet.
      </p>
    );
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Product</TableHeaderCell>
          <TableHeaderCell>Brewed</TableHeaderCell>
          <TableHeaderCell>Expires</TableHeaderCell>
          <TableHeaderCell>Bottles</TableHeaderCell>
          <TableHeaderCell>Unit cost</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {batches.map((b) => (
          <TableRow key={b.id}>
            <TableCell className="font-semibold">
              {b.label}{" "}
              <span className="font-mono text-xs text-brand-slate">
                {b.skuCode}
              </span>
            </TableCell>
            <TableCell>{day(b.brewDate)}</TableCell>
            <TableCell>{day(b.expiryDate)}</TableCell>
            <TableCell>
              {b.qtyProduced}
              <span className="text-brand-slate"> / {b.qtyPlanned} planned</span>
            </TableCell>
            <TableCell>RM {b.unitCostSnapshot.toFixed(3)}</TableCell>
            <TableCell>
              {b.status === "WRITTEN_OFF" ? (
                <Badge variant="danger">Written off</Badge>
              ) : (
                <Badge variant="success">Completed</Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
