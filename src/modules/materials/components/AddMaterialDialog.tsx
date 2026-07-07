"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createMaterialAction, type CreateMaterialState } from "../actions";

const initialState: CreateMaterialState = {};

const selectClassName =
  "mt-1 h-10 w-full rounded border border-brand-slate/30 bg-white px-3 text-sm text-brand-deep focus:outline-none focus:ring-2 focus:ring-brand/40";

export function AddMaterialDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    createMaterialAction,
    initialState
  );
  const lastHandledState = useRef(initialState);

  useEffect(() => {
    if (state === lastHandledState.current) return;
    lastHandledState.current = state;
    if (!state.error) {
      setOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add material</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Add material</DialogTitle>
        <DialogDescription>
          Stock starts at 0 — receive a delivery after adding. The cost becomes
          the first price history entry.
        </DialogDescription>
        <form action={formAction} className="mt-4 space-y-3">
          <label className="block text-sm font-semibold text-brand-deep">
            Name
            <Input name="name" placeholder="e.g. Honey" required className="mt-1" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-semibold text-brand-deep">
              Type
              <select name="type" required className={selectClassName} defaultValue="">
                <option value="" disabled>
                  Choose…
                </option>
                <option value="PACKAGING">Packaging</option>
                <option value="INGREDIENT">Ingredient</option>
              </select>
            </label>
            <label className="block text-sm font-semibold text-brand-deep">
              Unit
              <select name="unit" required className={selectClassName} defaultValue="">
                <option value="" disabled>
                  Choose…
                </option>
                <option value="pcs">pcs</option>
                <option value="g">g</option>
              </select>
            </label>
          </div>
          <label className="block text-sm font-semibold text-brand-deep">
            Cost per unit (RM)
            <Input
              name="costPerUnit"
              inputMode="decimal"
              placeholder="0.00"
              required
              className="mt-1"
            />
          </label>
          <label className="block text-sm font-semibold text-brand-deep">
            Low-stock threshold — optional
            <Input
              name="lowStockThreshold"
              inputMode="decimal"
              placeholder="0"
              className="mt-1"
            />
          </label>
          {state.error && <p className="text-sm text-danger">{state.error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Saving…" : "Add material"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
