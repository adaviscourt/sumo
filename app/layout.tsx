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
        <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
          <header className="mb-12 border-b border-ink/15 pb-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Link href="/" className="flex flex-col gap-1">
                <span className="text-[11px] tracking-widest text-ink/35" aria-hidden="true">相撲</span>
                <span className="text-3xl font-bold tracking-[0.12em] uppercase">Sumo Trainer</span>
              </Link>
            </div>
          </header>
          {children}
        </main>
      </body>
    </html>
  );
}
