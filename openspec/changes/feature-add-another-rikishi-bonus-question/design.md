## Context

Rikishi cards currently carry a single bonus prompt in `meta.bonusPrompt`, `meta.bonusChoices`, and `meta.bonusAnswer`. The client grades that bonus locally after `/api/answer` confirms the main rikishi answer is correct, records a synthetic `:bonus` card result, and increments the same session score.

The requested signature maneuver data belongs to rikishi profile enrichment, but the explanation content already exists in `data/seed/kimarite.json`. The scraper/import path must keep working through `npm run scrape:rikishi && npm run import:rikishi`, and session storage should continue using the existing Supabase/Drizzle session result model.

## Goals / Non-Goals

**Goals:**

- Represent rikishi bonuses as an ordered set so rank family is asked first and signature maneuver second.
- Extract and preserve signature maneuver profile data during rikishi scraping/import.
- Join signature maneuver terms to kimarite seed content for Japanese characters and summary text.
- Keep bonus attempts independent and independently scored.
- Adjust rikishi result celebrations for the new maximum score.

**Non-Goals:**

- No new deck type, CMS, external runtime dependency, database schema migration, or auth/session replacement.
- No new user-facing bonus beyond rank family and signature maneuver.
- No broad redesign of quiz pages or non-rikishi deck behavior.

## Decisions

1. Model bonuses as an ordered metadata array.

   Replace the single-bonus shape with a typed array such as `meta.bonuses`, where each item has a stable id, prompt, choices, answer, and optional detail fields for feedback. Rank family remains the first item. Signature maneuver becomes the second item when data is available. This avoids adding parallel `bonus2*` fields and makes future bonus additions less invasive without changing gameplay scope now.

   Alternative considered: keep existing fields and add `signatureBonusPrompt`, `signatureBonusChoices`, and `signatureBonusAnswer`. That is smaller initially but duplicates state/rendering logic and makes the independence requirement harder to keep clear.

2. Keep bonus grading client-side, matching current behavior.

   `/api/answer` should continue to decide only whether the main card is correct and bonus eligible. Bonus answers can continue to be checked against metadata already returned with the card. Use distinct synthetic result ids such as `rikishi:<id>:bonus:rank-family` and `rikishi:<id>:bonus:signature-maneuver` so session history can tell the bonus types apart while existing bonus filtering still excludes them from next-card weighting.

   Alternative considered: add a server endpoint for bonus grading. That would duplicate existing answer lookup paths and is not needed for this scope.

3. Hydrate signature maneuver display from kimarite seed data.

   The scraper should capture the official profile's signature maneuver value as a normalized optional field. The quiz data layer should match that value against kimarite seed terms using a shared normalization strategy that ignores casing, spaces, punctuation, and hyphenation. Matched content supplies the choice label, Japanese characters, and summary. Unmatched values should not render an empty or misleading signature bonus; log or expose the missing match during implementation verification.

   Alternative considered: store a full copy of Japanese characters and summaries inside rikishi JSON. That risks divergence from the kimarite deck and adds maintenance work.

4. Bound "extra profile fields" to parser metadata.

   While touching the profile parser, it is acceptable to preserve additional official profile key-value fields in raw/current rikishi JSON when they are already extracted from the same table. These fields must stay optional and must not create additional UI behavior in this change. Signature maneuver is the only new consumed field.

   Alternative considered: plan multiple future bonus fields now. The issue does not define prompts, scoring, or acceptance criteria for them.

5. Score zensho-yusho against the new rikishi maximum.

   A perfect rikishi session with ten correct main answers and both bonus answers correct for each card has 30 possible points. Zensho-yusho should require that perfect rikishi score. Kachi-koshi behavior should remain available for successful non-perfect rikishi sessions and remain unchanged for other decks.

## Risks / Trade-offs

- Official profile labels can change or differ from the issue wording. Mitigation: parse label variants and keep unmatched values visible to tests/logging rather than showing blank bonus prompts.
- Kimarite spelling from the profile may not exactly match the seed term. Mitigation: normalize labels and add a small alias map only for observed mismatches.
- Existing result percentage uses main question count while bonus points increase the numerator. Mitigation: implementation should compute rikishi result display and celebration thresholds from the applicable maximum point total.

## Migration Plan

1. Add optional fields and metadata handling without changing existing required rikishi JSON fields.
2. Update scraper/import and regenerate current rikishi data through the existing commands during implementation verification.
3. Update quiz code to support both legacy single-bonus cards and new ordered bonuses during the transition if useful.
4. No database migration is expected; bonus result ids remain strings in existing session result storage.

## Open Questions

- Exact official profile label variants for signature maneuver should be confirmed during implementation by inspecting current scraped profile markup.
- If a current rikishi profile lacks a signature maneuver or the value cannot be matched to the kimarite seed, implementation should decide whether to skip only that signature bonus or fail the data import. The preferred behavior is to avoid empty UI and surface the mismatch in verification.
