"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { QUESTIONS_PER_QUIZ } from "@/lib/config";
import { celebrationTier } from "@/lib/quiz";

const PRONOUNCEABLE_DECKS = new Set(["terms", "kimarite"]);

function speak(audioPath: string, japanese: string) {
  // Try static audio file first (Google Neural2 TTS), fall back to Web Speech API
  const audio = new Audio(audioPath);
  audio.play().catch(() => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(japanese);
    u.lang = "ja-JP";
    const jaVoices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith("ja"));
    const preferred =
      jaVoices.find(v => /enhanced|premium/i.test(v.name)) ??
      jaVoices.find(v => /o-?ren/i.test(v.name)) ??
      jaVoices.find(v => /otoya/i.test(v.name)) ??
      jaVoices[0];
    if (preferred) u.voice = preferred;
    window.speechSynthesis.speak(u);
  });
}

const DECK_NAMES: Record<string, string> = {
  terms: "Sumo Terms",
  kimarite: "Kimarite",
  rikishi: "Rikishi Identification",
  yokozuna: "Yokozuna",
  heya: "Heya"
};

const DECK_KANJI: Record<string, string> = {
  terms: "用語",
  kimarite: "決まり手",
  rikishi: "力士",
  yokozuna: "横綱",
  heya: "部屋"
};

const HARD_MODE_DECKS = new Set(["terms", "kimarite", "rikishi", "yokozuna", "heya"]);
const STREAK_MILESTONES = new Set([7, 30, 100]);

const EASY_MODE_DESC: Record<string, string> = {
  rikishi: "See the image — pick the rikishi's name from four choices",
  yokozuna: "See the yokozuna's name — pick their most notable achievement",
  heya: "See the stable's name — pick the right description"
};

const HARD_MODE_DESC: Record<string, string> = {
  rikishi: "See the image — type the rikishi's name",
  yokozuna: "See the description — type the yokozuna's name",
  heya: "See the description — type the stable's name"
};

type Choice = { id: string; label: string };
type CardPayload = {
  cardId: string;
  deckSlug: string;
  prompt: string;
  choices: Choice[];
  meta: {
    japanese?: string;
    audioPath?: string;
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
  const devScore = devMode ? (searchParams.get("dev") === "zensho" ? 20 : params.slug === "rikishi" ? 11 : 10) : 0;

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
  const [correctCount, setCorrectCount] = useState(devScore);
  const [loadError, setLoadError] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const seenCardIdsRef = useRef<string[]>([]);
  const cardResultsRef = useRef<Array<{ cardId: string; correct: boolean; respondedAt: string }>>([]);

  const [showResults, setShowResults] = useState(devMode);
  const [mastery, setMastery] = useState<{ mastered: number; learning: number; new: number; total: number } | null>(null);
  const [streakMilestone, setStreakMilestone] = useState<number | null>(null);

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
    if (mode !== null) return;
    void fetch(`/api/decks/${params.slug}/mastery`)
      .then(r => r.json())
      .then((data: { summary: { mastered: number; learning: number; new: number; total: number } }) => setMastery(data.summary))
      .catch(() => null);
  }, [mode, params.slug]);

  useEffect(() => {
    if (!done || !streakMilestone) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const palette = ["#d4a017", "#27386e", "#b55233", "#1f5c4d", "#f8f1de"];
    void import("canvas-confetti").then(({ default: confetti }) => {
      void confetti({ particleCount: streakMilestone >= 30 ? 140 : 90, spread: 70, origin: { y: 0.5 }, colors: palette });
    });
  }, [done, streakMilestone]);

  useEffect(() => {
    const tier = celebrationTier(correctCount, params.slug);

    if (!done || !tier) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const palette = ["#d4a017", "#27386e", "#b55233", "#1f5c4d", "#f8f1de"];

    void import("canvas-confetti").then(({ default: confetti }) => {
      if (tier === "zensho") {
        // Three-burst celebration: centre, then left and right cannon
        void confetti({ particleCount: 120, spread: 90, origin: { y: 0.55 }, colors: palette });
        setTimeout(() => {
          void confetti({ particleCount: 80, angle: 60, spread: 55, origin: { x: 0, y: 0.65 }, colors: palette });
          void confetti({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1, y: 0.65 }, colors: palette });
        }, 350);
        setTimeout(() => {
          void confetti({ particleCount: 60, spread: 100, origin: { y: 0.4 }, colors: palette });
        }, 700);
      } else {
        void confetti({ particleCount: 100, spread: 80, origin: { y: 0.55 }, colors: palette });
      }
    });
  }, [done, correctCount, params.slug]);

  useEffect(() => {
    if (!done) return;

    void fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deckSlug: params.slug,
        score: correctCount,
        asked,
        endedAt: new Date().toISOString(),
        cardResults: cardResultsRef.current
      })
    }).then(() =>
      fetch("/api/progress")
        .then(r => r.json())
        .then((data: { _overall?: { streak: number } }) => {
          const streak = data._overall?.streak ?? 0;
          if (STREAK_MILESTONES.has(streak)) {
            setStreakMilestone(streak);
          }
        })
        .catch(() => null)
    );
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
    cardResultsRef.current = [
      ...cardResultsRef.current,
      { cardId: card.cardId, correct: payload.correct, respondedAt: new Date().toISOString() }
    ];
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
    cardResultsRef.current = [
      ...cardResultsRef.current,
      { cardId: `${card.cardId}:bonus`, correct: isCorrect, respondedAt: new Date().toISOString() }
    ];
  }, [bonusResolved, bonusSelected, card?.meta.bonusAnswer, feedback?.bonusEligible]);

  const handlePlayAgain = useCallback(() => {
    seenCardIdsRef.current = [];
    cardResultsRef.current = [];
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
        {mastery && (
          <div className="flex items-center gap-4 text-xs text-ink/45">
            <span><span className="font-medium text-pine">{mastery.mastered}</span> mastered</span>
            <span><span className="font-medium text-ink/70">{mastery.learning}</span> learning</span>
            <span><span className="font-medium text-ink/40">{mastery.new}</span> new</span>
          </div>
        )}
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

    const tier = celebrationTier(correctCount, params.slug);

    return (
      <section className="card space-y-4">
        <h1 className="text-2xl font-semibold">Session Complete</h1>
        <div className="space-y-1">
          <p className={`text-3xl font-semibold ${scoreColor}`}>{pct}%</p>
          <p className="text-ink/70">{correctCount} / {asked} correct — {message}</p>
        </div>
        {tier === "zensho" && (
          <div className="border-t border-ink/10 pt-4 text-center">
            <p className="animate-zensho text-6xl leading-none text-gold" aria-hidden="true">全勝優勝</p>
            <p className="animate-zensho-delay mt-2 text-sm font-bold uppercase tracking-[0.2em] text-gold">Zensho-yusho</p>
          </div>
        )}
        {tier === "kachi" && (
          <div className="border-t border-ink/10 pt-4 text-center">
            <p className="animate-kachi text-5xl leading-none text-gold" aria-hidden="true">勝ち越し</p>
            <p className="animate-kachi-delay mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold/70">Kachi-koshi</p>
          </div>
        )}
        {streakMilestone && (
          <div className="border-t border-ink/10 pt-4 text-center space-y-1">
            <p className="text-sm font-semibold text-clay">{streakMilestone}-day streak</p>
            <p className="text-xs text-ink/50">
              {streakMilestone >= 100 ? "One hundred days. Unbreakable." : streakMilestone >= 30 ? "Thirty days of dedication." : "A full week on the dohyō."}
            </p>
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
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-medium">{card.prompt}</h2>
              {card.meta.audioPath && card.meta.japanese && PRONOUNCEABLE_DECKS.has(params.slug) && (
                <button
                  type="button"
                  onClick={() => speak(card.meta.audioPath!, card.meta.japanese!)}
                  aria-label={`Hear pronunciation of ${card.prompt}`}
                  className="shrink-0 text-ink/30 transition-colors hover:text-ink/60"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                  </svg>
                </button>
              )}
            </div>

            {!feedback ? (
              <>
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
                      className="w-full rounded-lg border border-ink/20 bg-parchment px-3 py-2.5 text-base focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                      autoComplete="off"
                    />
                    {showSuggestions && filteredSuggestions.length > 0 && (
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
                      >
                        {choice.label}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <button type="button" className="button-primary" disabled={!selected} onClick={submitAnswer}>
                    Submit
                  </button>
                  {mode !== "hard" && <span className="text-xs text-ink/40">1–4 to pick · Enter to submit</span>}
                  {mode === "hard" && selected && <span className="text-xs text-ink/40">Enter to submit</span>}
                </div>
              </>
            ) : bonusPending && card.meta.bonusPrompt && card.meta.bonusChoices ? (
              <>
                <div className="rounded-lg border border-ink/15 bg-ink/5 px-4 py-3 text-sm">
                  <p className="text-pine">Correct — {feedback.correctAnswer}</p>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gold">Bonus question</p>
                  <p className="font-medium">{card.meta.bonusPrompt}</p>
                  <div className="grid gap-2">
                    {card.meta.bonusChoices.map((choice) => (
                      <button
                        key={choice}
                        type="button"
                        onClick={() => setBonusSelected(choice)}
                        className={`quiz-choice ${
                          bonusSelected === choice ? "!border-gold !bg-gold/20 ring-2 ring-gold/40" : ""
                        }`}
                      >
                        {choice}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-4">
                    <button type="button" className="button-primary" disabled={!bonusSelected} onClick={submitBonus}>
                      Submit Bonus
                    </button>
                    {bonusSelected && <span className="text-xs text-ink/40">Enter to submit</span>}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1.5 rounded-lg border border-ink/15 bg-ink/5 p-4 text-sm">
                  <p className={feedback.correct ? "text-pine" : "text-clay"}>
                    {feedback.correct ? "Correct" : "Not quite"} — {feedback.correctAnswer}
                  </p>
                  {card.meta.japanese ? <p className="text-ink/70">Japanese: {card.meta.japanese}</p> : null}
                  {card.meta.rank ? <p className="text-ink/70">Current rank: {card.meta.rank}</p> : null}
                  {card.meta.heya ? <p className="text-ink/70">Heya: {card.meta.heya}</p> : null}
                  {card.meta.profileUrl ? (
                    <p>
                      <a className="underline text-ink/70" href={card.meta.profileUrl} target="_blank" rel="noreferrer">
                        Official profile
                      </a>
                    </p>
                  ) : null}
                  {bonusResolved ? (
                    <p className={bonusCorrect ? "text-pine" : "text-clay"}>
                      {bonusCorrect
                        ? "Bonus correct (+1 point)."
                        : `Bonus incorrect. Correct rank family: ${card.meta.bonusAnswer}`}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-4">
                  {isLastQuestion ? (
                    <button type="button" className="button-primary" onClick={() => setShowResults(true)}>
                      See Results
                    </button>
                  ) : (
                    <button type="button" className="button-secondary" onClick={loadNextCard}>
                      Next Card
                    </button>
                  )}
                  <span className="text-xs text-ink/40">Enter to continue</span>
                </div>
              </>
            )}
          </div>
        ) : null}
    </section>
  );
}
