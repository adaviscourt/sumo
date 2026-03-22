import { NextResponse } from "next/server";
import { getRikishiCurrent } from "@/lib/data";

export async function GET() {
  const current = await getRikishiCurrent();
  return NextResponse.json({
    rikishiCount: current.rikishi.length,
    latestSnapshot: current.fetchedAt
  });
}
