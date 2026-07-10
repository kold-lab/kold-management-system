"use client";

import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createPlacementAction, type CreatePlacementState } from "../actions";
import {
  allocateFreshestFirst,
  strandedBottles,
  type AllocatableLot,
} from "../logic";
import type {
  PlacementPartnerOption,
  PlacementProductOption,
} from "../queries";

const initialState: CreatePlacementState = {};

const selectClassName =
  "mt-1 h-10 w-full rounded border border-brand-slate/30 bg-white px-3 text-sm text-brand-deep focus:outline-none focus:ring-2 focus:ring-brand/40";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function PlacementForm({
  partners,
  products,
  defaultPartnerId,
}: {
  partners: PlacementPartnerOption[];
  products: PlacementProductOption[];
  defaultPartnerId?: number;
}) {
  const [state, formAction, isPending] = useActionState(
    createPlacementAction,
    initialState
  );
  const [qtys, setQtys] = useState<Record<number, string>>({});
  const [lotChoice, setLotChoice] = useState<Record<number, string>>({});

  const totalBottles = useMemo(
    () =>
      products.reduce((sum, p) => {
        const q = Number(qtys[p.productId] ?? "");
        return sum + (Number.isInteger(q) && q > 0 ? q : 0);
      }, 0),
    [products, qtys]
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-3 rounded-lg border border-brand-slate/20 bg-white p-3">
        <label className="block text-sm font-semibold text-brand-deep">
          Partner
          <select
            name="partnerId"
            required
            className={selectClassName}
            defaultValue={defaultPartnerId && partners.some((p) => p.id === defaultPartnerId) ? defaultPartnerId : ""}
          >
            <option value="" disabled>
              Pick a partner…
            </option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold text-brand-deep">
          Delivery date
          <Input
            type="date"
            name="deliveredAt"
            defaultValue={todayIso()}
            required
            className="mt-1"
          />
        </label>
      </div>

      <div className="space-y-3 rounded-lg border border-brand-slate/20 bg-white p-3">
        <h2 className="text-sm font-bold text-brand">Bottles to place</h2>
        {products.map((p) => {
          const qty = Number(qtys[p.productId] ?? "");
          const hasQty = Number.isInteger(qty) && qty > 0;
          const lots: AllocatableLot[] = p.lots.map((l) => ({
            lotId: l.lotId,
            brewBatchId: 0, // unused client-side
            expiryDate: new Date(`${l.expiryDate}T00:00:00Z`),
            qtyRemaining: l.qtyRemaining,
          }));
          const preferred = lotChoice[p.productId]
            ? Number(lotChoice[p.productId])
            : undefined;

          let expiryChip: string | null = null;
          let shortError: string | null = null;
          let stranded: { count: number; soonestExpiry: Date } | null = null;
          if (hasQty) {
            try {
              const alloc = allocateFreshestFirst(lots, qty, preferred);
              expiryChip = alloc[alloc.length - 1].expiryDate
                .toISOString()
                .slice(0, 10);
              stranded = strandedBottles(lots, alloc);
            } catch (e) {
              shortError = e instanceof Error ? e.message : "Not enough stock.";
            }
          }

          return (
            <div
              key={p.productId}
              className="space-y-2 border-b border-brand-slate/10 pb-3 last:border-b-0 last:pb-0"
            >
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <span className="text-sm font-semibold text-brand-deep">
                  {p.label}
                  <span className="ml-2 font-mono text-xs text-brand-slate">
                    {p.skuCode}
                  </span>
                </span>
                <span className="text-xs text-brand-slate">
                  {p.warehouseQty} in warehouse
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  name={`qty-${p.productId}`}
                  inputMode="numeric"
                  placeholder="0"
                  value={qtys[p.productId] ?? ""}
                  onChange={(e) =>
                    setQtys((prev) => ({ ...prev, [p.productId]: e.target.value }))
                  }
                  className="w-24"
                />
                {p.lots.length > 1 && hasQty && (
                  <select
                    name={`lot-${p.productId}`}
                    value={lotChoice[p.productId] ?? ""}
                    onChange={(e) =>
                      setLotChoice((prev) => ({
                        ...prev,
                        [p.productId]: e.target.value,
                      }))
                    }
                    className="h-10 min-w-0 max-w-full rounded border border-brand-slate/30 bg-white px-2 text-sm text-brand-deep focus:outline-none focus:ring-2 focus:ring-brand/40"
                  >
                    <option value="">Freshest first (default)</option>
                    {p.lots.map((l) => (
                      <option key={l.lotId} value={l.lotId}>
                        Brewed {l.brewDate} · expires {l.expiryDate} · {l.qtyRemaining} left
                      </option>
                    ))}
                  </select>
                )}
                {expiryChip && (
                  <Badge variant="neutral">expires {expiryChip}</Badge>
                )}
              </div>
              {shortError && <p className="text-sm text-danger">{shortError}</p>}
              {stranded && (
                <p className="rounded bg-warning-soft px-2 py-1 text-xs font-semibold text-warning">
                  {stranded.count} older bottle(s) stay in the warehouse and
                  expire {stranded.soonestExpiry.toISOString().slice(0, 10)} —
                  consider placing those first.
                </p>
              )}
            </div>
          );
        })}
        <div className="flex items-baseline justify-between border-t border-brand-slate/20 pt-2">
          <span className="text-sm font-semibold text-brand-deep">Total</span>
          <span className="font-bold text-brand-deep">{totalBottles} btl</span>
        </div>
      </div>

      <div className="rounded-lg border border-brand-slate/20 bg-white p-3">
        <label className="block text-sm font-semibold text-brand-deep">
          Notes — optional
          <Input
            name="notes"
            placeholder="e.g. Keep refrigerated"
            className="mt-1"
          />
        </label>
      </div>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={isPending || totalBottles === 0} className="w-full">
        {isPending ? "Saving…" : "Save & open delivery note"}
      </Button>
    </form>
  );
}
