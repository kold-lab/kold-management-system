"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, UserButton } from "@clerk/nextjs";
import { NavMenu } from "@/components/NavMenu";

/** Internal chrome — hidden on public partner-facing routes (/dn/…). */
export function AppHeader() {
  const pathname = usePathname();
  if (pathname.startsWith("/dn/")) return null;

  return (
    <header className="flex items-center gap-4 border-b border-brand-slate/20 bg-white px-4 py-2 print:hidden">
      <Link href="/" className="shrink-0 text-lg font-bold text-brand">
        k.
      </Link>
      <NavMenu />
      <div className="shrink-0">
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </header>
  );
}
