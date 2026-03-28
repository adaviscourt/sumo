"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        void supabase.auth.signInAnonymously();
      }
    });
  }, []);

  return <>{children}</>;
}
