## Why

The Makuuchi Rikishi deck already rewards a correct rikishi identification with one rank-family bonus question. Issue #48 asks to deepen that moment with a second bonus question for the rikishi's signature maneuver, using profile data already scraped from the official source and kimarite deck content already present in the app.

## What Changes

- Add signature maneuver as a second rikishi bonus question after the existing rank-family bonus.
- Keep rank-family and signature-maneuver bonus attempts independent: a wrong rank-family answer must not block the signature-maneuver prompt.
- Enrich scraped/imported rikishi data with signature maneuver data from official profiles, while preserving the current scraper/import workflow.
- Reuse kimarite deck content so signature maneuver feedback includes the romanized kimarite term, Japanese characters, and the existing summary/definition.
- Adjust rikishi celebration scoring so zensho-yusho reflects the new maximum score.
- Preserve non-rikishi deck behavior, auth/session storage, and existing quiz gameplay outside the rikishi bonus phase.

## Capabilities

### New Capabilities

- `rikishi-bonus-questions`: Multi-step bonus questions for correct Makuuchi Rikishi answers, including signature maneuver data, independent bonus progression, and adjusted rikishi scoring.

### Modified Capabilities

- None.

## Impact

- Affected data: `data/rikishi/raw/*`, `data/rikishi/makuuchi-current.json`, and typed rikishi row shapes.
- Affected scripts: `scripts/scrape_rikishi.py` and `scripts/import_rikishi.ts`.
- Affected quiz data mapping: rikishi card metadata in `lib/data.ts` and related types in `lib/types.ts`.
- Affected quiz UI: rikishi bonus state, rendering, keyboard handling, feedback, and result progression in `app/deck/[slug]/page.tsx`.
- Affected scoring: rikishi zensho-yusho threshold and related tests in `lib/quiz.ts` / `tests/quiz.test.ts`.
- Affected verification: unit/UI coverage for two bonus questions, score thresholds, kimarite enrichment, and scraper/import compatibility.
