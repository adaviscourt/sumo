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
- Minimize Codex runtime usage: no local test/build unless explicitly requested

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Files/Areas Likely Involved
- `app/...`
- `scripts/...`
- `data/...`

## Verification & Merge Policy
- CI is the source of truth: `npm run test` and `npm run build`
- If CI fails, request follow-up fixes via `@codex` in the PR

## Delegation Comment (paste into issue)
```md
@codex
Please implement this issue and open a PR.

Requirements:
- Follow the acceptance criteria exactly.
- Keep architecture JSON-backed (no DB).
- Keep changes focused and minimal.
- Add/adjust tests where relevant.
- Do not run local test/build commands unless explicitly requested.

Definition of done:
- Open a PR with concise change summary and risks.
- CI (`npm run test`, `npm run build`) is the merge gate.
- If CI fails, I will call @codex in PR comments to fix failures.
```
