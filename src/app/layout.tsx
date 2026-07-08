import type { Metadata } from "next";
import Link from "next/link";
import { Nunito } from "next/font/google";
import { ClerkProvider, SignedIn, UserButton } from "@clerk/nextjs";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "kold ms",
  description: "Internal operations for Kold ready-to-drink cold brew tea.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${nunito.variable} font-sans antialiased`}>
          <header className="flex items-center gap-4 border-b border-brand-slate/20 bg-white px-4 py-2">
            <div className="shrink-0">
              <span className="text-lg font-bold text-brand">k.</span>
              <span className="ml-2 hidden text-sm font-semibold text-brand-slate sm:inline">
                kold ms
              </span>
            </div>
            <nav className="flex min-w-0 flex-1 gap-4 overflow-x-auto whitespace-nowrap py-1 text-sm font-semibold text-brand-deep">
              <Link href="/">Dashboard</Link>
              <Link href="/materials">Materials</Link>
              <Link href="/catalog">Catalog</Link>
              <Link href="/production">Production</Link>
              <Link href="/stock">Stock</Link>
            </nav>
            <div className="shrink-0">
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>
          </header>
          <main className="mx-auto max-w-5xl px-3 py-4 sm:px-5">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
