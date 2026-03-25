"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { QUESTIONS_PER_QUIZ } from "@/lib/config";

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

const HARD_MODE_DECKS = new Set(["terms", "kimarite", "rikishi"]);

const EASY_MODE_DESC: Record<string, string> = {
  rikishi: "See the image — pick the rikishi's name from four choices"
};

const HARD_MODE_DESC: Record<string, string> = {
  rikishi: "See the image — type the rikishi's name"
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
  const searchParams = useSearchParams();
  const devMode = searchParams.has("dev");

  const supportsHardMode = HARD_MODE_DECKS.has(params.slug);
  const [mode, setMode] = useState<"easy" | "hard" | null>(devMode ? "easy" : supportsHardMode ? null : "easy");

  const [card, setCard] = useState<CardPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<AnswerResponse | null>(null);
  const [bonusSelected, setBonusSelected] = useState<string | null>(null);
  const [bonusResolved, setBonusResolved] = useState(false);
  const [bonusCorrect, setBonusCorrect] = useState(false);
  const [asked, setAsked] = useState(devMode ? QUESTIONS_PER_QUIZ : 0);
  const [correctCount, setCorrectCount] = useState(devMode ? 11 : 0);
  const [loadError, setLoadError] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const seenCardIdsRef = useRef<string[]>([]);

  const [showResults, setShowResults] = useState(devMode);

  const bonusPending = Boolean(feedback?.bonusEligible && !bonusResolved);
  const done = showResults;
  const isLastQuestion = asked >= QUESTIONS_PER_QUIZ && !bonusPending;

  const loadNextCard = useCallback(async () => {
    if (!mode) return;
    setLoading(true);
    setLoadError(false);
    setSelected(null);
    setFeedback(null);
    setBonusSelected(null);
    setBonusResolved(false);
    setBonusCorrect(false);
    setInputValue("");
    setShowSuggestions(false);

    const query = new URLSearchParams();
    seenCardIdsRef.current.forEach((id) => query.append("exclude", id));
    if (mode === "hard") query.set("mode", "hard");
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
  }, [params.slug, mode]);

  useEffect(() => {
    if (devMode) return;
    seenCardIdsRef.current = [];
    loadNextCard();
  }, [loadNextCard, devMode]);

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
    setShowSuggestions(false);
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

  const handlePlayAgain = useCallback(() => {
    seenCardIdsRef.current = [];
    setAsked(0);
    setCorrectCount(0);
    setShowResults(false);
    if (supportsHardMode) {
      setMode(null);
    } else {
      void loadNextCard();
    }
  }, [supportsHardMode, loadNextCard]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (loading || loadError || !card) return;
      if (document.activeElement?.tagName === "BUTTON") return;

      const isInputFocused = document.activeElement?.tagName === "INPUT";
      const idx = ["1", "2", "3", "4"].indexOf(e.key);

      if (!feedback) {
        if (!isInputFocused && mode !== "hard") {
          // Easy mode pre-submission: 1–4 select a choice
          if (idx !== -1 && card.choices[idx]) {
            setSelected(card.choices[idx].id);
          }
        }
        if (e.key === "Enter" && selected && !isInputFocused) {
          void submitAnswer();
        }
      } else if (bonusPending) {
        // Bonus phase: 1–4 select a bonus choice, Enter submits bonus
        if (idx !== -1 && card.meta.bonusChoices?.[idx]) {
          setBonusSelected(card.meta.bonusChoices[idx]);
        } else if (e.key === "Enter" && bonusSelected && !bonusResolved) {
          submitBonus();
        }
      } else if (e.key === "Enter" && !isInputFocused) {
        // Post-feedback: Enter advances
        if (asked >= QUESTIONS_PER_QUIZ) {
          setShowResults(true);
        } else {
          void loadNextCard();
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [loading, loadError, card, feedback, selected, bonusPending, bonusSelected, bonusResolved, submitAnswer, submitBonus, loadNextCard, mode, asked, setShowResults]);

  const filteredSuggestions = useMemo(() => {
    if (!card || mode !== "hard" || !inputValue || selected) return [];
    return card.choices
      .filter((choice) => choice.label.toLowerCase().includes(inputValue.toLowerCase()))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [card, mode, inputValue, selected]);

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

  // Mode selection screen (terms / kimarite only)
  if (mode === null) {
    return (
      <section className="card space-y-6">
        <Link href="/" className="text-sm text-ink/60 transition-colors hover:text-ink">← Back to Decks</Link>
        <div>
          {DECK_KANJI[params.slug] && (
            <p className="mb-1 text-xs tracking-widest text-ink/30" aria-hidden="true">{DECK_KANJI[params.slug]}</p>
          )}
          <h1 className="text-2xl font-semibold">{DECK_NAMES[params.slug] ?? params.slug}</h1>
        </div>
        <p className="text-sm text-ink/65">Choose a mode to begin your session.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setMode("easy")}
            className="rounded-xl border border-ink/20 bg-parchment p-5 text-left transition hover:border-navy hover:bg-navy/5"
          >
            <p className="font-semibold">Easy</p>
            <p className="mt-1 text-sm text-ink/60">{EASY_MODE_DESC[params.slug] ?? "See the term — pick the right definition from four choices"}</p>
          </button>
          <button
            type="button"
            onClick={() => setMode("hard")}
            className="rounded-xl border border-ink/20 bg-parchment p-5 text-left transition hover:border-navy hover:bg-navy/5"
          >
            <p className="font-semibold">Hard</p>
            <p className="mt-1 text-sm text-ink/60">{HARD_MODE_DESC[params.slug] ?? "See the definition — type and find the matching term"}</p>
          </button>
        </div>
      </section>
    );
  }

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

    const kachiKoshi = correctCount > 10;

    return (
      <section className="card space-y-4">
        <h1 className="text-2xl font-semibold">Session Complete</h1>
        <div className="space-y-1">
          <p className={`text-3xl font-semibold ${scoreColor}`}>{pct}%</p>
          <p className="text-ink/70">{correctCount} / {asked} correct — {message}</p>
        </div>
        {kachiKoshi && (
          <div className="border-t border-ink/10 pt-4 text-center">
            <p className="animate-kachi text-5xl leading-none text-gold" aria-hidden="true">勝ち越し</p>
            <p className="animate-kachi-delay mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold/70">Kachi-koshi</p>
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          <button type="button" className="button-primary" onClick={handlePlayAgain}>Play Again</button>
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
          <span>
            {DECK_KANJI[params.slug] && (
              <span className="mr-2 text-xs tracking-widest text-ink/25" aria-hidden="true">{DECK_KANJI[params.slug]}</span>
            )}
            {DECK_NAMES[params.slug] ?? params.slug} · Question {asked + 1} / {QUESTIONS_PER_QUIZ}
            {mode === "hard" && <span className="ml-2 text-xs text-ink/40">· Hard</span>}
          </span>
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

            {mode === "hard" ? (
              <div className="relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setSelected(null);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => {
                    if (inputValue && !selected) setShowSuggestions(true);
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowSuggestions(false), 150);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && selected) {
                      e.preventDefault();
                      void submitAnswer();
                    } else if (e.key === "Escape") {
                      setShowSuggestions(false);
                    }
                  }}
                  placeholder={params.slug === "rikishi" ? "Type a rikishi name…" : "Type a sumo term…"}
                  className="w-full rounded-lg border border-ink/20 bg-parchment px-3 py-2.5 text-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                  disabled={Boolean(feedback)}
                  autoComplete="off"
                />
                {showSuggestions && filteredSuggestions.length > 0 && !feedback && (
                  <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-ink/15 bg-parchment shadow-md">
                    {filteredSuggestions.map((choice) => (
                      <button
                        key={choice.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setInputValue(choice.label);
                          setSelected(choice.id);
                          setShowSuggestions(false);
                        }}
                        className="w-full px-3 py-2.5 text-left text-sm transition hover:bg-ink/5"
                      >
                        {choice.label}
                      </button>
                    ))}
                  </div>
                )}
                {selected && (
                  <p className="mt-1.5 text-xs text-ink/50">
                    Selected: <span className="font-medium text-ink/80">{inputValue}</span>
                  </p>
                )}
              </div>
            ) : (
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
            )}

            {!feedback ? (
              <div className="flex items-center gap-4">
                <button type="button" className="button-primary" disabled={!selected} onClick={submitAnswer}>
                  Submit
                </button>
                {mode !== "hard" && <span className="text-xs text-ink/40">1–4 to pick · Enter to submit</span>}
                {mode === "hard" && selected && <span className="text-xs text-ink/40">Enter to submit</span>}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                {isLastQuestion ? (
                  <button
                    type="button"
                    className="button-primary"
                    onClick={() => setShowResults(true)}
                    disabled={bonusPending}
                  >
                    See Results
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
