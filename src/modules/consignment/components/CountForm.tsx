"use client";

import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveCountAction, type SaveCountState } from "../actions";
import { buildReconLines } from "../logic";
import type { CountSiteStock } from "../queries";

const initialState: SaveCountState = {};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function CountForm({
  site,
  draft,
}: {
  site: CountSiteStock;
  draft?: {
    id: number;
    reconDate: string;
    lines: Record<number, { expired: string; damaged: string }>;
  };
}) {
  const [state, formAction, isPending] = useActionState(saveCountAction, initialState);
  const [counts, setCounts] = useState<Record<number, { expired: string; damaged: string }>>(
    draft?.lines ?? {}
  );

  const derived = useMemo(() => {
    try {
      const lines = buildReconLines(
        site.lines.map((l) => ({
          productId: l.productId,
          qtyPlaced: l.qtyPlaced,
          qtyExpired: Number(counts[l.productId]?.expired || 0) || 0,
          qtyDamaged: Number(counts[l.productId]?.damaged || 0) || 0,
        }))
      );
      return {
        lines: new Map(lines.map((l) => [l.productId, l.qtySold])),
        totalSold: lines.reduce((s, l) => s + l.qtySold, 0),
        error: null as string | null,
      };
    } catch (e) {
      return {
        lines: new Map<number, number>(),
        totalSold: 0,
        error: e instanceof Error ? e.message : "Invalid count.",
      };
    }
  }, [site.lines, counts]);

  const setField = (productId: number, field: "expired" | "damaged", value: string) =>
    setCounts((prev) => ({
      ...prev,
      [productId]: {
        expired: prev[productId]?.expired ?? "",
        damaged: prev[productId]?.damaged ?? "",
        [field]: value,
      },
    }));

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="partnerId" value={site.partnerId} />
      {draft && <input type="hidden" name="draftId" value={draft.id} />}

      <div className="rounded-lg border border-brand-slate/20 bg-white p-3">
        <label className="block text-sm font-semibold text-brand-deep">
          Count date
          <Input
            type="date"
            name="reconDate"
            defaultValue={draft?.reconDate ?? todayIso()}
            required
            className="mt-1"
          />
        </label>
      </div>

      <div className="space-y-3 rounded-lg border border-brand-slate/20 bg-white p-3">
        <h2 className="text-sm font-bold text-brand">
          Collected from the shelf
        </h2>
        <p className="text-xs text-brand-slate">
          Enter what you&apos;re taking back per flavour — whatever you don&apos;t
          collect counts as sold.
        </p>
        {site.lines.map((l) => {
          const sold = derived.lines.get(l.productId);
          return (
            <div
              key={l.productId}
              className="space-y-2 border-b border-brand-slate/10 pb-3 last:border-b-0 last:pb-0"
            >
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <span className="text-sm font-semibold text-brand-deep">
                  {l.label}
                </span>
                <span className="text-xs text-brand-slate">
                  {l.qtyPlaced} placed
                </span>
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <label className="block text-xs font-semibold text-brand-slate">
                  Expired
                  <Input
                    name={`expired-${l.productId}`}
                    inputMode="numeric"
                    placeholder="0"
                    value={counts[l.productId]?.expired ?? ""}
                    onChange={(e) => setField(l.productId, "expired", e.target.value)}
                    className="mt-1 w-20"
                  />
                </label>
                <label className="block text-xs font-semibold text-brand-slate">
                  Damaged
                  <Input
                    name={`damaged-${l.productId}`}
                    inputMode="numeric"
                    placeholder="0"
                    value={counts[l.productId]?.damaged ?? ""}
                    onChange={(e) => setField(l.productId, "damaged", e.target.value)}
                    className="mt-1 w-20"
                  />
                </label>
                <div className="ml-auto pb-1 text-right">
                  <p className="text-xs text-brand-slate">sold</p>
                  <p className="text-xl font-bold text-brand-deep">
                    {sold ?? "—"}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div className="flex items-baseline justify-between border-t border-brand-slate/20 pt-2">
          <span className="text-sm font-semibold text-brand-deep">Total sold</span>
          <span className="text-xl font-bold text-brand">{derived.totalSold}</span>
        </div>
        {derived.error && <p className="text-sm text-danger">{derived.error}</p>}
      </div>

      <div className="rounded-lg border border-brand-slate/20 bg-white p-3">
        <label className="block text-sm font-semibold text-brand-deep">
          Partner rep (sign-off)
          <Input
            name="signedOffBy"
            placeholder="Name of the person confirming the count"
            className="mt-1"
          />
        </label>
      </div>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="submit"
          name="mode"
          value="sign_off"
          disabled={isPending || derived.error !== null}
          className="w-full sm:flex-1"
        >
          {isPending ? "Saving…" : "Sign off count"}
        </Button>
        <Button
          type="submit"
          name="mode"
          value="draft"
          variant="secondary"
          disabled={isPending || derived.error !== null}
          className="w-full sm:w-auto"
        >
          Save draft
        </Button>
      </div>
    </form>
  );
}
