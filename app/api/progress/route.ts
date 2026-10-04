import { NextResponse } from "next/server";
import { eq, and, not, like, sql, desc } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { cardResults, sessions } from "@/lib/schema";
import { QUALIFYING_ACCURACY } from "@/lib/rank";

function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (dates[0] !== today && dates[0] !== yesterday) return 0;
  let streak = 0;
  let expected = dates[0];
  for (const date of dates) {
    if (date === expected) {
      streak++;
      const d = new Date(expected + "T12:00:00Z");
      d.setUTCDate(d.getUTCDate() - 1);
      expected = d.toISOString().slice(0, 10);
    } else {
      break;
    }
  }
  return streak;
}

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

  const [qualifyingRows, sessionDateRows] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(sessions)
      .where(
        and(
          eq(sessions.userId, user.id),
          sql`${sessions.score}::float / ${sessions.asked} >= ${QUALIFYING_ACCURACY}`
        )
      ),
    db
      .select({ date: sql<string>`DATE(${sessions.endedAt})::text` })
      .from(sessions)
      .where(eq(sessions.userId, user.id))
      .groupBy(sql`DATE(${sessions.endedAt})`)
      .orderBy(desc(sql`DATE(${sessions.endedAt})`))
  ]);

  const qualifyingSessions = qualifyingRows[0]?.count ?? 0;
  const streak = computeStreak(sessionDateRows.map(r => r.date));

  return NextResponse.json({
    ...result,
    _overall: { qualifyingSessions, streak }
  });
}
