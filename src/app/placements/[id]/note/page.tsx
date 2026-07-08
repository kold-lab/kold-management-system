import Link from "next/link";
import { notFound } from "next/navigation";
import { getDeliveryNote, PrintButton } from "@/modules/consignment";
import { BUSINESS } from "@/lib/business";

export const dynamic = "force-dynamic";

function SigBox({ label, name }: { label: string; name?: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-brand">
        {label}
      </p>
      <div className="mt-8 border-b border-brand-deep" />
      <p className="mt-1 text-xs text-brand-slate">
        name: {name ?? "___________________________"}
      </p>
      <p className="text-xs text-brand-slate">date: ___________________________</p>
    </div>
  );
}

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
        <PrintButton documentTitle={`${note.dnNumber}_kold_delivery_note`} />
      </div>

      {/* ── The document ── */}
      <div className="rounded-lg border border-brand-slate/20 bg-white p-6 print:border-0 print:p-0">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand">
              <span className="text-sm font-bold text-white">{BUSINESS.brand}.</span>
            </div>
            <div>
              <p className="text-lg font-bold text-brand">{BUSINESS.legalName}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-slate">
                delivery note
              </p>
            </div>
          </div>
          <div className="text-right text-xs leading-relaxed text-brand-slate">
            <p className="text-base font-bold text-brand-deep">{note.dnNumber}</p>
            <p>date: {note.deliveredAt}</p>
          </div>
        </div>

        {/* Parties */}
        <div className="mt-6 grid grid-cols-1 gap-4 rounded bg-brand-mist p-4 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-brand">
              from
            </p>
            <p className="text-sm font-bold text-brand-deep">{BUSINESS.legalName}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-brand">
              delivered to
            </p>
            <p className="text-sm font-bold text-brand-deep">{note.partner.name}</p>
            {(note.partner.phone || note.partner.email) && (
              <p className="text-xs text-brand-slate">
                {[note.partner.phone, note.partner.email].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        </div>

        {/* Delivered table */}
        <p className="mt-6 text-[10px] font-bold uppercase tracking-wider text-brand-slate">
          bottles delivered
        </p>
        <table className="mt-2 w-full text-sm">
          <thead>
            <tr className="border-b border-brand-slate/20 text-left text-[10px] font-bold uppercase tracking-wider text-brand-slate">
              <th className="py-2">Flavour</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Best before</th>
            </tr>
          </thead>
          <tbody>
            {note.lines.map((l, i) => (
              <tr key={i} className="border-b border-brand-slate/10">
                <td className="py-2 text-brand-deep">{l.label}</td>
                <td className="py-2 text-right font-semibold text-brand-deep">
                  {l.qty} btl
                </td>
                <td className="py-2 text-right text-brand-deep">{l.expiryDate}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="pt-3 font-bold text-brand-deep">total delivered</td>
              <td className="pt-3 text-right font-bold text-brand" colSpan={2}>
                {note.totalBottles} btl
              </td>
            </tr>
          </tfoot>
        </table>

        {note.notes && (
          <p className="mt-4 border-t border-brand-slate/20 pt-3 text-xs text-brand-slate">
            {note.notes}
          </p>
        )}

        {/* Acknowledgement — delivery */}
        <p className="mt-8 text-[10px] font-bold uppercase tracking-wider text-brand-slate">
          acknowledgement of delivery
        </p>
        <div className="mt-2 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <SigBox label={`delivered by (${BUSINESS.legalName})`} />
          <SigBox label="received by (partner)" name={note.partner.name} />
        </div>

        {/* Return section */}
        <div className="relative mt-10 border-t border-dashed border-brand-slate/40">
          <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-[10px] font-bold uppercase tracking-wider text-brand-slate/60 print:bg-white">
            return section
          </span>
        </div>
        <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-brand-slate">
          bottles returned (same batch)
        </p>
        <p className="mt-1 text-xs text-brand-slate">
          To be completed on collection of unsold stock. Fill in manually.
        </p>
        <table className="mt-2 w-full text-sm">
          <thead>
            <tr className="border-b border-brand-slate/20 text-left text-[10px] font-bold uppercase tracking-wider text-brand-slate">
              <th className="py-2">Flavour</th>
              <th className="py-2 text-right">Qty returned</th>
            </tr>
          </thead>
          <tbody>
            {note.lines.map((l, i) => (
              <tr key={i} className="border-b border-brand-slate/10">
                <td className="py-2 text-brand-deep">{l.label}</td>
                <td className="py-3 text-right">
                  <div className="ml-auto h-6 w-20 border-b border-brand-slate" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Acknowledgement — return */}
        <p className="mt-8 text-[10px] font-bold uppercase tracking-wider text-brand-slate">
          acknowledgement of return
        </p>
        <div className="mt-2 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <SigBox label={`collected by (${BUSINESS.legalName})`} />
          <SigBox label="returned by (partner)" name={note.partner.name} />
        </div>

        {/* Footer */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-brand-slate/20 pt-3 text-xs">
          <div>
            <p className="font-bold text-brand">{BUSINESS.legalName}</p>
            <p className="text-brand-slate">({BUSINESS.regNo})</p>
          </div>
          <p className="text-brand-slate">
            {note.dnNumber} · {note.deliveredAt}
          </p>
        </div>
      </div>
    </div>
  );
}
