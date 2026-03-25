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

const KACHI_KOSHI_IMAGE_URLS = [
  "https://i.imgur.com/6CpGynp.jpg",
  "https://i.imgur.com/6CpGynp.jpeg",
  "https://i.imgur.com/6CpGynp.png"
];
const KACHI_KOSHI_SOURCE_URL = "https://imgur.com/a/6CpGynp";

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
  const [kachiKoshiImageIndex, setKachiKoshiImageIndex] = useState(0);
  const seenCardIdsRef = useRef<string[]>([]);

  const bonusPending = Boolean(feedback?.bonusEligible && !bonusResolved);
  const done = asked >= QUESTIONS_PER_QUIZ && !bonusPending;
  const showKachiKoshi = params.slug === "rikishi" && correctCount > 10;
  const kachiKoshiImageUrl = KACHI_KOSHI_IMAGE_URLS[kachiKoshiImageIndex];

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
    return (
      <section className="card space-y-3">
        <h1 className="text-2xl font-semibold">Session Complete</h1>
        <p>
          Score: {correctCount} points across {asked} prompts
        </p>
        {showKachiKoshi ? (
          <div className="space-y-2">
            <p className="font-medium text-pine">Kachi-Koshi! Great run.</p>
            <img
              src={kachiKoshiImageUrl}
              alt="Kachi-Koshi celebration"
              onError={() =>
                setKachiKoshiImageIndex((value) => Math.min(value + 1, KACHI_KOSHI_IMAGE_URLS.length - 1))
              }
              className="mx-auto h-auto max-h-[360px] w-full max-w-md rounded-lg border border-ink/10 object-cover"
            />
            <p className="text-xs text-ink/70">
              Source: <a className="underline" href={KACHI_KOSHI_SOURCE_URL} target="_blank" rel="noreferrer">Imgur</a>
            </p>
          </div>
        ) : null}
        <Link className="button-primary inline-block" href="/">Back to Decks</Link>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className="card">
        <div className="mb-4 flex items-center justify-between text-sm text-ink/70">
          <span>Deck: {params.slug}</span>
          <span>
            Question {asked + 1} / {QUESTIONS_PER_QUIZ}
          </span>
        </div>

        {loading || !card ? <p>Loading card...</p> : null}

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
              {card.choices.map((choice) => (
                <button
                  key={choice.id}
                  className={`quiz-choice ${
                    selected === choice.id ? "!border-pine !bg-pine/20 ring-2 ring-pine/40" : ""
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
                Next Card
              </button>
            )}
          </div>
        ) : null}
      </section>
      {reveal}
    </div>
  );
}
