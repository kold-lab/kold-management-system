import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { AppHeader } from "@/components/AppHeader";
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
          <AppHeader />
          <main className="mx-auto max-w-5xl px-3 py-4 sm:px-5">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
