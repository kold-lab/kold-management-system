"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  setBomLineAction,
  removeBomLineAction,
  type BomLineState,
} from "../actions";

const initialState: BomLineState = {};

type LineProps = {
  materialId: number;
  materialName: string;
  unit: string;
  quantity: string;
  costLabel: string;
};

type OptionProps = {
  id: number;
  name: string;
  unit: string;
};

export function RecipeEditor({
  productId,
  lines,
  materialOptions,
  unitCostLabel,
}: {
  productId: number;
  lines: LineProps[];
  materialOptions: OptionProps[];
  /** Preformatted per-bottle cost, or null while a material lacks a price. */
  unitCostLabel: string | null;
}) {
  const [materialId, setMaterialId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [setState, setFormAction, isSetPending] = useActionState(
    setBomLineAction,
    initialState
  );
  const [removeState, removeFormAction, isRemovePending] = useActionState(
    removeBomLineAction,
    initialState
  );
  const lastHandledState = useRef(initialState);

  useEffect(() => {
    if (setState === lastHandledState.current) return;
    lastHandledState.current = setState;
    if (!setState.error) {
      setMaterialId("");
      setQuantity("");
    }
  }, [setState]);

  const selected = materialOptions.find((m) => String(m.id) === materialId);
  const editing = lines.find((l) => String(l.materialId) === materialId);

  return (
    <div className="space-y-4">
      {lines.length === 0 ? (
        <p className="rounded-lg border border-brand-slate/20 bg-white p-6 text-sm text-brand-slate">
          No recipe yet. Add the per-bottle materials below.
        </p>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Material</TableHeaderCell>
              <TableHeaderCell>Per bottle</TableHeaderCell>
              <TableHeaderCell>Cost</TableHeaderCell>
              <TableHeaderCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {lines.map((l) => (
              <TableRow key={l.materialId}>
                <TableCell className="font-semibold">{l.materialName}</TableCell>
                <TableCell>
                  {l.quantity} {l.unit}
                </TableCell>
                <TableCell>{l.costLabel}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setMaterialId(String(l.materialId));
                        setQuantity(l.quantity);
                      }}
                    >
                      Edit
                    </Button>
                    <form action={removeFormAction}>
                      <input type="hidden" name="productId" value={productId} />
                      <input
                        type="hidden"
                        name="materialId"
                        value={l.materialId}
                      />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        disabled={isRemovePending}
                      >
                        Remove
                      </Button>
                    </form>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <div className="flex items-baseline justify-between rounded-lg border border-brand-slate/20 bg-white px-4 py-3">
        <span className="text-sm font-semibold text-brand-deep">
          Unit material cost
        </span>
        <span className="text-lg font-bold text-brand-deep">
          {unitCostLabel ?? "—"}
        </span>
      </div>
      {lines.length > 0 && unitCostLabel === null && (
        <p className="text-sm text-warning">
          A material in this recipe has no price yet, so the unit cost can’t be
          computed.
        </p>
      )}

      <form
        action={setFormAction}
        className="space-y-3 rounded-lg border border-brand-slate/20 bg-white p-4"
      >
        <h2 className="text-sm font-bold text-brand-deep">
          {editing ? `Update ${editing.materialName}` : "Add material"}
        </h2>
        <input type="hidden" name="productId" value={productId} />
        <label className="block text-sm font-semibold text-brand-deep">
          Material
          <select
            name="materialId"
            value={materialId}
            onChange={(e) => setMaterialId(e.target.value)}
            required
            className="mt-1 h-10 w-full rounded border border-brand-slate/30 bg-white px-3 text-sm text-brand-deep focus:outline-none focus:ring-2 focus:ring-brand/40"
          >
            <option value="">Pick a material…</option>
            {materialOptions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold text-brand-deep">
          Quantity per bottle{selected ? ` (${selected.unit})` : ""}
          <Input
            name="quantity"
            inputMode="decimal"
            placeholder="e.g. 2.5"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            className="mt-1"
          />
        </label>
        {(setState.error ?? removeState.error) && (
          <p className="text-sm text-danger">
            {setState.error ?? removeState.error}
          </p>
        )}
        <div className="flex justify-end pt-1">
          <Button type="submit" size="sm" disabled={isSetPending}>
            {isSetPending ? "Saving…" : editing ? "Update line" : "Add line"}
          </Button>
        </div>
      </form>
    </div>
  );
}
