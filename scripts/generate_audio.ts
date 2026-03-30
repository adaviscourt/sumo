/**
 * Generates Japanese pronunciation MP3s for all terms and kimarite cards
 * using Google Cloud Text-to-Speech Neural2 voices.
 *
 * Usage:
 *   GOOGLE_TTS_API_KEY=your_key npm run generate:audio
 *
 * Output: public/audio/{deck}/{slug}.mp3
 * Skips files that already exist — safe to re-run when new cards are added.
 */

import fs from "node:fs";
import path from "node:path";
import terms from "../data/seed/terms.json" assert { type: "json" };
import kimarite from "../data/seed/kimarite.json" assert { type: "json" };

const API_KEY = process.env.GOOGLE_TTS_API_KEY;
if (!API_KEY) {
  console.error("Missing GOOGLE_TTS_API_KEY environment variable");
  process.exit(1);
}

const VOICE_NAME = "ja-JP-Neural2-B"; // Natural female voice
const API_URL = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`;

function termSlug(term: string): string {
  return term.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function synthesize(text: string): Promise<Buffer> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: "ja-JP", name: VOICE_NAME },
      audioConfig: { audioEncoding: "MP3", speakingRate: 0.9 }
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TTS API error ${res.status}: ${err}`);
  }

  const data = await res.json() as { audioContent: string };
  return Buffer.from(data.audioContent, "base64");
}

const decks: Array<{ slug: string; cards: Array<{ term: string; japanese: string }> }> = [
  { slug: "terms", cards: terms },
  { slug: "kimarite", cards: kimarite }
];

let generated = 0;
let skipped = 0;

for (const deck of decks) {
  const dir = path.join("public", "audio", deck.slug);
  fs.mkdirSync(dir, { recursive: true });

  for (const card of deck.cards) {
    const filename = `${termSlug(card.term)}.mp3`;
    const filepath = path.join(dir, filename);

    if (fs.existsSync(filepath)) {
      console.log(`  skip  ${deck.slug}/${filename}`);
      skipped++;
      continue;
    }

    try {
      const audio = await synthesize(card.japanese);
      fs.writeFileSync(filepath, audio);
      console.log(`  gen   ${deck.slug}/${filename}  (${audio.length} bytes)`);
      generated++;
    } catch (err) {
      console.error(`  error ${deck.slug}/${filename}: ${err}`);
    }

    // Avoid hitting rate limits
    await new Promise((r) => setTimeout(r, 200));
  }
}

console.log(`\nDone. ${generated} generated, ${skipped} skipped.`);
