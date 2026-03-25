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
          <header className="mb-10 overflow-hidden rounded-2xl shadow-lg">
            <div className="h-2 bg-vermillion" />
            <div className="bg-navy px-6 py-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <Link href="/" className="group block">
                  <span className="block text-2xl font-bold tracking-tight text-white transition-colors group-hover:text-white/85">
                    Sumo Trainer
                  </span>
                  <span className="block text-xs tracking-[0.2em] text-white/45 mt-0.5">
                    相撲トレーナー
                  </span>
                </Link>
              </div>
            </div>
          </header>
          {children}
        </main>
      </body>
    </html>
  );
}
