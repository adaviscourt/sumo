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

/* Accent color for each deck's top border — navy / clay / pine */
const DECK_TOP_COLOR: Record<string, string> = {
  terms: "#27386e",
  kimarite: "#b55233",
  rikishi: "#1f5c4d"
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
    <div className="space-y-8">
      <section className="py-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-ink">Choose Your Training</h1>
        <p className="mt-2 text-sm text-ink/55">Master sumo vocabulary, kimarite, and makuuchi rikishi</p>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {decks.map((deck) => (
          <article
            key={deck.slug}
            className="card-deck flex flex-col gap-4"
            style={{ borderTopColor: DECK_TOP_COLOR[deck.slug] ?? "#d4a017" }}
          >
            <p className="text-5xl leading-none" aria-hidden="true">{DECK_EMOJI[deck.slug] ?? "🃏"}</p>
            <div>
              <h2 className="text-xl font-bold tracking-tight">{deck.name}</h2>
              <p className="mt-1 text-sm leading-relaxed text-ink/65">{deck.description}</p>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-ink/45">
              <span>{QUESTIONS_PER_QUIZ} questions per round</span>
              <span aria-hidden="true">·</span>
              <span>{deck.cardCount} cards</span>
            </div>
            {deck.banzuke && <p className="text-xs text-ink/45">Banzuke: {deck.banzuke}</p>}
            <Link href={`/deck/${deck.slug}`} className="button-primary mt-auto inline-block text-center">
              Start Training →
            </Link>
          </article>
        ))}
      </section>

      <section className="card">
        <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-ink/40">Recent Sessions</h3>
        {sessions.length === 0 ? (
          <p className="text-sm text-ink/55">No sessions yet — start a deck to begin tracking your progress.</p>
        ) : (
          <ul className="space-y-2">
            {sessions.map((session) => (
              <li key={session.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-ink/5 px-4 py-2.5 text-sm">
                <span className="font-semibold capitalize">{session.deckSlug}</span>
                <span className="text-ink/60">{session.score} pts / {session.asked} prompts</span>
                <span className="text-xs text-ink/40">{new Date(session.endedAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
