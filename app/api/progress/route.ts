import { NextResponse } from "next/server";
import { eq, and, not, like } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { cardResults, sessions } from "@/lib/schema";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({});
  }

  const rows = await db
    .select({
      deckSlug: sessions.deckSlug,
      correct: cardResults.correct
    })
    .from(cardResults)
    .innerJoin(sessions, eq(cardResults.sessionId, sessions.id))
    .where(
      and(
        eq(sessions.userId, user.id),
        not(like(cardResults.cardId, "%:bonus"))
      )
    );

  const stats: Record<string, { correct: number; total: number }> = {};
  for (const row of rows) {
    const s = stats[row.deckSlug] ?? { correct: 0, total: 0 };
    s.total += 1;
    if (row.correct) s.correct += 1;
    stats[row.deckSlug] = s;
  }

  const result: Record<string, { accuracy: number; totalAnswered: number }> = {};
  for (const [slug, s] of Object.entries(stats)) {
    result[slug] = {
      accuracy: Math.round((s.correct / s.total) * 100),
      totalAnswered: s.total
    };
  }

  return NextResponse.json(result);
}
