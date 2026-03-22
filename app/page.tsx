"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type DeckSummary = {
  slug: string;
  name: string;
  description: string;
  cardCount: number;
};

type LocalSession = {
  id: string;
  deckSlug: string;
  score: number;
  asked: number;
  endedAt: string;
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
            <h2 className="text-xl font-semibold">{deck.name}</h2>
            <p className="text-sm text-ink/75">{deck.description}</p>
            <p className="text-sm text-ink/60">{deck.cardCount} cards</p>
            <Link href={`/deck/${deck.slug}`} className="button-primary mt-auto inline-block text-center">
              Play Deck
            </Link>
          </article>
        ))}
      </section>

      <section className="card">
        <h3 className="mb-3 text-lg font-semibold">Recent Sessions (Local)</h3>
        {sessions.length === 0 ? (
          <p className="text-sm text-ink/65">No sessions yet. Start a deck to begin tracking progress.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {sessions.map((session) => (
              <li key={session.id}>
                {session.deckSlug}: {session.score} points / {session.asked} prompts ({new Date(session.endedAt).toLocaleString()})
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
