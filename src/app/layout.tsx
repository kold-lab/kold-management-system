import type { Metadata } from "next";
import Link from "next/link";
import { Nunito } from "next/font/google";
import { ClerkProvider, SignedIn, UserButton } from "@clerk/nextjs";
import { NavMenu } from "@/components/NavMenu";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "kold ms",
  description: "Internal operations for kold ready-to-drink cold brew tea.",
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
          <main className="mx-auto max-w-5xl px-3 py-4 sm:px-5">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
