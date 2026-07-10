"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const GROUPS = [
  {
    label: "Make",
    items: [
      { href: "/materials", label: "Materials" },
      { href: "/catalog", label: "Catalog" },
      { href: "/production", label: "Production" },
      { href: "/stock", label: "Stock" },
    ],
  },
  {
    label: "Consign",
    items: [
      { href: "/partners", label: "Partners" },
      { href: "/placements", label: "Placements" },
      { href: "/counts", label: "Counts" },
    ],
  },
];

export function NavMenu() {
  const [open, setOpen] = useState<string | null>(null);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  return (
    <nav
      ref={ref}
      className="flex min-w-0 flex-1 items-center gap-4 text-sm font-semibold text-brand-deep"
    >
      <Link href="/">Dashboard</Link>
      {GROUPS.map((g) => (
        <div key={g.label} className="relative">
          <button
            type="button"
            onClick={() => setOpen(open === g.label ? null : g.label)}
            className="inline-flex h-9 items-center gap-1 font-semibold text-brand-deep"
          >
            {g.label}
            <span
              className={`text-[10px] transition-transform ${open === g.label ? "rotate-180" : ""}`}
            >
              ▾
            </span>
          </button>
          {open === g.label && (
            <div className="absolute left-0 top-full z-40 mt-1 w-44 rounded-lg border border-brand-slate/20 bg-white py-1 shadow-lg">
              {g.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(null)}
                  className="block px-4 py-2.5 text-brand-deep hover:bg-brand-ice"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}
