import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { PartnerListItem } from "../queries";
import { DeactivatePartnerDialog, EditPartnerDialog } from "./PartnerDialogs";

export function PartnersTable({ partners }: { partners: PartnerListItem[] }) {
  if (partners.length === 0) {
    return (
      <p className="rounded-lg border border-brand-slate/20 bg-white p-4 text-sm text-brand-slate">
        No partners yet. Add your first consignment outlet to start placing
        stock.
      </p>
    );
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Partner</TableHeaderCell>
          <TableHeaderCell>Contact</TableHeaderCell>
          <TableHeaderCell>Terms</TableHeaderCell>
          <TableHeaderCell>On site</TableHeaderCell>
          <TableHeaderCell />
        </TableRow>
      </TableHead>
      <TableBody>
        {partners.map((p) => (
          <TableRow key={p.id}>
            <TableCell className="font-semibold">{p.name}</TableCell>
            <TableCell>
              {p.phone || p.email ? (
                <div className="space-y-0.5">
                  {p.phone && <div>{p.phone}</div>}
                  {p.email && (
                    <div className="text-xs text-brand-slate">{p.email}</div>
                  )}
                </div>
              ) : (
                <span className="text-brand-slate">—</span>
              )}
            </TableCell>
            <TableCell>Net {p.paymentTermsDays}</TableCell>
            <TableCell>
              {p.bottlesOnSite > 0 ? (
                <Badge variant="neutral">{p.bottlesOnSite} btl</Badge>
              ) : (
                <span className="text-brand-slate">—</span>
              )}
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap justify-end gap-2">
                <EditPartnerDialog
                  partnerId={p.id}
                  name={p.name}
                  phone={p.phone}
                  email={p.email}
                  paymentTermsDays={p.paymentTermsDays}
                />
                <DeactivatePartnerDialog partnerId={p.id} name={p.name} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
