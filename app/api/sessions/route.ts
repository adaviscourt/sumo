import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { sessions, cardResults } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

function getUserId(): string {
  const store = cookies();
  const existing = store.get("sumo_uid")?.value;
  return existing ?? randomUUID();
}

function setUserIdCookie(response: NextResponse, userId: string): void {
  response.cookies.set("sumo_uid", userId, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365 * 5 // 5 years
  });
}

type CardResult = {
  cardId: string;
  correct: boolean;
  respondedAt: string;
};

export async function POST(request: NextRequest) {
  const body = await request.json() as {
    deckSlug: string;
    score: number;
    asked: number;
    endedAt: string;
    cardResults?: CardResult[];
  };

  const userId = getUserId();

  const [session] = await db
    .insert(sessions)
    .values({
      userId,
      deckSlug: body.deckSlug,
      score: body.score,
      asked: body.asked,
      endedAt: new Date(body.endedAt)
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

  const response = NextResponse.json({ id: session.id }, { status: 201 });
  setUserIdCookie(response, userId);
  return response;
}

export async function GET() {
  const userId = getUserId();

  if (!cookies().get("sumo_uid")) {
    return NextResponse.json([]);
  }

  const rows = await db
    .select()
    .from(sessions)
    .where(eq(sessions.userId, userId))
    .orderBy(desc(sessions.endedAt))
    .limit(20);

  return NextResponse.json(rows);
}
