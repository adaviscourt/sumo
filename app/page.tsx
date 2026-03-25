"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { QUESTIONS_PER_QUIZ } from "@/lib/config";

type DeckSummary = {
  slug: string;
  name: string;
  description: string;
  cardCount: number;
  banzuke?: string;
};

type LocalSession = {
  id: string;
  deckSlug: string;
  score: number;
  asked: number;
  endedAt: string;
};

const DECK_EMOJI: Record<string, string> = {
  terms: "📘",
  kimarite: "💪",
  rikishi: "🥋"
};

const DECK_NAMES: Record<string, string> = {
  terms: "Sumo Terms",
  kimarite: "Kimarite",
  rikishi: "Rikishi Identification"
};

export default function HomePage() {
  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [sessions, setSessions] = useState<LocalSession[]>([]);

  useEffect(() => {
    void fetch("/api/decks")
      .then((res) => res.json())
      .then((data: DeckSummary[]) => setDecks(data))
      .catch(() => setDecks([]));

    try {
      const raw = localStorage.getItem("sumo.sessions");
      const parsed = raw ? (JSON.parse(raw) as LocalSession[]) : [];
      setSessions(parsed.slice(0, 5));
    } catch {
      setSessions([]);
    }
  }, []);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        {decks.map((deck) => (
          <article key={deck.slug} className="card flex flex-col gap-3">
            <p className="text-4xl leading-none" aria-hidden="true">{DECK_EMOJI[deck.slug] ?? "🃏"}</p>
            <h2 className="text-xl font-semibold">{deck.name}</h2>
            <p className="text-sm text-ink/75">{deck.description}</p>
            <p className="text-sm text-ink/60">Questions: {QUESTIONS_PER_QUIZ}</p>
            <p className="text-sm text-ink/60">Total Cards in Deck: {deck.cardCount}</p>
            {deck.banzuke && <p className="text-sm text-ink/60">Banzuke: {deck.banzuke}</p>}
            <Link href={`/deck/${deck.slug}`} className="button-primary mt-auto inline-block text-center">
              Play Deck
            </Link>
          </article>
        ))}
      </section>

      <section className="card">
        <h3 className="mb-3 text-lg font-semibold">Recent Sessions</h3>
        {sessions.length === 0 ? (
          <p className="text-sm text-ink/65">No sessions yet. Start a deck to begin tracking progress.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {sessions.map((session) => (
              <li key={session.id}>
                {DECK_NAMES[session.deckSlug] ?? session.deckSlug}: {session.score} / {session.asked} questions ({new Date(session.endedAt).toLocaleString()})
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
