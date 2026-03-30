# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "requests",
# ]
# ///
"""
Generate Japanese pronunciation MP3s for all terms and kimarite cards
using Google Cloud Text-to-Speech Neural2 voices.

Usage:
    GOOGLE_TTS_API_KEY=your_key uv run scripts/generate_audio.py

Output: public/audio/{deck}/{slug}.mp3
Skips files that already exist — safe to re-run when new cards are added.
"""

import base64
import json
import os
import re
import sys
import time
from pathlib import Path

import requests

API_KEY = os.environ.get("GOOGLE_TTS_API_KEY")
if not API_KEY:
    print("Error: GOOGLE_TTS_API_KEY environment variable is not set", file=sys.stderr)
    sys.exit(1)

VOICE_NAME = "ja-JP-Neural2-B"  # Natural female voice
API_URL = f"https://texttospeech.googleapis.com/v1/text:synthesize?key={API_KEY}"

ROOT = Path(__file__).parent.parent

DECKS = [
    ("terms",    ROOT / "data/seed/terms.json"),
    ("kimarite", ROOT / "data/seed/kimarite.json"),
]


def term_slug(term: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", term.lower()).strip("-")
    return slug


def synthesize(japanese: str) -> bytes:
    response = requests.post(
        API_URL,
        json={
            "input": {"text": japanese},
            "voice": {"languageCode": "ja-JP", "name": VOICE_NAME},
            "audioConfig": {"audioEncoding": "MP3", "speakingRate": 0.9},
        },
        timeout=15,
    )
    response.raise_for_status()
    return base64.b64decode(response.json()["audioContent"])


generated = 0
skipped = 0

for deck_slug, deck_path in DECKS:
    cards = json.loads(deck_path.read_text())
    out_dir = ROOT / "public" / "audio" / deck_slug
    out_dir.mkdir(parents=True, exist_ok=True)

    for card in cards:
        filename = f"{term_slug(card['term'])}.mp3"
        filepath = out_dir / filename

        if filepath.exists():
            print(f"  skip  {deck_slug}/{filename}")
            skipped += 1
            continue

        try:
            audio = synthesize(card["japanese"])
            filepath.write_bytes(audio)
            print(f"  gen   {deck_slug}/{filename}  ({len(audio):,} bytes)")
            generated += 1
        except requests.HTTPError as e:
            print(f"  error {deck_slug}/{filename}: {e.response.status_code} {e.response.text}", file=sys.stderr)
        except Exception as e:
            print(f"  error {deck_slug}/{filename}: {e}", file=sys.stderr)

        time.sleep(0.2)  # stay well within rate limits

print(f"\nDone. {generated} generated, {skipped} skipped.")
