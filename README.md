# Sumo Trainer

Local-first webapp for studying professional sumo through quiz decks:
- Terminology
- Kimarite
- Makuuchi rikishi (photo ID + rank-family bonus)

## Stack
- Next.js 14 + TypeScript
- JSON data files (no database)
- Tailwind CSS
- Python scraper for rikishi refresh

## Quick Start
1. Install dependencies:
```bash
npm install
python -m pip install -r requirements.txt
```
2. Prepare rikishi dataset from latest raw snapshot:
```bash
npm run import:rikishi
```
3. Run app:
```bash
npm run dev
```

## Refresh Rikishi Data
Manual refresh flow:
```bash
npm run scrape:rikishi
npm run import:rikishi
```

Outputs:
- `data/rikishi/raw/makuuchi-*.json` (timestamped raw scrape)
- `data/rikishi/makuuchi-current.json` (app-ready current dataset)
- `public/images/rikishi/*.jpg` (downloaded rikishi images)

## Data and Progress Model
- App content is read from JSON in `data/`.
- Session history/progress is stored in browser localStorage (key: `sumo.sessions`).
- No Prisma or DB backend required.

## Tests
```bash
npm run test
```

## Codex Cloud GitHub Setup
Use repo-versioned scripts for Codex Cloud environment lifecycle:

- Setup command:
```bash
bash scripts/codex/setup-github.sh
```
- Maintenance command:
```bash
bash scripts/codex/maintenance-github.sh
```

Set one secret in Codex Cloud:
- `GH_TOKEN` (preferred) or `GITHUB_TOKEN`

Default remote enforced by scripts:
- `https://github.com/adaviscourt/sumo.git`
