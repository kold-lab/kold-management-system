import Link from "next/link";
import { DeliveryNotesTable, listDeliveryNotes } from "@/modules/consignment";

export const dynamic = "force-dynamic";

export default async function PlacementsPage() {
  const notes = await listDeliveryNotes();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-brand">Placements</h1>
          <p className="text-sm text-brand-slate">
            Drop-offs at partner sites — each one is a delivery note.
          </p>
        </div>
        <Link
          href="/placements/new"
          aria-label="Place stock"
          title="Place stock"
          className="inline-flex h-10 w-10 items-center justify-center rounded bg-brand text-2xl font-semibold leading-none text-white hover:bg-brand/90"
        >
          +
        </Link>
      </div>
      <DeliveryNotesTable notes={notes} />
    </div>
  );
}
