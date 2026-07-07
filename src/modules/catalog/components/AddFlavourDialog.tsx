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
import { addFlavourAction, type AddFlavourState } from "../actions";
import { skuCode, SIZES_ML } from "../logic";

const initialState: AddFlavourState = {};

export function AddFlavourDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [state, formAction, isPending] = useActionState(
    addFlavourAction,
    initialState
  );
  const lastHandledState = useRef(initialState);

  useEffect(() => {
    if (state === lastHandledState.current) return;
    lastHandledState.current = state;
    if (!state.error) {
      setOpen(false);
      setName("");
    }
  }, [state]);

  const trimmed = name.trim();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Add flavour</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Add flavour</DialogTitle>
        <DialogDescription>
          Creates the flavour and one SKU per size ({SIZES_ML.join("ml / ")}
          ml). Set each SKU&apos;s recipe afterwards.
        </DialogDescription>
        <form action={formAction} className="mt-4 space-y-3">
          <label className="block text-sm font-semibold text-brand-deep">
            Flavour name
            <Input
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Honey chrysanthemum"
              required
              className="mt-1"
            />
          </label>
          {trimmed !== "" && (
            <p className="text-sm text-brand-slate">
              Will create SKUs:{" "}
              <span className="font-mono">
                {SIZES_ML.map((s) => skuCode(trimmed, s)).join(", ")}
              </span>
            </p>
          )}
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
              {isPending ? "Saving…" : "Add flavour"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
