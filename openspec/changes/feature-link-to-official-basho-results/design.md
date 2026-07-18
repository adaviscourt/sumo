## Context

Sumo Trainer is a Next.js app with a shared root layout in `app/layout.tsx`. The issue asks for a banner at the top of the site only when an active basho is in progress, linking to the official JSA results page.

The app already uses official JSA data for rikishi and banzuke references, but this feature does not need to scrape or proxy JSA results. It only needs reliable visibility logic and an external link.

## Goals / Non-Goals

**Goals:**

- Display a compact, site-wide banner above the normal header during active honbasho dates.
- Link to `https://www.sumo.or.jp/EnHonbashoMain`.
- Evaluate active state in Japan-local dates, inclusive of each tournament day.
- Keep behavior deterministic and testable.

**Non-Goals:**

- Do not mirror, scrape, cache, or transform official results.
- Do not add push notifications, tournament standings, or day-by-day result data inside Sumo Trainer.
- Do not alter quiz, progress, auth, or deck behavior.

## Decisions

- Use a small data-driven honbasho schedule utility rather than a live JSA fetch.
  - Rationale: banner visibility is date-based, fast, deterministic, and easy to test. A live fetch would add latency and failure states for a link-only feature.
  - Alternative considered: request the JSA page at runtime and infer tournament state from page contents. Rejected because the page has no documented API contract and scraping would be fragile.

- Compare dates using Japan time.
  - Rationale: honbasho activity is defined by the tournament location/calendar, not the visitor's local day.
  - Alternative considered: browser-local date checks. Rejected because users in other time zones could see the wrong state near midnight.

- Render the banner from shared layout/header code.
  - Rationale: the requirement says "top of site", so all routes should get the same behavior without per-page duplication.
  - Alternative considered: homepage-only banner. Rejected because it does not satisfy site-wide top placement.

## Risks / Trade-offs

- Schedule data can become stale. Mitigation: keep the schedule isolated in one typed module and include tests that make missing future coverage visible.
- JSA URL path can change. Mitigation: keep the official URL in one constant and use a normal external link so failure is limited to user navigation.
- Server and client clocks may differ. Mitigation: make active-date utility accept an injectable date for tests and use current runtime date only at render time.

## Migration Plan

No data migration required. Deploy as a UI and utility-code change. Rollback by removing the banner component and schedule utility.

## Open Questions

- How far ahead should honbasho schedule data be maintained during implementation? Minimum apply-ready scope is the current known schedule plus near-future coverage sufficient for tests.
