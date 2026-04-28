import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { DeckSlug } from "./types";
import { buildRankChoices, rankFamily, shuffle } from "./quiz";

type TermSeed = {
  term: string;
  definition: string;
  japanese?: string;
  sourceUrl?: string;
};

type RikishiRow = {
  sumoAssociationId: string;
  shikonaEn: string;
  shikonaJp?: string;
  heya?: string;
  birthDate?: string;
  heightCm?: number;
  weightKg?: number;
  currentRank: string;
  imagePath?: string;
  profileUrl: string;
  snapshotDate: string;
};

type RikishiCurrent = {
  fetchedAt: string;
  source: string;
  rikishi: RikishiRow[];
};

export type QuizCard = {
  id: string;
  deckSlug: DeckSlug;
  prompt: string;
  answer: string;
  choices: string[];
  meta: Record<string, string | string[] | undefined>;
};

const ROOT = process.cwd();

const BASHO_BY_MONTH: Record<number, string> = {
  1: "Hatsu Basho",
  3: "Haru Basho",
  5: "Natsu Basho",
  7: "Nagoya Basho",
  9: "Aki Basho",
  11: "Kyushu Basho"
};

function bashoName(fetchedAt: string): string {
  const date = new Date(fetchedAt);
  const month = date.getMonth() + 1;
  // Banzuke is published ~2 weeks before the next basho, so when fetched in an
  // off-month (or December for Hatsu), roll forward to the upcoming basho.
  const bashoMonth = BASHO_BY_MONTH[month] ? month : ((month % 12) + 1);
  return BASHO_BY_MONTH[bashoMonth] ?? "Current Basho";
}

function normalizeId(prefix: string, value: string): string {
  return `${prefix}:${value.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function termSlug(term: string): string {
  return term.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function audioPath(deckSlug: string, term: string): string {
  return `/audio/${deckSlug}/${termSlug(term)}.mp3`;
}

async function readJson<T>(path: string): Promise<T> {
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw) as T;
}

export async function getDeckSummary() {
  const [terms, kimarite, rikishi] = await Promise.all([getTermSeed("terms"), getTermSeed("kimarite"), getRikishiCurrent()]);
  return [
    {
      slug: "terms",
      name: "Terminology",
      description: "Glossary terms used in pro sumo",
      cardCount: terms.length
    },
    {
      slug: "kimarite",
      name: "Kimarite",
      description: "Winning techniques and their meanings",
      cardCount: kimarite.length
    },
    {
      slug: "rikishi",
      name: "Makuuchi Rikishi",
      description: "Identify current top-division rikishi by photo and rank",
      cardCount: rikishi.rikishi.length,
      banzuke: bashoName(rikishi.fetchedAt),
      fetchedAt: rikishi.fetchedAt
    }
  ] as const;
}

async function getTermSeed(kind: "terms" | "kimarite"): Promise<TermSeed[]> {
  return readJson<TermSeed[]>(join(ROOT, "data", "seed", `${kind}.json`));
}

export async function getRikishiCurrent(): Promise<RikishiCurrent> {
  const currentPath = join(ROOT, "data", "rikishi", "makuuchi-current.json");
  try {
    return await readJson<RikishiCurrent>(currentPath);
  } catch {
    const fallback = await readLatestMakuuchiSnapshot();
    return {
      fetchedAt: fallback.fetchedAt,
      source: fallback.source,
      rikishi: fallback.rikishi
    };
  }
}

type Snapshot = {
  fetchedAt: string;
  source: string;
  rikishi: RikishiRow[];
};

async function readLatestMakuuchiSnapshot(): Promise<Snapshot> {
  const rawDir = join(ROOT, "data", "rikishi", "raw");
  const files = await readdir(rawDir);
  const timestamped = files.filter((file) => /^makuuchi-\d{8}-\d{6}\.json$/.test(file)).sort();
  if (timestamped.length === 0) {
    return readJson<Snapshot>(join(rawDir, "makuuchi-sample.json"));
  }
  const latest = timestamped[timestamped.length - 1];
  return readJson<Snapshot>(join(rawDir, latest));
}

function buildDistractors(definitions: string[], correct: string): string[] {
  return shuffle(definitions.filter((item) => item !== correct)).slice(0, 3);
}

export async function getDeckCards(deckSlug: DeckSlug): Promise<QuizCard[]> {
  if (deckSlug === "terms" || deckSlug === "kimarite") {
    const seed = await getTermSeed(deckSlug);
    const definitions = seed.map((item) => item.definition);
    return seed.map((item) => {
      const choices = shuffle([item.definition, ...buildDistractors(definitions, item.definition)]);
      return {
        id: normalizeId(deckSlug, item.term),
        deckSlug,
        prompt: item.term,
        answer: item.definition,
        choices,
        meta: {
          japanese: item.japanese,
          audioPath: audioPath(deckSlug, item.term),
          sourceUrl: item.sourceUrl
        }
      };
    });
  }

  const rikishi = await getRikishiCurrent();
  const names = rikishi.rikishi.map((row) => row.shikonaEn);

  return rikishi.rikishi.map((row) => {
    const distractors = shuffle(names.filter((name) => name !== row.shikonaEn)).slice(0, 3);
    const choices = shuffle([row.shikonaEn, ...distractors]);

    return {
      id: `rikishi:${row.sumoAssociationId}`,
      deckSlug: "rikishi",
      prompt: "Who is this rikishi?",
      answer: row.shikonaEn,
      choices,
      meta: {
        imagePath: row.imagePath,
        rank: row.currentRank,
        rankFamily: rankFamily(row.currentRank),
        heya: row.heya,
        profileUrl: row.profileUrl,
        bonusPrompt: "What is this rikishi's current rank family?",
        bonusChoices: buildRankChoices(row.currentRank),
        bonusAnswer: rankFamily(row.currentRank)
      }
    };
  });
}

export async function getDeckCardsHard(deckSlug: "terms" | "kimarite" | "rikishi"): Promise<QuizCard[]> {
  if (deckSlug === "rikishi") {
    const rikishi = await getRikishiCurrent();
    const names = rikishi.rikishi.map((row) => row.shikonaEn);
    return rikishi.rikishi.map((row) => ({
      id: `rikishi:${row.sumoAssociationId}`,
      deckSlug: "rikishi",
      prompt: "Who is this rikishi?",
      answer: row.shikonaEn,
      choices: shuffle([...names]),
      meta: {
        imagePath: row.imagePath,
        rank: row.currentRank,
        rankFamily: rankFamily(row.currentRank),
        heya: row.heya,
        profileUrl: row.profileUrl,
        bonusPrompt: "What is this rikishi's current rank family?",
        bonusChoices: buildRankChoices(row.currentRank),
        bonusAnswer: rankFamily(row.currentRank)
      }
    }));
  }

  const seed = await getTermSeed(deckSlug);
  const terms = seed.map((item) => item.term);
  return seed.map((item) => ({
    id: normalizeId(`${deckSlug}-hard`, item.term),
    deckSlug,
    prompt: item.definition,
    answer: item.term,
    choices: shuffle([...terms]),
    meta: {
      japanese: item.japanese,
      audioPath: audioPath(deckSlug, item.term),
      sourceUrl: item.sourceUrl
    }
  }));
}

export async function findCardById(cardId: string): Promise<QuizCard | null> {
  if (cardId.startsWith("terms-hard:") || cardId.startsWith("kimarite-hard:")) {
    const prefix = cardId.startsWith("terms-hard:") ? "terms" : "kimarite";
    const cards = await getDeckCardsHard(prefix);
    const card = cards.find((entry) => entry.id === cardId);
    if (card) return card;
  }

  const decks: DeckSlug[] = ["terms", "kimarite", "rikishi"];
  for (const deck of decks) {
    const cards = await getDeckCards(deck);
    const card = cards.find((entry) => entry.id === cardId);
    if (card) {
      return card;
    }
  }
  return null;
}
