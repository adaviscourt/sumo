"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { calculateRank, RANKS } from "@/lib/rank";

type Provider = "google" | "github";

type Session = {
  id: string;
  deckSlug: string;
  score: number;
  asked: number;
  endedAt: string;
};

type OverallProgress = {
  qualifyingSessions: number;
};

const DECK_NAMES: Record<string, string> = {
  terms: "Sumo Terms",
  kimarite: "Kimarite",
  rikishi: "Rikishi Identification"
};

const NAVY = "#27386e";
const INK = "#1b1a17";

function DohyoRank({ qualifyingSessions }: { qualifyingSessions: number }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 80);
    return () => clearTimeout(t);
  }, []);

  const { rank, progress, toNext } = calculateRank(qualifyingSessions);
  const currentIndex = RANKS.findIndex((r) => r.name === rank.name);
  const nextRank = RANKS[currentIndex + 1];
  const rangeSize = nextRank ? nextRank.threshold - rank.threshold : 1;
  const pct = nextRank ? progress / rangeSize : 1;

  const R = 72;
  const circumference = 2 * Math.PI * R;
  const dashOffset = circumference * (1 - (animated ? pct : 0));

  // 16 tawara dots around the outer ring
  const TAWARA_R = 91;
  const tawara = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * 2 * Math.PI;
    return { x: 100 + TAWARA_R * Math.cos(a), y: 100 + TAWARA_R * Math.sin(a) };
  });

  return (
    <div className="space-y-6">
      {/* Dohyō */}
      <div className="flex justify-center">
        <svg
          viewBox="0 0 200 200"
          width="220"
          height="220"
          aria-label={`Current rank: ${rank.name}`}
          role="img"
        >
          {/* Outer ring */}
          <circle cx="100" cy="100" r="90" fill="none" stroke={INK} strokeWidth="1" opacity="0.08" />
          {/* Tawara (straw bale) dots */}
          {tawara.map((pt, i) => (
            <circle key={i} cx={pt.x} cy={pt.y} r="2.2" fill={INK} opacity="0.13" />
          ))}
          {/* Inner clay surface */}
          <circle cx="100" cy="100" r="82" fill={INK} fillOpacity="0.02" />
          {/* Arc track */}
          <circle cx="100" cy="100" r={R} fill="none" stroke={INK} strokeWidth="4" opacity="0.07" />
          {/* Progress arc */}
          <circle
            cx="100" cy="100" r={R}
            fill="none"
            stroke={NAVY}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 100 100)"
            style={{ transition: animated ? "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)" : "none" }}
          />
          {/* Shikiri-sen (starting lines) */}
          <line x1="81" y1="104" x2="95" y2="104" stroke={INK} strokeWidth="1.5" opacity="0.18" strokeLinecap="round" />
          <line x1="105" y1="104" x2="119" y2="104" stroke={INK} strokeWidth="1.5" opacity="0.18" strokeLinecap="round" />
          {/* Rank kanji */}
          <text
            x="100" y="88"
            textAnchor="middle"
            fontSize="13"
            fontFamily="Hiragino Sans, Yu Gothic, Noto Sans JP, sans-serif"
            fill={INK}
            opacity="0.28"
          >
            {rank.kanji}
          </text>
          {/* Rank name */}
          <text
            x="100" y="111"
            textAnchor="middle"
            fontSize="17"
            fontWeight="700"
            fontFamily="Avenir Next, Segoe UI, sans-serif"
            fill={INK}
            opacity="0.80"
            letterSpacing="0.03em"
          >
            {rank.name}
          </text>
          {/* Session count */}
          <text
            x="100" y="127"
            textAnchor="middle"
            fontSize="10"
            fontFamily="Avenir Next, Segoe UI, sans-serif"
            fill={INK}
            opacity="0.30"
          >
            {qualifyingSessions} qualifying session{qualifyingSessions !== 1 ? "s" : ""}
          </text>
        </svg>
      </div>

      {/* Rank pipeline */}
      <div className="space-y-2">
        <div className="flex items-center">
          {RANKS.map((r, i) => (
            <div key={r.name} className="flex flex-1 items-center">
              {i > 0 && (
                <div
                  className="h-px flex-1"
                  style={{ backgroundColor: i <= currentIndex ? `${NAVY}60` : `${INK}18` }}
                />
              )}
              <div
                title={`${r.name} · ${r.kanji}`}
                style={
                  i === currentIndex
                    ? { width: 13, height: 13, borderRadius: "50%", backgroundColor: NAVY, boxShadow: `0 0 0 3px ${NAVY}22`, flexShrink: 0 }
                    : i < currentIndex
                    ? { width: 8, height: 8, borderRadius: "50%", backgroundColor: `${NAVY}70`, flexShrink: 0 }
                    : { width: 8, height: 8, borderRadius: "50%", border: `1px solid ${INK}25`, flexShrink: 0 }
                }
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-ink/30">
          <span>序ノ口</span>
          <span>横綱</span>
        </div>
      </div>

      {/* Progress text */}
      <p className="text-xs text-ink/40">
        {toNext !== null
          ? <>{toNext} more qualifying session{toNext !== 1 ? "s" : ""} to reach <span className="font-medium text-ink/60">{nextRank?.name}</span></>
          : <>横綱 — highest rank achieved</>
        }
      </p>
    </div>
  );
}

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [overall, setOverall] = useState<OverallProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    void supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser && !currentUser.is_anonymous) {
        void fetch("/api/sessions")
          .then((res) => res.json())
          .then((data: Session[]) => setSessions(data))
          .catch(() => setSessions([]));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user && !user.is_anonymous) {
      void fetch("/api/sessions")
        .then((res) => res.json())
        .then((data: Session[]) => setSessions(data))
        .catch(() => setSessions([]));

      void fetch("/api/progress")
        .then((res) => res.json())
        .then((data: Record<string, unknown> & { _overall?: OverallProgress }) => {
          if (data._overall) setOverall(data._overall);
        })
        .catch(() => null);
    }
  }, [user]);

  async function signIn(provider: Provider) {
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback`;

    const { data: { user } } = await supabase.auth.getUser();
    if (user?.is_anonymous) {
      document.cookie = `sumo_migrate=${user.id}; path=/; max-age=300; samesite=lax`;
      const { error } = await supabase.auth.linkIdentity({ provider, options: { redirectTo } });
      if (!error) return;
    }

    await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
  }

  if (loading) {
    return (
      <div className="max-w-lg space-y-4 animate-pulse">
        <div className="h-6 w-24 rounded bg-ink/10" />
        <div className="h-4 w-48 rounded bg-ink/10" />
      </div>
    );
  }

  const isAnonymous = !user || user.is_anonymous === true;

  return (
    <div className="max-w-lg space-y-10">
      <div className="space-y-1">
        <p className="text-xs tracking-widest text-ink/30" aria-hidden="true">道場</p>
        <h1 className="text-2xl font-bold tracking-wide">My Dōjō</h1>
      </div>

      {isAnonymous ? (
        <section className="card space-y-6">
          <div className="space-y-1">
            <h2 className="font-semibold">Sign in to sync your progress</h2>
            <p className="text-sm text-ink/60">
              Your sessions will be saved across devices. Your progress so far won&apos;t be lost.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => void signIn("google")}
              className="button-secondary flex-1 text-center"
            >
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => void signIn("github")}
              className="button-secondary flex-1 text-center"
            >
              Continue with GitHub
            </button>
          </div>
        </section>
      ) : (
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <p className="text-sm text-ink/60">
              {user.user_metadata?.full_name as string | undefined
                ?? user.user_metadata?.user_name as string | undefined
                ?? user.email}
            </p>
            <button
              type="button"
              onClick={() => void signOut()}
              className="text-xs text-ink/40 transition-colors hover:text-ink/70"
            >
              Sign out
            </button>
          </div>

          <div className="card space-y-1">
            <div className="mb-4 space-y-0.5">
              <p className="text-xs tracking-widest text-ink/30" aria-hidden="true">番付</p>
              <h2 className="font-semibold">Current Rank</h2>
            </div>
            <DohyoRank qualifyingSessions={overall?.qualifyingSessions ?? 0} />
          </div>

          <div className="card space-y-4">
            <p className="text-xs tracking-widest text-ink/30" aria-hidden="true">稽古</p>
            <h2 className="font-semibold">Recent Sessions</h2>
            {sessions.length === 0 ? (
              <p className="text-sm text-ink/60">No sessions yet. <Link href="/" className="underline underline-offset-2">Start a deck.</Link></p>
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
                          minute: "2-digit"
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}

      <Link href="/" className="inline-block text-sm text-ink/40 transition-colors hover:text-ink/70">
        ← Back to decks
      </Link>
    </div>
  );
}
