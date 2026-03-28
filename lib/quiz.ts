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
  return [correctFamily, ...distractors].sort((a, b) => RANK_ORDER.indexOf(a) - RANK_ORDER.indexOf(b));
}

export function shuffle<T>(items: T[]): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

export function celebrationTier(correctCount: number, deckSlug: string): "zensho" | "kachi" | null {
  if (deckSlug === "rikishi" && correctCount === 20) return "zensho";
  if (correctCount === 10 || (deckSlug === "rikishi" && correctCount > 10)) return "kachi";
  return null;
}

// Weight formula: 1.0 - (accuracy * 0.8)
// Unseen cards default to 1.0. Mastered cards floor at 0.2 so they still appear.
export function cardWeight(correct: number, total: number): number {
  if (total === 0) return 1.0;
  return 1.0 - (correct / total) * 0.8;
}

export function selectNextCard<T extends { id: string }>(
  cards: T[],
  excludedIds: string[],
  weights?: Map<string, number>
): T | null {
  if (cards.length === 0) {
    return null;
  }

  const excluded = new Set(excludedIds);
  const available = cards.filter((card) => !excluded.has(card.id));
  const source = available.length > 0 ? available : cards;

  if (!weights || weights.size === 0) {
    return shuffle(source)[0] ?? null;
  }

  const DEFAULT_WEIGHT = 1.0;
  const totalWeight = source.reduce((sum, card) => sum + (weights.get(card.id) ?? DEFAULT_WEIGHT), 0);
  let rand = Math.random() * totalWeight;
  for (const card of source) {
    rand -= weights.get(card.id) ?? DEFAULT_WEIGHT;
    if (rand <= 0) return card;
  }
  return source[source.length - 1] ?? null;
}
