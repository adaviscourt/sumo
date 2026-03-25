"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { QUESTIONS_PER_QUIZ } from "@/lib/config";

const DECK_NAMES: Record<string, string> = {
  terms: "Sumo Terms",
  kimarite: "Kimarite",
  rikishi: "Rikishi Identification"
};

type Choice = { id: string; label: string };
type CardPayload = {
  cardId: string;
  deckSlug: string;
  prompt: string;
  choices: Choice[];
  meta: {
    japanese?: string;
    imagePath?: string;
    rank?: string;
    heya?: string;
    profileUrl?: string;
    bonusPrompt?: string;
    bonusChoices?: string[];
    bonusAnswer?: string;
  };
};

type AnswerResponse = {
  correct: boolean;
  correctAnswer: string;
  bonusEligible: boolean;
};

export default function DeckPlayPage({ params }: { params: { slug: string } }) {
  const [card, setCard] = useState<CardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<AnswerResponse | null>(null);
  const [bonusSelected, setBonusSelected] = useState<string | null>(null);
  const [bonusResolved, setBonusResolved] = useState(false);
  const [bonusCorrect, setBonusCorrect] = useState(false);
  const [asked, setAsked] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const seenCardIdsRef = useRef<string[]>([]);

  const bonusPending = Boolean(feedback?.bonusEligible && !bonusResolved);
  const done = asked >= QUESTIONS_PER_QUIZ && !bonusPending;

  const loadNextCard = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    setSelected(null);
    setFeedback(null);
    setBonusSelected(null);
    setBonusResolved(false);
    setBonusCorrect(false);

    const query = new URLSearchParams();
    seenCardIdsRef.current.forEach((id) => query.append("exclude", id));
    const response = await fetch(`/api/decks/${params.slug}/next-card?${query.toString()}`, { method: "GET" });

    if (!response.ok) {
      setLoadError(true);
      setLoading(false);
      return;
    }

    const payload = (await response.json()) as CardPayload;
    setCard(payload);
    if (!seenCardIdsRef.current.includes(payload.cardId)) {
      seenCardIdsRef.current = [...seenCardIdsRef.current, payload.cardId];
    }
    setLoading(false);
  }, [params.slug]);

  useEffect(() => {
    seenCardIdsRef.current = [];
    loadNextCard();
  }, [loadNextCard]);

  useEffect(() => {
    if (!done) {
      return;
    }

    const entry = {
      id: crypto.randomUUID(),
      deckSlug: params.slug,
      score: correctCount,
      asked,
      endedAt: new Date().toISOString()
    };

    try {
      const raw = localStorage.getItem("sumo.sessions");
      const parsed = raw ? (JSON.parse(raw) as typeof entry[]) : [];
      const next = [entry, ...parsed].slice(0, 20);
      localStorage.setItem("sumo.sessions", JSON.stringify(next));
    } catch {
      // localStorage may be unavailable in restricted contexts.
    }
  }, [asked, correctCount, done, params.slug]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (loading || loadError || !card) return;
      // Ignore when focus is inside an input/button to avoid double-firing
      if (document.activeElement?.tagName === "BUTTON") return;

      const idx = ["1", "2", "3", "4"].indexOf(e.key);

      if (!feedback) {
        // Pre-submission: 1–4 select a choice, Enter submits
        if (idx !== -1 && card.choices[idx]) {
          setSelected(card.choices[idx].id);
        } else if (e.key === "Enter" && selected) {
          void submitAnswer();
        }
      } else if (bonusPending) {
        // Bonus phase: 1–4 select a bonus choice, Enter submits bonus
        if (idx !== -1 && card.meta.bonusChoices?.[idx]) {
          setBonusSelected(card.meta.bonusChoices[idx]);
        } else if (e.key === "Enter" && bonusSelected && !bonusResolved) {
          submitBonus();
        }
      } else if (e.key === "Enter") {
        // Post-feedback: Enter advances
        void loadNextCard();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [loading, loadError, card, feedback, selected, bonusPending, bonusSelected, bonusResolved, submitAnswer, submitBonus, loadNextCard]);

  const submitAnswer = useCallback(async () => {
    if (!card || !selected) {
      return;
    }

    const response = await fetch("/api/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cardId: card.cardId,
        selectedOptionId: selected
      })
    });

    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as AnswerResponse;
    setFeedback(payload);
    setAsked((value) => value + 1);
    if (payload.correct) {
      setCorrectCount((value) => value + 1);
    }
  }, [card, selected]);

  const submitBonus = useCallback(() => {
    if (!feedback?.bonusEligible || !card?.meta.bonusAnswer || !bonusSelected || bonusResolved) {
      return;
    }

    const isCorrect = bonusSelected === card.meta.bonusAnswer;
    setBonusResolved(true);
    setBonusCorrect(isCorrect);
    if (isCorrect) {
      setCorrectCount((value) => value + 1);
    }
  }, [bonusResolved, bonusSelected, card?.meta.bonusAnswer, feedback?.bonusEligible]);

  const reveal = useMemo(() => {
    if (!card || !feedback) {
      return null;
    }

    return (
      <div className="space-y-2 rounded-lg border border-ink/15 bg-ink/5 p-4 text-sm">
        <p className={feedback.correct ? "text-pine" : "text-clay"}>{feedback.correct ? "Correct" : "Not quite"}</p>
        <p>
          Correct answer: <strong>{feedback.correctAnswer}</strong>
        </p>
        {card.meta.japanese ? <p>Japanese: {card.meta.japanese}</p> : null}
        {card.meta.rank && !(feedback.bonusEligible && !bonusResolved) ? <p>Current rank: {card.meta.rank}</p> : null}
        {card.meta.heya ? <p>Heya: {card.meta.heya}</p> : null}
        {card.meta.profileUrl ? (
          <p>
            Profile: <a className="underline" href={card.meta.profileUrl} target="_blank" rel="noreferrer">Official profile</a>
          </p>
        ) : null}
        {feedback.bonusEligible && card.meta.bonusPrompt && card.meta.bonusChoices ? (
          <div className="space-y-2 border-t border-ink/10 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gold">Bonus question</p>
            <p className="font-medium">{card.meta.bonusPrompt}</p>
            <div className="grid gap-2">
              {card.meta.bonusChoices.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  disabled={bonusResolved}
                  onClick={() => setBonusSelected(choice)}
                  className={`quiz-choice ${
                    bonusSelected === choice ? "!border-gold !bg-gold/20 ring-2 ring-gold/40" : ""
                  }`}
                >
                  {choice}
                </button>
              ))}
            </div>
            {!bonusResolved ? (
              <button type="button" className="button-primary" disabled={!bonusSelected} onClick={submitBonus}>
                Submit Bonus
              </button>
            ) : (
              <p className={bonusCorrect ? "text-pine" : "text-clay"}>
                {bonusCorrect
                  ? "Bonus correct (+1 point)."
                  : `Bonus incorrect. Correct rank family: ${card.meta.bonusAnswer}`}
              </p>
            )}
          </div>
        ) : null}
      </div>
    );
  }, [bonusCorrect, bonusResolved, bonusSelected, card, feedback, submitBonus]);

  if (done) {
    const pct = asked > 0 ? Math.round((correctCount / asked) * 100) : 0;
    const message =
      pct === 100 ? "Perfect run!" :
      pct >= 80  ? "Strong session." :
      pct >= 50  ? "Solid effort." :
      "Keep at it.";
    const scoreColor =
      pct === 100 ? "text-gold" :
      pct >= 50   ? "text-pine" :
      "text-clay";

    return (
      <section className="card space-y-4">
        <h1 className="text-2xl font-semibold">Session Complete</h1>
        <div className="space-y-1">
          <p className={`text-3xl font-semibold ${scoreColor}`}>{pct}%</p>
          <p className="text-ink/70">{correctCount} / {asked} correct — {message}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link className="button-primary inline-block" href={`/deck/${params.slug}`}>Play Again</Link>
          <Link className="button-secondary inline-block" href="/">Back to Decks</Link>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className="card">
        <div className="mb-4 flex items-center justify-between text-sm text-ink/70">
          <Link href="/" className="hover:text-ink transition-colors">← Back to Decks</Link>
          <span>{DECK_NAMES[params.slug] ?? params.slug} · Question {asked + 1} / {QUESTIONS_PER_QUIZ}</span>
        </div>

        {loading && !loadError ? (
          <div className="min-h-[200px] space-y-3 animate-pulse">
            <div className="h-4 w-3/4 rounded bg-ink/10" />
            <div className="h-4 w-1/2 rounded bg-ink/10" />
            <div className="mt-4 grid gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-11 rounded-lg bg-ink/10" />
              ))}
            </div>
          </div>
        ) : null}

        {loadError ? (
          <div className="space-y-3 py-2 text-sm">
            <p className="text-clay">Couldn&apos;t load card. Check your connection and try again.</p>
            <button type="button" className="button-secondary" onClick={loadNextCard}>Try again</button>
          </div>
        ) : null}

        {!loading && !loadError && card ? (
          <div className="space-y-4">
            {card.meta.imagePath ? (
              <img
                src={card.meta.imagePath}
                alt="Rikishi prompt"
                className="mx-auto h-[360px] w-auto rounded-lg border border-ink/10 object-cover sm:h-[440px]"
              />
            ) : null}
            <h2 className="text-xl font-medium">{card.prompt}</h2>

            <div className="grid gap-2">
              {card.choices.map((choice) => (
                <button
                  key={choice.id}
                  className={`quiz-choice ${
                    selected === choice.id ? "!border-navy !bg-navy/10 ring-2 ring-navy/30" : ""
                  }`}
                  onClick={() => setSelected(choice.id)}
                  type="button"
                  disabled={Boolean(feedback)}
                >
                  {choice.label}
                </button>
              ))}
            </div>

            {!feedback ? (
              <div className="flex items-center gap-4">
                <button type="button" className="button-primary" disabled={!selected} onClick={submitAnswer}>
                  Submit
                </button>
                <span className="text-xs text-ink/40">1–4 to pick · Enter to submit</span>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  className="button-secondary"
                  onClick={loadNextCard}
                  disabled={Boolean(feedback.bonusEligible && !bonusResolved)}
                >
                  Next Card
                </button>
                {!bonusPending && <span className="text-xs text-ink/40">Enter to continue</span>}
              </div>
            )}
          </div>
        ) : null}
      </section>
      {reveal}
    </div>
  );
}
