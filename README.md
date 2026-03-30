# Sumo Trainer

A quiz app for learning professional sumo — terminology, winning techniques (kimarite), and active Makuuchi rikishi.

## Stack

- **Next.js 14** + TypeScript + Tailwind CSS
- **Supabase** — anonymous + OAuth auth, Postgres session storage
- **Drizzle ORM** — schema and DB queries
- **Vercel** — hosting and preview deployments
- JSON files for deck content; Python scripts for rikishi data and audio

## Quick Start

```bash
npm install
cp .env.example .env.local   # fill in Supabase + Postgres credentials
npm run dev
```

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `POSTGRES_URL` | Pooled Postgres connection string |
| `POSTGRES_URL_NON_POOLING` | Direct connection (used by drizzle-kit) |

## Database

Schema lives in `lib/schema.ts`. Push changes with:

```bash
npm run db:push
```

## Refresh Rikishi Data

```bash
npm run scrape:rikishi    # fetch latest Makuuchi banzuke from JSA
npm run import:rikishi    # process raw data → makuuchi-current.json + images
```

Outputs:
- `data/rikishi/raw/makuuchi-*.json` — timestamped raw scrape
- `data/rikishi/makuuchi-current.json` — app-ready dataset
- `public/images/rikishi/*.jpg` — rikishi photos

## Generate Pronunciation Audio

Generates Japanese MP3s for all terms and kimarite cards using Google Cloud TTS (Neural2 voice). Skips files that already exist — safe to re-run when new cards are added.

```bash
GOOGLE_TTS_API_KEY=your_key npm run generate:audio
```

Requires Python and [uv](https://github.com/astral-sh/uv). Audio files are committed to `public/audio/` and served statically — no API calls at runtime.

## Tests

```bash
npm run test
```

CI runs `npm run test` and `npm run build` on every PR.
