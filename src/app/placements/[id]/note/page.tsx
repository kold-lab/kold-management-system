import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AcknowledgeDelivery,
  DeliveryNoteDocument,
  getDeliveryNote,
  PrintButton,
  ShareButton,
} from "@/modules/consignment";

export const dynamic = "force-dynamic";

export default async function DeliveryNotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const noteId = Number(id);
  if (!Number.isInteger(noteId) || noteId <= 0) notFound();

  const note = await getDeliveryNote(noteId);
  if (!note) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/placements"
          className="inline-flex h-9 items-center gap-1.5 rounded border border-brand-slate/30 bg-white px-3 text-sm font-semibold text-brand-deep hover:bg-brand-ice"
        >
          ← Placements
        </Link>
        <div className="flex flex-wrap gap-2">
          <ShareButton
            path={`/dn/${note.shareToken}`}
            title={`${note.dnNumber} — ${note.partner.name}`}
          />
          <PrintButton documentTitle={`${note.dnNumber}_kold_delivery_note`} />
        </div>
      </div>

      {!note.ackAt && (
        <AcknowledgeDelivery
          dnId={note.id}
          deliveredBy={note.deliveredBy ?? ""}
          partnerName={note.partner.name}
        />
      )}

      <DeliveryNoteDocument note={note} />
    </div>
  );
}
