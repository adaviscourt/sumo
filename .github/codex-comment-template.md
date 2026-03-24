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
- Determine the issue number from the current issue thread and use that exact number everywhere below.
- PR creation order:
  - First: `bash scripts/codex/create-pr.sh <actual_issue_number>`
  - Fallback if script fails: `https://github.com/adaviscourt/sumo/pull/new/<branch>`
- PR body must include an issue-closing keyword:
  - `Closes #<actual_issue_number>` (or `Fixes` / `Resolves`)
  - Do not use placeholders like `<issue_number>` or `#0`.

Definition of done:
- Open a PR with concise change summary and risks.
- CI (`npm run test`, `npm run build`) is the merge gate.
- If CI fails, I will call @codex in PR comments to fix failures.
- Include this verification block in your final comment:
  - `Branch:` `<branch-name>`
  - `Commit:` `<full-sha>`
  - `Pushed to origin:` `yes/no`
  - `PR URL:` `<url>`
  - `Issue linkage line in PR body:` `Closes #<actual_issue_number>`
- Do not mark done without a valid PR URL.
- If push or PR creation fails, stop and include exact command output/error text plus fallback PR URL.
