import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { FlavourListItem } from "../queries";

export function CatalogTable({ flavours }: { flavours: FlavourListItem[] }) {
  if (flavours.length === 0) {
    return (
      <p className="rounded-lg border border-brand-slate/20 bg-white p-6 text-sm text-brand-slate">
        No flavours yet. Add one to generate its SKUs.
      </p>
    );
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Flavour</TableHeaderCell>
          <TableHeaderCell>SKU</TableHeaderCell>
          <TableHeaderCell>Size</TableHeaderCell>
          <TableHeaderCell>Recipe</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {flavours.flatMap((f) =>
          f.skus.map((sku, i) => (
            <TableRow key={sku.id}>
              <TableCell className="font-semibold">
                {i === 0 ? f.name : ""}
              </TableCell>
              <TableCell className="font-mono text-sm">{sku.skuCode}</TableCell>
              <TableCell>{sku.sizeMl}ml</TableCell>
              <TableCell>
                {sku.hasRecipe ? (
                  <Badge variant="success">Recipe set</Badge>
                ) : (
                  <Badge variant="warning">No recipe</Badge>
                )}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
