import { NextResponse } from "next/server";
import { eq, and, not, like } from "drizzle-orm";
import { getDeckCards, getDeckCardsHard } from "@/lib/data";
import { inferDeckSlug, selectNextCard, cardWeight } from "@/lib/quiz";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { cardResults, sessions } from "@/lib/schema";

async function buildWeights(userId: string, deckSlug: string): Promise<Map<string, number>> {
  const rows = await db
    .select({ cardId: cardResults.cardId, correct: cardResults.correct })
    .from(cardResults)
    .innerJoin(sessions, eq(cardResults.sessionId, sessions.id))
    .where(
      and(
        eq(sessions.userId, userId),
        eq(sessions.deckSlug, deckSlug),
        not(like(cardResults.cardId, "%:bonus"))
      )
    );

  const stats = new Map<string, { correct: number; total: number }>();
  for (const row of rows) {
    const s = stats.get(row.cardId) ?? { correct: 0, total: 0 };
    s.total += 1;
    if (row.correct) s.correct += 1;
    stats.set(row.cardId, s);
  }

  const weights = new Map<string, number>();
  for (const [cardId, s] of stats) {
    weights.set(cardId, cardWeight(s.correct, s.total));
  }
  return weights;
}

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  let deckSlug: ReturnType<typeof inferDeckSlug>;
  try {
    deckSlug = inferDeckSlug(params.slug);
  } catch {
    return NextResponse.json({ error: "Unsupported deck slug" }, { status: 400 });
  }

  const url = new URL(request.url);
  const excluded = url.searchParams
    .getAll("exclude")
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);

  const mode = url.searchParams.get("mode");

  const cards = mode === "hard"
    ? await getDeckCardsHard(deckSlug)
    : await getDeckCards(deckSlug);

  if (cards.length === 0) {
    return NextResponse.json({ error: "Deck not found or empty" }, { status: 404 });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const weights = user ? await buildWeights(user.id, deckSlug) : undefined;

  const selected = selectNextCard(cards, excluded, weights);
  if (!selected) {
    return NextResponse.json({ error: "Deck not found or empty" }, { status: 404 });
  }

  return NextResponse.json({
    cardId: selected.id,
    deckSlug: selected.deckSlug,
    prompt: selected.prompt,
    choices: selected.choices.map((label) => ({ id: label, label })),
    meta: selected.meta
  });
}
