export type RankName =
  | "Jonokuchi"
  | "Jonidan"
  | "Sandanme"
  | "Makushita"
  | "Juryo"
  | "Maegashira"
  | "Komusubi"
  | "Sekiwake"
  | "Ozeki"
  | "Yokozuna";

export type Rank = {
  name: RankName;
  kanji: string;
  /** Cumulative qualifying sessions needed to hold this rank */
  threshold: number;
};

/**
 * A session qualifies if score / asked >= QUALIFYING_ACCURACY.
 * 70% maps to kachi-koshi (a winning record) — the real-sumo threshold
 * for rank maintenance.
 */
export const QUALIFYING_ACCURACY = 0.7;

// Thresholds are cumulative qualifying sessions (sessions with ≥ 70% accuracy).
// At one session per day, Yokozuna takes roughly 3–4 months of consistent play.
export const RANKS: Rank[] = [
  { name: "Jonokuchi",  kanji: "序ノ口", threshold: 0 },
  { name: "Jonidan",    kanji: "序二段", threshold: 2 },
  { name: "Sandanme",   kanji: "三段目",  threshold: 5 },
  { name: "Makushita",  kanji: "幕下",   threshold: 10 },
  { name: "Juryo",      kanji: "十両",   threshold: 17 },
  { name: "Maegashira", kanji: "前頭",   threshold: 26 },
  { name: "Komusubi",   kanji: "小結",   threshold: 38 },
  { name: "Sekiwake",   kanji: "関脇",   threshold: 54 },
  { name: "Ozeki",      kanji: "大関",   threshold: 74 },
  { name: "Yokozuna",   kanji: "横綱",   threshold: 100 },
];

export type RankInfo = {
  rank: Rank;
  /** Qualifying sessions earned within the current rank */
  progress: number;
  /** Qualifying sessions still needed to reach the next rank (null at Yokozuna) */
  toNext: number | null;
};

/**
 * Calculate rank from the number of qualifying sessions (sessions where
 * accuracy >= QUALIFYING_ACCURACY).
 */
export function calculateRank(qualifyingSessions: number): RankInfo {
  let current = RANKS[0]!;
  for (const rank of RANKS) {
    if (qualifyingSessions >= rank.threshold) {
      current = rank;
    } else {
      break;
    }
  }

  const currentIndex = RANKS.indexOf(current);
  const next = RANKS[currentIndex + 1] ?? null;

  return {
    rank: current,
    progress: qualifyingSessions - current.threshold,
    toNext: next ? next.threshold - qualifyingSessions : null,
  };
}
