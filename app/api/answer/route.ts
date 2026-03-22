import { NextRequest, NextResponse } from "next/server";
import { findCardById } from "@/lib/data";

type AnswerBody = {
  cardId: string;
  selectedOptionId: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as AnswerBody;

  if (!body.cardId || !body.selectedOptionId) {
    return NextResponse.json({ error: "Missing card or option" }, { status: 400 });
  }

  const card = await findCardById(body.cardId);
  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const correct = body.selectedOptionId === card.answer;

  return NextResponse.json({
    correct,
    correctAnswer: card.answer,
    bonusEligible: card.deckSlug === "rikishi" && correct
  });
}
