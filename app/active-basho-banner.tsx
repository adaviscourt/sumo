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
    <aside className="mb-6 border-b border-clay/20 bg-clay/10 px-4 py-3 text-sm text-ink sm:-mx-6 sm:px-6">
      <a
        href={activeBasho.resultsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-medium transition-colors hover:text-clay"
      >
        <span>{activeBasho.name} live</span>
        <span aria-hidden="true">|</span>
        <span>Official JSA results</span>
      </a>
    </aside>
  );
}
