"use client";

import { useActionState, useMemo, useState } from "react";
import { Decimal } from "decimal.js";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBrewBatchAction, type CreateBatchState } from "../actions";
import {
  computeExpiryDate,
  consumedQty,
  parseBrewDateInput,
  remainingAfterConsumption,
} from "../logic";
import type { NewBatchProduct } from "../queries";

const initialState: CreateBatchState = {};

export function NewBatchForm({
  products,
  defaultBrewDate,
}: {
  products: NewBatchProduct[];
  defaultBrewDate: string;
}) {
  const [productId, setProductId] = useState(
    products.length === 1 ? String(products[0]!.productId) : ""
  );
  const [brewDate, setBrewDate] = useState(defaultBrewDate);
  const [planned, setPlanned] = useState("");
  const [produced, setProduced] = useState("");
  const [state, formAction, isPending] = useActionState(
    createBrewBatchAction,
    initialState
  );

  const product = products.find((p) => String(p.productId) === productId);

  const expiryLabel = useMemo(() => {
    try {
      return computeExpiryDate(parseBrewDateInput(brewDate))
        .toISOString()
        .slice(0, 10);
    } catch {
      return null;
    }
  }, [brewDate]);

  // Live preview follows actual bottles once entered, otherwise planned.
  const bottles = /^\d+$/.test(produced.trim())
    ? Number(produced.trim())
    : /^\d+$/.test(planned.trim())
      ? Number(planned.trim())
      : null;

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-3 rounded-lg border border-brand-slate/20 bg-white p-3">
        <label className="block text-sm font-semibold text-brand-deep">
          SKU
          <select
            name="productId"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
            className="mt-1 h-10 w-full rounded border border-brand-slate/30 bg-white px-3 text-sm text-brand-deep focus:outline-none focus:ring-2 focus:ring-brand/40"
          >
            <option value="">Pick a SKU…</option>
            {products.map((p) => (
              <option key={p.productId} value={p.productId}>
                {p.label} ({p.skuCode})
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap items-end gap-3">
          <label className="block flex-1 text-sm font-semibold text-brand-deep">
            Brew date
            <Input
              type="date"
              name="brewDate"
              value={brewDate}
              onChange={(e) => setBrewDate(e.target.value)}
              required
              className="mt-1"
            />
          </label>
          {expiryLabel && (
            <Badge variant="neutral" className="mb-2">
              Expires {expiryLabel}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-semibold text-brand-deep">
            Planned bottles
            <Input
              name="qtyPlanned"
              inputMode="numeric"
              placeholder="e.g. 20"
              value={planned}
              onChange={(e) => setPlanned(e.target.value)}
              required
              className="mt-1"
            />
          </label>
          <label className="block text-sm font-semibold text-brand-deep">
            Actual bottles
            <Input
              name="qtyProduced"
              inputMode="numeric"
              placeholder="e.g. 18"
              value={produced}
              onChange={(e) => setProduced(e.target.value)}
              required
              className="mt-1"
            />
          </label>
        </div>
      </div>

      {product && (
        <div className="space-y-2 rounded-lg border border-brand-slate/20 bg-white p-3">
          <h2 className="text-sm font-bold text-brand">Will consume</h2>
          {bottles === null ? (
            <p className="text-sm text-brand-slate">
              Enter a bottle count to preview material consumption.
            </p>
          ) : (
            <ul className="space-y-1">
              {product.lines.map((l) => {
                const consumed = consumedQty(new Decimal(l.perBottle), bottles);
                const remaining = remainingAfterConsumption(
                  new Decimal(l.stockQty),
                  consumed
                );
                const short = remaining.isNegative();
                return (
                  <li
                    key={l.materialId}
                    className="flex items-baseline justify-between gap-2 text-sm"
                  >
                    <span className="text-brand-deep">{l.materialName}</span>
                    <span className={short ? "font-semibold text-danger" : "text-brand-slate"}>
                      {consumed.toString()} {l.unit} of {l.stockQty} {l.unit}
                      {short && " — not enough stock"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="flex items-baseline justify-between border-t border-brand-slate/20 pt-2">
            <span className="text-sm font-semibold text-brand-deep">
              Unit cost (today&apos;s prices)
            </span>
            <span className="font-bold text-brand-deep">
              {product.unitCostPreview ? `RM ${product.unitCostPreview}` : "—"}
            </span>
          </div>
          <p className="text-xs text-brand-slate">
            Saving freezes the snapshot using prices effective on the brew date.
          </p>
        </div>
      )}

      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? "Saving…" : "Save brew batch"}
      </Button>
    </form>
  );
}
