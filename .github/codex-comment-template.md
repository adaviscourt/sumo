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
- PR body must include an issue-closing keyword:
  - `Closes #<issue_number>` (or `Fixes` / `Resolves`)

Definition of done:
- Open a PR with concise change summary and risks.
- CI (`npm run test`, `npm run build`) is the merge gate.
- If CI fails, I will call @codex in PR comments to fix failures.
- Include this verification block in your final comment:
  - `Branch:` `<branch-name>`
  - `Commit:` `<full-sha>`
  - `Pushed to origin:` `yes/no`
  - `PR URL:` `<url>`
  - `Issue linkage line in PR body:` `Closes #<issue_number>`
- Do not mark done without a valid PR URL.
- If push or PR creation fails, stop and include exact command output/error text plus fallback PR URL.
