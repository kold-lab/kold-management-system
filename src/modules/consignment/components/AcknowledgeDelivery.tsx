"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SignaturePad } from "@/components/ui/signature-pad";
import { acknowledgeDeliveryAction, type AcknowledgeDnState } from "../actions";

const initialState: AcknowledgeDnState = {};

/** On-the-spot partner acknowledgement (D20): name + finger signature. */
export function AcknowledgeDelivery({
  dnId,
  deliveredBy,
  partnerName,
}: {
  dnId: number;
  deliveredBy: string;
  partnerName: string;
}) {
  const [state, formAction, isPending] = useActionState(
    acknowledgeDeliveryAction,
    initialState
  );

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-lg border border-brand/30 bg-brand-ice/50 p-4 print:hidden"
    >
      <h2 className="text-sm font-bold text-brand">Acknowledge delivery</h2>
      <input type="hidden" name="dnId" value={dnId} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-brand-deep">
          Delivered by
          <Input name="deliveredBy" defaultValue={deliveredBy} required className="mt-1" />
        </label>
        <label className="block text-sm font-semibold text-brand-deep">
          Received by ({partnerName})
          <Input
            name="ackName"
            placeholder="Name of the person receiving"
            required
            className="mt-1"
          />
        </label>
      </div>
      <SignaturePad name="ackSignature" label="Partner signature" />
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Saving…" : "Save acknowledgement"}
      </Button>
    </form>
  );
}
