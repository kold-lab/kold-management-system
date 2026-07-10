import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import type { DeliveryNoteListItem } from "../queries";

export function DeliveryNotesTable({ notes }: { notes: DeliveryNoteListItem[] }) {
  if (notes.length === 0) {
    return (
      <p className="rounded-lg border border-brand-slate/20 bg-white p-4 text-sm text-brand-slate">
        No placements yet. Place stock at a partner to generate the first
        delivery note.
      </p>
    );
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>DN</TableHeaderCell>
          <TableHeaderCell>Partner</TableHeaderCell>
          <TableHeaderCell>Date</TableHeaderCell>
          <TableHeaderCell>Bottles</TableHeaderCell>
          <TableHeaderCell />
        </TableRow>
      </TableHead>
      <TableBody>
        {notes.map((n) => (
          <TableRow key={n.id}>
            <TableCell className="font-mono font-semibold">
              {n.dnNumber}
              {n.acknowledged && (
                <Badge variant="success" className="ml-2">signed</Badge>
              )}
            </TableCell>
            <TableCell className="font-semibold">{n.partnerName}</TableCell>
            <TableCell>{n.deliveredAt}</TableCell>
            <TableCell>
              {n.totalBottles}
              <span className="ml-2 text-xs text-brand-slate">{n.skuSummary}</span>
            </TableCell>
            <TableCell className="text-right">
              <Link
                href={`/placements/${n.id}/note`}
                className="text-sm font-semibold text-brand hover:underline"
              >
                View note
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
