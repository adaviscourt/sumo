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
- If automated PR creation fails, use fallback:
  - `https://github.com/adaviscourt/sumo/pull/new/<branch>`
  - or `gh pr create --base main --head <branch> --title \"...\" --body \"...\"` (if `gh` is available)

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
- Work must be published to GitHub remote (local-only commits are not sufficient).
- Create a branch, push it to origin, and open a PR from that branch.
- If automated PR creation tools fail, fall back to:
  - Browser URL: `https://github.com/adaviscourt/sumo/pull/new/<branch>`
  - Or (if available) `gh pr create --base main --head <branch> --title \"...\" --body \"...\"`

Definition of done:
- Open a PR with concise change summary and risks.
- CI (`npm run test`, `npm run build`) is the merge gate.
- If CI fails, I will call @codex in PR comments to fix failures.
- Include this verification block in your final comment:
  - `Branch:` `<branch-name>`
  - `Commit:` `<full-sha>`
  - `Pushed to origin:` `yes/no`
  - `PR URL:` `<url>`
- Do not mark done without a valid PR URL.
- If push or PR creation fails, stop and include exact command output/error text plus fallback PR URL.
```
