# Codex Cloud GitHub Setup

Use these repo-versioned scripts in Codex Cloud environment lifecycle settings.

## Files
- `scripts/codex/setup-github.sh`
- `scripts/codex/maintenance-github.sh`
- `scripts/codex/create-pr.sh`

## Codex Cloud Environment Settings
- Setup command:
  - `bash scripts/codex/setup-github.sh`
- Maintenance command:
  - `bash scripts/codex/maintenance-github.sh`

## Required Secret
Set one of:
- `GH_TOKEN` (preferred)
- `GITHUB_TOKEN`

Token should have repository access for this repo.

## Optional Overrides
- `REPO_URL`
  - Defaults to `https://github.com/adaviscourt/sumo.git`

## Behavior
Setup script:
- verifies `git` and `gh`
- authenticates `gh` using token (if provided)
- runs `gh auth setup-git`
- sets or updates `origin` remote URL

Maintenance script:
- verifies `git` and `gh`
- enforces expected `origin` URL
- checks `gh auth status`
- probes GitHub API with `gh api user` (or `git ls-remote` fallback)
- runs a non-destructive write check: `git push --dry-run origin HEAD:<current-branch>`

Optional env var:
- `CHECK_PUSH_DRY_RUN=0` to disable write probe (not recommended)

If maintenance fails with network/proxy errors, that indicates environment egress policy issues rather than script logic.

## PR Creation (without `gh`)
Use:

```bash
bash scripts/codex/create-pr.sh <issue_number>
```

Use the actual issue number from the active issue thread (positive integer only).
The script rejects invalid values such as `0` or placeholder strings.

This script uses GitHub REST API directly with `GH_TOKEN`/`GITHUB_TOKEN` and prints the PR URL on success.
If env vars are unavailable at runtime, it also falls back to the configured `git` `core.askPass` token.
If API creation fails, use manual fallback:

```text
https://github.com/adaviscourt/sumo/pull/new/<branch>
```

## Existing PR Follow-up (same branch only)
When triggering Codex from an existing PR comment, first align workspace branch to PR head:

```bash
bash scripts/codex/checkout-pr-branch.sh <pr_number>
```

This prevents edits from being committed to the default `work` branch in Codex Cloud sessions.
