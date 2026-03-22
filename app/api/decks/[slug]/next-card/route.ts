import { NextResponse } from "next/server";
import { getDeckCards } from "@/lib/data";
import { inferDeckSlug, shuffle } from "@/lib/quiz";

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  let deckSlug: ReturnType<typeof inferDeckSlug>;
  try {
    deckSlug = inferDeckSlug(params.slug);
  } catch {
    return NextResponse.json({ error: "Unsupported deck slug" }, { status: 400 });
  }

  const cards = await getDeckCards(deckSlug);
  if (cards.length === 0) {
    return NextResponse.json({ error: "Deck not found or empty" }, { status: 404 });
  }

  const selected = shuffle(cards)[0];

  return NextResponse.json({
    cardId: selected.id,
    deckSlug: selected.deckSlug,
    prompt: selected.prompt,
    choices: selected.choices.map((label) => ({ id: label, label })),
    meta: selected.meta
  });
}
