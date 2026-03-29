import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessions, cardResults } from "@/lib/schema";
import { createClient } from "@/lib/supabase/server";
import { eq, desc } from "drizzle-orm";

type CardResult = {
  cardId: string;
  correct: boolean;
  respondedAt: string;
};

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as {
    deckSlug: string;
    score: number;
    asked: number;
    endedAt: string;
    cardResults?: CardResult[];
  };

  const [session] = await db
    .insert(sessions)
    .values({
      userId: user.id,
      deckSlug: body.deckSlug,
      score: body.score,
      asked: body.asked,
      endedAt: new Date(body.endedAt),
      environment: process.env.VERCEL_ENV ?? null
    })
    .returning();

  if (body.cardResults && body.cardResults.length > 0) {
    await db.insert(cardResults).values(
      body.cardResults.map((r) => ({
        sessionId: session.id,
        cardId: r.cardId,
        correct: r.correct,
        respondedAt: new Date(r.respondedAt)
      }))
    );
  }

  return NextResponse.json({ id: session.id }, { status: 201 });
}

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json([]);
  }

  const rows = await db
    .select()
    .from(sessions)
    .where(eq(sessions.userId, user.id))
    .orderBy(desc(sessions.endedAt))
    .limit(20);

  return NextResponse.json(rows);
}
