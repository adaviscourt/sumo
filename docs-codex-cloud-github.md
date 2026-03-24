# Codex Cloud GitHub Setup

Use these repo-versioned scripts in Codex Cloud environment lifecycle settings.

## Files
- `scripts/codex/setup-github.sh`
- `scripts/codex/maintenance-github.sh`

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
