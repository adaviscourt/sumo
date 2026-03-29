import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions } from "@/lib/schema";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          }
        }
      }
    );

    const { data: { user } } = await supabase.auth.exchangeCodeForSession(code);
    const migrateFrom = cookieStore.get("sumo_migrate")?.value;

    if (user && migrateFrom && migrateFrom !== user.id) {
      await db
        .update(sessions)
        .set({ userId: user.id })
        .where(eq(sessions.userId, migrateFrom));
    }
  }

  const response = NextResponse.redirect(origin);
  response.cookies.delete("sumo_migrate");
  return response;
}
