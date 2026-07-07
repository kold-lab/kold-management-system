import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { MaterialListItem } from "../queries";
import { UpdatePriceDialog } from "./UpdatePriceDialog";

const TYPE_LABEL: Record<MaterialListItem["type"], string> = {
  PACKAGING: "Packaging",
  INGREDIENT: "Ingredient",
};

export function MaterialsTable({ materials }: { materials: MaterialListItem[] }) {
  if (materials.length === 0) {
    return (
      <p className="rounded-lg border border-brand-slate/20 bg-white p-6 text-sm text-brand-slate">
        No materials yet.
      </p>
    );
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Material</TableHeaderCell>
          <TableHeaderCell>Type</TableHeaderCell>
          <TableHeaderCell>Stock</TableHeaderCell>
          <TableHeaderCell>Current cost</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell />
        </TableRow>
      </TableHead>
      <TableBody>
        {materials.map((m) => {
          const costLabel = m.currentCost ? `RM ${m.currentCost.toFixed(3)}` : "—";
          return (
            <TableRow key={m.id}>
              <TableCell className="font-semibold">{m.name}</TableCell>
              <TableCell>
                <Badge variant="neutral">{TYPE_LABEL[m.type]}</Badge>
              </TableCell>
              <TableCell>
                {m.stockQty.toString()} {m.unit}
              </TableCell>
              <TableCell>
                {costLabel}
                {m.currentCost && <span className="text-brand-slate">/{m.unit}</span>}
              </TableCell>
              <TableCell>
                {m.isLowStock ? (
                  <Badge variant="warning">Low stock</Badge>
                ) : (
                  <Badge variant="success">OK</Badge>
                )}
              </TableCell>
              <TableCell>
                <UpdatePriceDialog
                  materialId={m.id}
                  materialName={m.name}
                  currentCostLabel={costLabel}
                  unit={m.unit}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
