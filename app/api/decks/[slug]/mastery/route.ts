import { NextResponse } from "next/server";
import { eq, and, not, like } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { cardResults, sessions } from "@/lib/schema";
import { getDeckCards } from "@/lib/data";
import type { DeckSlug } from "@/lib/types";

const MASTERY_ACCURACY = 0.8;
const MASTERY_MIN_ATTEMPTS = 3;

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const slug = params.slug as DeckSlug;

  // Total card count for this deck
  let totalCards = 0;
  try {
    const cards = await getDeckCards(slug);
    totalCards = cards.length;
  } catch {
    return NextResponse.json({ error: "Unknown deck" }, { status: 404 });
  }

  if (!user) {
    return NextResponse.json({
      summary: { mastered: 0, learning: 0, new: totalCards, total: totalCards }
    });
  }

  const rows = await db
    .select({ cardId: cardResults.cardId, correct: cardResults.correct })
    .from(cardResults)
    .innerJoin(sessions, eq(cardResults.sessionId, sessions.id))
    .where(
      and(
        eq(sessions.userId, user.id),
        eq(sessions.deckSlug, slug),
        not(like(cardResults.cardId, "%:bonus"))
      )
    );

  const cardStats: Record<string, { correct: number; total: number }> = {};
  for (const row of rows) {
    const s = cardStats[row.cardId] ?? { correct: 0, total: 0 };
    s.total += 1;
    if (row.correct) s.correct += 1;
    cardStats[row.cardId] = s;
  }

  let mastered = 0;
  let learning = 0;
  for (const s of Object.values(cardStats)) {
    if (s.total >= MASTERY_MIN_ATTEMPTS && s.correct / s.total >= MASTERY_ACCURACY) {
      mastered++;
    } else {
      learning++;
    }
  }
  const newCards = totalCards - Object.keys(cardStats).length;

  return NextResponse.json({
    summary: { mastered, learning, new: newCards, total: totalCards }
  });
}
