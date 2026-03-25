"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { QUESTIONS_PER_QUIZ } from "@/lib/config";

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

const DECK_LABELS: Record<string, string> = {
  terms: "Sumo Terms",
  kimarite: "Kimarite",
  rikishi: "Makuuchi Rikishi"
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
  const seenCardIdsRef = useRef<string[]>([]);

  const bonusPending = Boolean(feedback?.bonusEligible && !bonusResolved);
  const done = asked >= QUESTIONS_PER_QUIZ && !bonusPending;

  const loadNextCard = useCallback(async () => {
    setLoading(true);
    setSelected(null);
    setFeedback(null);
    setBonusSelected(null);
    setBonusResolved(false);
    setBonusCorrect(false);

    const query = new URLSearchParams();
    seenCardIdsRef.current.forEach((id) => query.append("exclude", id));
    const response = await fetch(`/api/decks/${params.slug}/next-card?${query.toString()}`, { method: "GET" });

    if (!response.ok) {
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
      <div className={`space-y-3 rounded-xl border-2 p-5 text-sm ${feedback.correct ? "border-pine/25 bg-pine/5" : "border-clay/25 bg-clay/5"}`}>
        <p className={`text-base font-bold ${feedback.correct ? "text-pine" : "text-clay"}`}>
          {feedback.correct ? "✓ Correct!" : "✗ Not quite"}
        </p>
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
    return (
      <section className="card space-y-6 py-8 text-center">
        <p className="text-5xl" aria-hidden="true">
          {pct >= 80 ? "🏆" : pct >= 50 ? "⛩️" : "🥋"}
        </p>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Session Complete</h1>
          <p className="mt-1 text-sm text-ink/55">
            {pct >= 80 ? "Outstanding performance!" : pct >= 50 ? "Good effort — keep training!" : "Practice makes perfect!"}
          </p>
        </div>
        <div className="inline-flex items-baseline gap-2 rounded-xl bg-ink/5 px-8 py-4">
          <span className="text-5xl font-bold text-vermillion">{correctCount}</span>
          <span className="text-2xl text-ink/30">/</span>
          <span className="text-2xl font-medium text-ink/50">{asked}</span>
          <span className="ml-1 text-sm text-ink/40">points</span>
        </div>
        <Link className="button-primary inline-block" href="/">← Back to Decks</Link>
      </section>
    );
  }

  const progress = (asked / QUESTIONS_PER_QUIZ) * 100;

  return (
    <div className="space-y-4">
      <section className="card">
        <div className="mb-5">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-ink/60">{DECK_LABELS[params.slug] ?? params.slug}</span>
            <span className="font-medium text-ink/60">{asked} / {QUESTIONS_PER_QUIZ}</span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {loading || !card ? <p className="text-ink/50">Loading card…</p> : null}

        {!loading && card ? (
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
              {card.choices.map((choice) => {
                let extra = "";
                if (!feedback) {
                  extra = selected === choice.id ? "!border-navy !bg-navy/10 ring-2 ring-navy/25" : "";
                } else if (choice.label === feedback.correctAnswer) {
                  extra = "!border-pine !bg-pine/10";
                } else if (choice.id === selected && !feedback.correct) {
                  extra = "!border-clay !bg-clay/10";
                } else {
                  extra = "opacity-40";
                }
                return (
                  <button
                    key={choice.id}
                    className={`quiz-choice ${extra}`}
                    onClick={() => setSelected(choice.id)}
                    type="button"
                    disabled={Boolean(feedback)}
                  >
                    {choice.label}
                  </button>
                );
              })}
            </div>

            {!feedback ? (
              <button type="button" className="button-primary" disabled={!selected} onClick={submitAnswer}>
                Submit
              </button>
            ) : (
              <button
                type="button"
                className="button-secondary"
                onClick={loadNextCard}
                disabled={Boolean(feedback.bonusEligible && !bonusResolved)}
              >
                Next Card →
              </button>
            )}
          </div>
        ) : null}
      </section>
      {reveal}
    </div>
  );
}
