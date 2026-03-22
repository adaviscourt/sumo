import { NextResponse } from "next/server";
import { getDeckSummary } from "@/lib/data";

export async function GET() {
  const decks = await getDeckSummary();
  return NextResponse.json(decks);
}
