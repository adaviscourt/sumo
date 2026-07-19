import { unstable_noStore as noStore } from "next/cache";
import React from "react";
import { getActiveHonbasho } from "../lib/honbasho";

export function ActiveBashoBanner({ referenceDate }: { referenceDate?: Date }) {
  if (!referenceDate) {
    noStore();
  }

  const activeBasho = getActiveHonbasho(referenceDate);

  if (!activeBasho) {
    return null;
  }

  return (
    <aside className="mb-6 overflow-hidden rounded-xl border border-ink/15 bg-parchment text-sm text-ink shadow-sm">
      <a
        href={activeBasho.resultsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 py-3 font-medium transition-colors hover:bg-pine/5 hover:text-pine focus:outline-none focus-visible:ring-2 focus-visible:ring-pine/40"
      >
        <span>Active Basho ({activeBasho.name})</span>
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-gold" />
        <span>Official JSA Results</span>
      </a>
    </aside>
  );
}
