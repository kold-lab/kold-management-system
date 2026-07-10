import { notFound } from "next/navigation";
import {
  DeliveryNoteDocument,
  getDeliveryNoteByToken,
  PrintButton,
} from "@/modules/consignment";

export const dynamic = "force-dynamic";

/** The partner's read-only copy — public via unguessable token, no sign-in. */
export default async function PublicDeliveryNotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!token || token.length < 10) notFound();

  const note = await getDeliveryNoteByToken(token);
  if (!note) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 flex justify-end print:hidden">
        <PrintButton documentTitle={`${note.dnNumber}_kold_delivery_note`} />
      </div>
      <DeliveryNoteDocument note={note} />
      <p className="mt-3 text-center text-xs text-brand-slate print:hidden">
        Live copy — reflects the delivery record at kold brew hub.
      </p>
    </div>
  );
}
