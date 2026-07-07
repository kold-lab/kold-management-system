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
import { updateMaterialPriceAction, type UpdatePriceState } from "../actions";

const initialState: UpdatePriceState = {};

export function UpdatePriceDialog({
  materialId,
  materialName,
  currentCostLabel,
  unit,
}: {
  materialId: number;
  materialName: string;
  currentCostLabel: string;
  unit: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    updateMaterialPriceAction,
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
        <Button variant="secondary" size="sm">
          Update price
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Update price — {materialName}</DialogTitle>
        <DialogDescription>
          Current cost is {currentCostLabel}/{unit}. Saving appends a new price
          record; history is never overwritten.
        </DialogDescription>
        <form action={formAction} className="mt-4 space-y-3">
          <input type="hidden" name="materialId" value={materialId} />
          <label className="block text-sm font-semibold text-brand-deep">
            New cost per {unit} (RM)
            <Input
              name="costPerUnit"
              inputMode="decimal"
              placeholder="0.00"
              required
              className="mt-1"
            />
          </label>
          {state.error && (
            <p className="text-sm text-danger">{state.error}</p>
          )}
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
              {isPending ? "Saving…" : "Save price"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
