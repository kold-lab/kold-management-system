import { BUSINESS } from "@/lib/business";
import type { DeliveryNoteDetail } from "../queries";

function BlankSigBox({ label, name }: { label: string; name?: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-brand">{label}</p>
      <div className="mt-8 border-b border-brand-deep" />
      <p className="mt-1 text-xs text-brand-slate">
        name: {name ?? "___________________________"}
      </p>
      <p className="text-xs text-brand-slate">date: ___________________________</p>
    </div>
  );
}

/**
 * The delivery note document (D18/D20) — rendered identically on the
 * internal page, the public share link, and in print. Signature blocks
 * show the captured acknowledgement once it exists; blank lines are the
 * unsigned/offline fallback.
 */
export function DeliveryNoteDocument({ note }: { note: DeliveryNoteDetail }) {
  return (
    <div className="rounded-lg border border-brand-slate/20 bg-white p-6 print:border-0 print:p-0">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand">
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
          <p className="text-[10px] font-bold uppercase tracking-wider text-brand">from</p>
          <p className="text-sm font-bold text-brand-deep">{BUSINESS.legalName}</p>
          {note.deliveredBy && (
            <p className="text-xs text-brand-slate">delivered by {note.deliveredBy}</p>
          )}
        </div>
        <div className="min-w-0">
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
              <td className="py-2 text-right font-semibold text-brand-deep">{l.qty} btl</td>
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

      {/* Acknowledgement */}
      <p className="mt-8 text-[10px] font-bold uppercase tracking-wider text-brand-slate">
        acknowledgement of delivery
      </p>
      {note.ackAt ? (
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4 rounded bg-brand-mist p-4">
          <div className="min-w-0">
            <p className="text-sm font-bold text-brand-deep">{note.ackName}</p>
            <p className="text-xs text-brand-slate">
              acknowledged {note.ackAt.slice(0, 10)} ·{" "}
              {note.ackAt.slice(11, 16)} UTC
            </p>
          </div>
          {note.ackSignature && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={note.ackSignature}
              alt={`Signature of ${note.ackName}`}
              className="h-16 max-w-[200px] object-contain"
            />
          )}
        </div>
      ) : (
        <div className="mt-2 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <BlankSigBox
            label={`delivered by (${BUSINESS.legalName})`}
            name={note.deliveredBy ?? undefined}
          />
          <BlankSigBox label="received by (partner)" name={note.partner.name} />
        </div>
      )}

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
  );
}
