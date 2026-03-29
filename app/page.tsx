"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { QUESTIONS_PER_QUIZ } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";
import { calculateRank } from "@/lib/rank";

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

type DeckProgress = {
  accuracy: number;
  totalAnswered: number;
};

type OverallProgress = {
  totalAnswered: number;
  correctAnswered: number;
};

type ProgressResponse = Record<string, DeckProgress> & { _overall?: OverallProgress };

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

const DECK_KANJI: Record<string, string> = {
  terms: "用語",
  kimarite: "決まり手",
  rikishi: "力士"
};

export default function HomePage() {
  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [sessions, setSessions] = useState<LocalSession[]>([]);
  const [progress, setProgress] = useState<Record<string, DeckProgress>>({});
  const [overall, setOverall] = useState<OverallProgress | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(true);

  useEffect(() => {
    void fetch("/api/decks")
      .then((res) => res.json())
      .then((data: DeckSummary[]) => setDecks(data))
      .catch(() => setDecks([]));

    void fetch("/api/sessions")
      .then((res) => res.json())
      .then((data: LocalSession[]) => setSessions(data.slice(0, 5)))
      .catch(() => setSessions([]));

    void fetch("/api/progress")
      .then((res) => res.json())
      .then((data: ProgressResponse) => {
        const { _overall, ...deckProgress } = data;
        setProgress(deckProgress as Record<string, DeckProgress>);
        if (_overall) setOverall(_overall);
      })
      .catch(() => setProgress({}));

    const supabase = createClient();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAnonymous(!user || user.is_anonymous === true);
    });
  }, []);

  return (
    <div className="space-y-12">
      <section className="grid gap-6 md:grid-cols-3">
        {decks.map((deck) => {
          const deckProgress = progress[deck.slug];
          return (
            <article key={deck.slug} className="card flex flex-col gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-ink/[0.05] text-2xl" aria-hidden="true">
                {DECK_EMOJI[deck.slug] ?? "🃏"}
              </div>
              <div>
                {DECK_KANJI[deck.slug] && (
                  <p className="mb-1 text-xs tracking-widest text-ink/30" aria-hidden="true">{DECK_KANJI[deck.slug]}</p>
                )}
                <h2 className="text-xl font-semibold">{deck.name}</h2>
                <p className="mt-1 text-sm text-ink/70">{deck.description}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs text-ink/45">
                  {QUESTIONS_PER_QUIZ} questions · {deck.cardCount} cards{deck.banzuke ? ` · ${deck.banzuke}` : ""}
                </p>
                {deckProgress && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-ink/50">
                      <span>{deckProgress.accuracy}% accuracy</span>
                      <span className="tabular-nums">{deckProgress.totalAnswered} answered</span>
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-ink/10">
                      <div
                        className="h-full rounded-full bg-navy/50 transition-all"
                        style={{ width: `${deckProgress.accuracy}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <Link href={`/deck/${deck.slug}`} className="button-primary mt-auto inline-block text-center">
                Play Deck
              </Link>
            </article>
          );
        })}
      </section>

      <section className="card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="mb-1 text-xs tracking-widest text-ink/30" aria-hidden="true">稽古</p>
            <h3 className="text-lg font-semibold">Recent Sessions</h3>
          </div>
          {overall && !isAnonymous ? (
            <Link href="/account" className="flex flex-col items-end gap-0.5 text-ink/50 transition-colors hover:text-ink/80">
              <span className="text-[10px] tracking-widest text-ink/30" aria-hidden="true">{calculateRank(overall.correctAnswered).rank.kanji}</span>
              <span className="text-xs font-medium">{calculateRank(overall.correctAnswered).rank.name}</span>
            </Link>
          ) : isAnonymous ? (
            <Link href="/account" className="button-secondary text-xs">
              Sign in to sync
            </Link>
          ) : null}
        </div>
        {sessions.length === 0 ? (
          <p className="text-sm text-ink/65">No sessions yet. Start a deck to begin tracking progress.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-xs tracking-wider text-ink/40">
                <th className="pb-2 text-left font-medium">Deck</th>
                <th className="pb-2 text-left font-medium">Score</th>
                <th className="pb-2 text-left font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id} className="border-b border-ink/[0.06] last:border-0">
                  <td className="py-3 pr-6">{DECK_NAMES[session.deckSlug] ?? session.deckSlug}</td>
                  <td className="py-3 pr-6 tabular-nums text-ink/75">{session.score} / {session.asked}</td>
                  <td className="py-3 tabular-nums text-ink/55">
                    {new Date(session.endedAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
