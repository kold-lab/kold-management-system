import type { Metadata } from "next";
import Link from "next/link";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "Kold Ops",
  description: "Internal operations for Kold ready-to-drink cold brew tea.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${nunito.variable} font-sans antialiased`}>
        <header className="flex items-center gap-6 border-b border-brand-slate/20 bg-white px-6 py-3">
          <div>
            <span className="text-lg font-bold text-brand-deep">k.</span>
            <span className="ml-2 text-sm font-semibold text-brand-slate">
              Kold Ops
            </span>
          </div>
          <nav className="flex gap-4 text-sm font-semibold text-brand-deep">
            <Link href="/materials">Materials</Link>
            <Link href="/catalog">Catalog</Link>
            <Link href="/production">Production</Link>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
