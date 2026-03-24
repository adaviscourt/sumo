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
- Work must be pushed to GitHub remote (local-only commits are not acceptable)
- PR creation order:
  - First: `bash scripts/codex/create-pr.sh <issue_number>`
  - Fallback if script fails: `https://github.com/adaviscourt/sumo/pull/new/<branch>`
- PR body must include issue linkage keyword: `Closes #<issue_number>` (or `Fixes` / `Resolves`)

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
- Codex must report: branch name, commit SHA, pushed-to-origin status, and PR URL
- Codex must not mark done without a valid PR URL
- Codex must report the exact issue-closing line used in the PR body
