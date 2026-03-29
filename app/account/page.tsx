"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type Provider = "google" | "github";

type Session = {
  id: string;
  deckSlug: string;
  score: number;
  asked: number;
  endedAt: string;
};

const DECK_NAMES: Record<string, string> = {
  terms: "Sumo Terms",
  kimarite: "Kimarite",
  rikishi: "Rikishi Identification"
};

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
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

  const isAnonymous = !user || user.is_anonymous;

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
        <section className="space-y-6">
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
