import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ReconListItem } from "../queries";

export function CountsTable({ recons }: { recons: ReconListItem[] }) {
  if (recons.length === 0) {
    return (
      <p className="rounded-lg border border-brand-slate/20 bg-white p-4 text-sm text-brand-slate">
        No counts yet. Start one after placing stock at a partner.
      </p>
    );
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Partner</TableHeaderCell>
          <TableHeaderCell>Date</TableHeaderCell>
          <TableHeaderCell>Sold</TableHeaderCell>
          <TableHeaderCell>Waste</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {recons.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-semibold">
              <Link href={`/counts/${r.id}`} className="hover:underline">
                {r.partnerName}
              </Link>
            </TableCell>
            <TableCell>{r.reconDate}</TableCell>
            <TableCell className="font-semibold">{r.totalSold}</TableCell>
            <TableCell>
              {r.totalExpired + r.totalDamaged > 0 ? (
                <span className="text-brand-slate">
                  {r.totalExpired} exp · {r.totalDamaged} dmg
                </span>
              ) : (
                <span className="text-brand-slate">—</span>
              )}
            </TableCell>
            <TableCell>
              {r.status === "SIGNED_OFF" ? (
                <Badge variant="success">Signed off</Badge>
              ) : (
                <Badge variant="warning">Draft</Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
