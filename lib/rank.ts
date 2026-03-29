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
  /** Minimum score (correct answers) needed to hold this rank */
  threshold: number;
};

// Score = total correct answers across all decks.
// Each rank requires more correct answers than the last.
export const RANKS: Rank[] = [
  { name: "Jonokuchi", kanji: "序ノ口", threshold: 0 },
  { name: "Jonidan",   kanji: "序二段", threshold: 8 },
  { name: "Sandanme",  kanji: "三段目",  threshold: 20 },
  { name: "Makushita", kanji: "幕下",   threshold: 40 },
  { name: "Juryo",     kanji: "十両",   threshold: 75 },
  { name: "Maegashira",kanji: "前頭",   threshold: 130 },
  { name: "Komusubi",  kanji: "小結",   threshold: 200 },
  { name: "Sekiwake",  kanji: "関脇",   threshold: 300 },
  { name: "Ozeki",     kanji: "大関",   threshold: 450 },
  { name: "Yokozuna",  kanji: "横綱",   threshold: 650 },
];

export type RankInfo = {
  rank: Rank;
  /** Score within the current rank (score - rank.threshold) */
  progress: number;
  /** Points needed to reach the next rank (null at Yokozuna) */
  toNext: number | null;
};

/**
 * Calculate rank from total correct answers across all decks.
 * correctAnswered = totalAnswered * (accuracy / 100)
 */
export function calculateRank(correctAnswered: number): RankInfo {
  let current = RANKS[0]!;
  for (const rank of RANKS) {
    if (correctAnswered >= rank.threshold) {
      current = rank;
    } else {
      break;
    }
  }

  const currentIndex = RANKS.indexOf(current);
  const next = RANKS[currentIndex + 1] ?? null;

  return {
    rank: current,
    progress: correctAnswered - current.threshold,
    toNext: next ? next.threshold - correctAnswered : null,
  };
}
