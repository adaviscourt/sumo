"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type Provider = "google" | "github";

export function HeaderAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    void supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(provider: Provider) {
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback`;

    const { data: { user } } = await supabase.auth.getUser();
    if (user?.is_anonymous) {
      const { error } = await supabase.auth.linkIdentity({ provider, options: { redirectTo } });
      if (!error) return;
      // Provider already linked to another account — sign in normally
    }

    await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
  }

  if (loading) return null;

  if (!user || user.is_anonymous) {
    return (
      <div className="flex items-center gap-3 text-xs text-ink/40">
        <span className="hidden sm:inline">Sync progress:</span>
        <button
          type="button"
          onClick={() => void signIn("google")}
          className="transition-colors hover:text-ink/70"
        >
          Google
        </button>
        <span aria-hidden="true">·</span>
        <button
          type="button"
          onClick={() => void signIn("github")}
          className="transition-colors hover:text-ink/70"
        >
          GitHub
        </button>
      </div>
    );
  }

  const displayName = user.user_metadata?.full_name as string | undefined
    ?? user.user_metadata?.user_name as string | undefined
    ?? user.email
    ?? "Signed in";

  return (
    <div className="flex items-center gap-3 text-xs text-ink/40">
      <span className="hidden sm:inline truncate max-w-[140px]">{displayName}</span>
      <button
        type="button"
        onClick={() => void signOut()}
        className="transition-colors hover:text-ink/70"
      >
        Sign out
      </button>
    </div>
  );
}
