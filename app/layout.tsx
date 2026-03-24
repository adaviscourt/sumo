import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sumo Trainer",
  description: "Quiz game decks for sumo terminology, kimarite, and makuuchi rikishi"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8 sm:px-6">
          <header className="mb-8 rounded-2xl bg-white px-6 py-5 text-ink">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Link href="/" className="text-2xl font-semibold tracking-tight">
                Sumo Trainer
              </Link>
              <nav className="flex items-center gap-2 text-sm font-medium">
                <Link href="/" className="rounded-md px-3 py-1.5 hover:bg-ink/5">
                  Decks
                </Link>
                <Link href="/data-status" className="rounded-md px-3 py-1.5 hover:bg-ink/5">
                  Data Status
                </Link>
              </nav>
            </div>
          </header>
          {children}
        </main>
      </body>
    </html>
  );
}
