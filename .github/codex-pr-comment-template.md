@codex
Please apply this change on the current PR branch only.

Requirements:
- This is PR follow-up mode (existing PR), not issue implementation mode.
- Before editing, run: `bash scripts/codex/checkout-pr-branch.sh <pr_number>` using PR `#<number>` from this thread, then report the checked-out branch name.
- Do not create a new branch.
- Do not open a new PR.
- Commit directly to the currently checked out PR branch and push to `origin/<current-branch>`.
- Keep changes focused and minimal.
- Add/adjust tests if relevant, but do not run local test/build unless explicitly requested.

Definition of done:
- New commit(s) pushed to the same PR branch.
- Existing PR is updated by those commit(s).
- Include this verification block:
  - `Branch:` `<current-branch>`
  - `Commit:` `<full-sha>`
  - `Pushed to origin:` `yes/no`
  - `git ls-remote output:` `<exact line or exact error>`
  - `PR updated:` `yes/no`

If push fails, stop and include exact command output/error text.
