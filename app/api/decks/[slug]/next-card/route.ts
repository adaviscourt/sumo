import { NextResponse } from "next/server";
import { getDeckCards, getDeckCardsHard } from "@/lib/data";
import { inferDeckSlug, selectNextCard } from "@/lib/quiz";

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

  let cards;
  if (mode === "hard" && (deckSlug === "terms" || deckSlug === "kimarite")) {
    cards = await getDeckCardsHard(deckSlug);
  } else {
    cards = await getDeckCards(deckSlug);
  }

  if (cards.length === 0) {
    return NextResponse.json({ error: "Deck not found or empty" }, { status: 404 });
  }

  const selected = selectNextCard(cards, excluded);
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
