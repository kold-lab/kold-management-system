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
import {
  updateMaterialDetailsAction,
  type UpdateMaterialDetailsState,
} from "../actions";

const initialState: UpdateMaterialDetailsState = {};

const selectClassName =
  "mt-1 h-10 w-full rounded border border-brand-slate/30 bg-white px-3 text-sm text-brand-deep focus:outline-none focus:ring-2 focus:ring-brand/40";

export function EditMaterialDialog({
  materialId,
  materialName,
  materialType,
  unit,
  lowStockThreshold,
}: {
  materialId: number;
  materialName: string;
  materialType: "PACKAGING" | "INGREDIENT";
  unit: string;
  lowStockThreshold: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    updateMaterialDetailsAction,
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
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Edit — {materialName}</DialogTitle>
        <DialogDescription>
          Unit ({unit}) can&apos;t change — stock, prices, and recipes are
          counted in it. Use &quot;Update price&quot; for cost changes.
        </DialogDescription>
        <form action={formAction} className="mt-4 space-y-3">
          <input type="hidden" name="materialId" value={materialId} />
          <label className="block text-sm font-semibold text-brand-deep">
            Name
            <Input name="name" defaultValue={materialName} required className="mt-1" />
          </label>
          <label className="block text-sm font-semibold text-brand-deep">
            Type
            <select name="type" required className={selectClassName} defaultValue={materialType}>
              <option value="PACKAGING">Packaging</option>
              <option value="INGREDIENT">Ingredient</option>
            </select>
          </label>
          <label className="block text-sm font-semibold text-brand-deep">
            Low-stock threshold ({unit})
            <Input
              name="lowStockThreshold"
              inputMode="decimal"
              defaultValue={lowStockThreshold}
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
              {isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
