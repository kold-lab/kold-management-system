import Link from "next/link";

const ACTIONS = [
  { href: "/counts/new", label: "New count", primary: true },
  { href: "/placements/new", label: "Place stock", primary: false },
  { href: "/production/new", label: "New brew", primary: false },
  { href: "/materials", label: "Receive stock", primary: false },
];

/** The dashboard's remote-control pad: its own card, 2×2 thumb-sized shortcuts. */
export function QuickActions() {
  return (
    <div className="flex w-full shrink-0 flex-col justify-center rounded-lg border border-brand-slate/20 bg-white p-3 sm:w-auto">
      <div className="grid grid-cols-2 gap-2">
        {ACTIONS.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className={
              a.primary
                ? "inline-flex h-11 items-center justify-center rounded bg-brand px-3 text-sm font-bold text-white hover:bg-brand/90 sm:min-w-[130px]"
                : "inline-flex h-11 items-center justify-center rounded border border-brand-slate/20 bg-brand-ice px-3 text-sm font-semibold text-brand-deep hover:bg-brand-ice/70 sm:min-w-[130px]"
            }
          >
            {a.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
