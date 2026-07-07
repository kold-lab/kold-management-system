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
import { writeOffLotAction, type WriteOffState } from "../actions";
import { WRITE_OFF_REASONS } from "../logic";

const initialState: WriteOffState = {};

const REASON_LABEL: Record<(typeof WRITE_OFF_REASONS)[number], string> = {
  expired: "Expired",
  damaged: "Damaged",
  other: "Other",
};

export function WriteOffDialog({
  lotId,
  lotLabel,
  qtyRemaining,
}: {
  lotId: number;
  lotLabel: string;
  qtyRemaining: number;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    writeOffLotAction,
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
          Write off
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Write off — {lotLabel}</DialogTitle>
        <DialogDescription>
          {qtyRemaining} bottle{qtyRemaining === 1 ? "" : "s"} remaining. The
          write-off is recorded permanently with its reason.
        </DialogDescription>
        <form action={formAction} className="mt-4 space-y-3">
          <input type="hidden" name="lotId" value={lotId} />
          <label className="block text-sm font-semibold text-brand-deep">
            Bottles to write off
            <Input
              name="qty"
              inputMode="numeric"
              placeholder={String(qtyRemaining)}
              required
              className="mt-1"
            />
          </label>
          <label className="block text-sm font-semibold text-brand-deep">
            Reason
            <select
              name="reason"
              required
              defaultValue=""
              className="mt-1 h-10 w-full rounded border border-brand-slate/30 bg-white px-3 text-sm text-brand-deep focus:outline-none focus:ring-2 focus:ring-brand/40"
            >
              <option value="" disabled>
                Pick a reason…
              </option>
              {WRITE_OFF_REASONS.map((r) => (
                <option key={r} value={r}>
                  {REASON_LABEL[r]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-brand-deep">
            Note (optional)
            <Input name="note" placeholder="e.g. dropped during loading" className="mt-1" />
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
              {isPending ? "Saving…" : "Write off"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
