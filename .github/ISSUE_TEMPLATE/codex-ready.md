---
name: Codex Ready Task
about: Structured issue format for @codex implementation
labels: [codex, codex:ready]
---

## Summary
One-paragraph description of the bug/change.

## Goal
What outcome should be true after this ships?

## Scope
- In scope:
- Out of scope:

## Constraints
- Keep JSON-backed architecture (no Prisma / DB)
- Preserve existing quiz gameplay unless explicitly requested
- Keep scraper + import workflow working

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Files/Areas Likely Involved
- `app/...`
- `scripts/...`
- `data/...`

## Verification Steps
1. `npm run test`
2. `npm run build`
3. (Optional) `npm run scrape:rikishi && npm run import:rikishi`

## Delegation Comment (paste into issue)
```md
@codex
Please implement this issue and open a PR.

Requirements:
- Follow the acceptance criteria exactly.
- Keep architecture JSON-backed (no DB).
- Keep changes focused and minimal.
- Add/adjust tests where relevant.

Definition of done:
- `npm run test` passes
- `npm run build` passes
- PR includes concise change summary and risks
```
