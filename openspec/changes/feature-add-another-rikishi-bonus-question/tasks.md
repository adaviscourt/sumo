## 1. Rikishi Data Enrichment

- [ ] 1.1 Inspect current official rikishi profile markup for the signature maneuver label and any label variants.
- [ ] 1.2 Extend `scripts/scrape_rikishi.py` row typing and profile parsing to capture optional signature maneuver data without degrading banzuke fallback rows.
- [ ] 1.3 Preserve signature maneuver data through `scripts/import_rikishi.ts` into `data/rikishi/makuuchi-current.json`.
- [ ] 1.4 Regenerate or update the current rikishi dataset through the existing scraper/import workflow during implementation verification.

## 2. Kimarite Matching and Card Metadata

- [ ] 2.1 Add typed quiz metadata for ordered rikishi bonuses while preserving existing main-card metadata fields.
- [ ] 2.2 Add a kimarite lookup helper that matches scraped signature maneuver values to `data/seed/kimarite.json` by normalized term.
- [ ] 2.3 Build rank-family and signature-maneuver bonus definitions for rikishi cards in both easy and hard modes.
- [ ] 2.4 Ensure unmatched or missing signature maneuver data never renders an empty bonus prompt.

## 3. Bonus Flow UI

- [ ] 3.1 Replace single-bonus page state with ordered bonus progression for eligible rikishi cards.
- [ ] 3.2 Keep rank-family first and signature maneuver second for correct rikishi answers.
- [ ] 3.3 Allow signature maneuver attempts even when the rank-family bonus answer is incorrect.
- [ ] 3.4 Render signature maneuver feedback with correct term, Japanese characters, and summary text.
- [ ] 3.5 Preserve keyboard selection/submission behavior across both bonus questions.

## 4. Scoring and Persistence

- [ ] 4.1 Award one point each for correct main rikishi answer, correct rank-family bonus, and correct signature-maneuver bonus.
- [ ] 4.2 Persist distinct synthetic card result ids for each bonus type while keeping them excluded from progress and next-card weighting.
- [ ] 4.3 Adjust rikishi zensho-yusho threshold to the expanded perfect score and keep non-rikishi celebration behavior unchanged.
- [ ] 4.4 Update session result display so rikishi bonus points are measured against the correct maximum.

## 5. Verification

- [ ] 5.1 Add or update unit coverage for kimarite matching, bonus metadata generation, and rikishi celebration thresholds.
- [ ] 5.2 Add or update UI/source coverage for independent two-bonus progression.
- [ ] 5.3 Run `npm run scrape:rikishi && npm run import:rikishi`.
- [ ] 5.4 Run `npm run test`.
- [ ] 5.5 Run `npm run build`.
- [ ] 5.6 Run `openspec validate feature-add-another-rikishi-bonus-question --strict`.
