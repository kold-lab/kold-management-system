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
import { deactivateMaterialAction, type DeactivateMaterialState } from "../actions";

const initialState: DeactivateMaterialState = {};

export function DeactivateMaterialDialog({
  materialId,
  materialName,
}: {
  materialId: number;
  materialName: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    deactivateMaterialAction,
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
        <Button variant="ghost" size="sm" className="text-danger">
          Deactivate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Deactivate — {materialName}</DialogTitle>
        <DialogDescription>
          The material disappears from lists and pickers; its price history and
          past batches keep their records. Blocked while an active recipe still
          uses it.
        </DialogDescription>
        <form action={formAction} className="mt-4 space-y-3">
          <input type="hidden" name="materialId" value={materialId} />
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
              {isPending ? "Deactivating…" : "Deactivate material"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
