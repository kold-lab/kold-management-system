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
import { receiveMaterialStockAction, type ReceiveStockState } from "../actions";

const initialState: ReceiveStockState = {};

export function ReceiveStockDialog({
  materialId,
  materialName,
  stockLabel,
  unit,
}: {
  materialId: number;
  materialName: string;
  stockLabel: string;
  unit: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    receiveMaterialStockAction,
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
        <Button size="sm">Receive</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Receive stock — {materialName}</DialogTitle>
        <DialogDescription>
          Current stock is {stockLabel} {unit}. Enter what arrived; fill the
          cost only if this delivery came at a new price.
        </DialogDescription>
        <form action={formAction} className="mt-4 space-y-3">
          <input type="hidden" name="materialId" value={materialId} />
          <label className="block text-sm font-semibold text-brand-deep">
            Quantity received ({unit})
            <Input
              name="quantity"
              inputMode="decimal"
              placeholder="e.g. 500"
              required
              className="mt-1"
            />
          </label>
          <label className="block text-sm font-semibold text-brand-deep">
            New cost per {unit} (RM) — optional
            <Input
              name="costPerUnit"
              inputMode="decimal"
              placeholder="leave blank to keep current price"
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
              {isPending ? "Saving…" : "Receive stock"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
