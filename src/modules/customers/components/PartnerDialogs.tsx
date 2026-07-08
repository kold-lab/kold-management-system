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
  createPartnerAction,
  deactivatePartnerAction,
  updatePartnerAction,
  type PartnerState,
} from "../actions";

const initialState: PartnerState = {};

function PartnerFields({
  defaults,
}: {
  defaults?: { name: string; phone: string; email: string; paymentTermsDays: number };
}) {
  return (
    <>
      <label className="block text-sm font-semibold text-brand-deep">
        Partner / outlet name
        <Input
          name="name"
          placeholder="e.g. Kopi Tiam Bangsar"
          defaultValue={defaults?.name}
          required
          className="mt-1"
        />
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-brand-deep">
          Phone — optional
          <Input
            name="phone"
            inputMode="tel"
            placeholder="012-3456789"
            defaultValue={defaults?.phone}
            className="mt-1"
          />
        </label>
        <label className="block text-sm font-semibold text-brand-deep">
          Email — optional
          <Input
            name="email"
            inputMode="email"
            placeholder="hi@outlet.com"
            defaultValue={defaults?.email}
            className="mt-1"
          />
        </label>
      </div>
      <label className="block text-sm font-semibold text-brand-deep">
        Payment terms (days)
        <Input
          name="paymentTermsDays"
          inputMode="numeric"
          placeholder="14"
          defaultValue={defaults?.paymentTermsDays}
          className="mt-1"
        />
      </label>
    </>
  );
}

export function AddPartnerDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createPartnerAction, initialState);
  const lastHandledState = useRef(initialState);

  useEffect(() => {
    if (state === lastHandledState.current) return;
    lastHandledState.current = state;
    if (!state.error) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add partner</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Add partner</DialogTitle>
        <DialogDescription>
          Creates the partner and their consignment site. Placements and weekly
          counts happen against that site.
        </DialogDescription>
        <form action={formAction} className="mt-4 space-y-3">
          <PartnerFields />
          {state.error && <p className="text-sm text-danger">{state.error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Saving…" : "Add partner"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditPartnerDialog({
  partnerId,
  name,
  phone,
  email,
  paymentTermsDays,
}: {
  partnerId: number;
  name: string;
  phone: string | null;
  email: string | null;
  paymentTermsDays: number;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(updatePartnerAction, initialState);
  const lastHandledState = useRef(initialState);

  useEffect(() => {
    if (state === lastHandledState.current) return;
    lastHandledState.current = state;
    if (!state.error) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Edit — {name}</DialogTitle>
        <DialogDescription>
          Renaming also renames the partner&apos;s site. Every change is audited.
        </DialogDescription>
        <form action={formAction} className="mt-4 space-y-3">
          <input type="hidden" name="partnerId" value={partnerId} />
          <PartnerFields
            defaults={{ name, phone: phone ?? "", email: email ?? "", paymentTermsDays }}
          />
          {state.error && <p className="text-sm text-danger">{state.error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
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

export function DeactivatePartnerDialog({
  partnerId,
  name,
}: {
  partnerId: number;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(deactivatePartnerAction, initialState);
  const lastHandledState = useRef(initialState);

  useEffect(() => {
    if (state === lastHandledState.current) return;
    lastHandledState.current = state;
    if (!state.error) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-danger">
          Deactivate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Deactivate — {name}</DialogTitle>
        <DialogDescription>
          The partner and their site disappear from lists; placement and
          reconciliation history keeps its records. Blocked while bottles
          still sit at their site.
        </DialogDescription>
        <form action={formAction} className="mt-4 space-y-3">
          <input type="hidden" name="partnerId" value={partnerId} />
          {state.error && <p className="text-sm text-danger">{state.error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Deactivating…" : "Deactivate partner"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
