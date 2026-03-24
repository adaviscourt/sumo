import { DeckSlug } from "./types";

const RANK_ORDER = [
  "Yokozuna",
  "Ozeki",
  "Sekiwake",
  "Komusubi",
  "Maegashira"
];

export function masteryScore(correctCount: number, wrongCount: number, streak: number): number {
  const total = correctCount + wrongCount;
  if (total === 0) {
    return 0;
  }

  const accuracy = correctCount / total;
  const streakBonus = Math.min(streak * 0.03, 0.15);
  return Number((accuracy * 0.85 + streakBonus).toFixed(3));
}

export function inferDeckSlug(slug: string): DeckSlug {
  if (slug === "terms" || slug === "kimarite" || slug === "rikishi") {
    return slug;
  }

  throw new Error(`Unsupported deck slug: ${slug}`);
}

export function rankFamily(rank: string): string {
  const normalized = rank.trim().toLowerCase();

  if (normalized.includes("yokozuna")) {
    return "Yokozuna";
  }
  if (normalized.includes("ozeki") || normalized.includes("o-zeki")) {
    return "Ozeki";
  }
  if (normalized.includes("sekiwake")) {
    return "Sekiwake";
  }
  if (normalized.includes("komusubi")) {
    return "Komusubi";
  }

  return "Maegashira";
}

export function buildRankChoices(correctRank: string): string[] {
  const correctFamily = rankFamily(correctRank);
  const distractors = RANK_ORDER.filter((rank) => rank !== correctFamily);
  const options = [correctFamily, ...distractors];

  return shuffle(options);
}

export function shuffle<T>(items: T[]): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

export function selectNextCard<T extends { id: string }>(cards: T[], excludedIds: string[]): T | null {
  if (cards.length === 0) {
    return null;
  }

  const excluded = new Set(excludedIds);
  const available = cards.filter((card) => !excluded.has(card.id));
  const source = available.length > 0 ? available : cards;
  return shuffle(source)[0] ?? null;
}
