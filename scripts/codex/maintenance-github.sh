#!/usr/bin/env bash
set -euo pipefail

REPO_URL_DEFAULT="https://github.com/adaviscourt/sumo.git"
REPO_URL="${REPO_URL:-$REPO_URL_DEFAULT}"
CHECK_PUSH_DRY_RUN="${CHECK_PUSH_DRY_RUN:-1}"

log() {
  printf '[maintenance-github] %s\n' "$*"
}

sanitize_log() {
  # Mask common GitHub token shapes if they appear in stderr/stdout.
  sed -E \
    -e 's/(ghp|gho|ghu|ghs|ghr|github_pat)_[A-Za-z0-9_]+/***REDACTED_TOKEN***/g' \
    -e 's#(https?://)(oauth2|x-access-token):[^@]+@#\1\2:***REDACTED***@#g'
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log "Missing required command: $1"
    exit 1
  fi
}

has_cmd() {
  command -v "$1" >/dev/null 2>&1
}

ensure_remote() {
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    if git remote get-url origin >/dev/null 2>&1; then
      current="$(git remote get-url origin)"
      if [[ "$current" != "$REPO_URL" ]]; then
        git remote set-url origin "$REPO_URL"
        log "Corrected origin -> $REPO_URL"
      else
        log "Origin already correct"
      fi
    else
      git remote add origin "$REPO_URL"
      log "Added origin -> $REPO_URL"
    fi
  else
    log "Not inside a git repository; skipping remote checks"
  fi
}

check_gh_auth() {
  if ! has_cmd gh; then
    log "gh not installed; skipping gh auth status check"
    return
  fi

  if gh auth status >/dev/null 2>&1; then
    log "gh auth OK"
  else
    log "gh not authenticated"
    log "Run setup command or provide GH_TOKEN and rerun setup"
    exit 1
  fi
}

probe_github() {
  if has_cmd gh; then
    if ! gh api user >/dev/null 2>&1; then
      log "GitHub API probe failed (possible network/proxy restriction)"
      exit 1
    fi
    log "GitHub API probe OK"
    return
  fi

  # Fallback probe without gh.
  if ! git ls-remote --heads "$REPO_URL" >/dev/null 2>&1; then
    log "git remote probe failed (possible auth/network/proxy issue)"
    exit 1
  fi
  log "git remote probe OK"
}

probe_push_permission() {
  if [[ "$CHECK_PUSH_DRY_RUN" != "1" ]]; then
    log "push dry-run probe disabled (CHECK_PUSH_DRY_RUN=$CHECK_PUSH_DRY_RUN)"
    return
  fi

  if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    log "Not inside a git repository; skipping push dry-run probe"
    return
  fi

  local branch
  branch="$(git rev-parse --abbrev-ref HEAD)"
  if [[ -z "$branch" || "$branch" == "HEAD" ]]; then
    log "Detached HEAD; skipping push dry-run probe"
    return
  fi

  local probe_ref
  probe_ref="refs/heads/${branch}"
  if ! git push --dry-run origin "HEAD:${probe_ref}" >/tmp/codex-push-probe.log 2>&1; then
    log "push dry-run probe failed (write permission likely missing)"
    sanitize_log < /tmp/codex-push-probe.log
    exit 1
  fi
  log "push dry-run probe OK"
}

main() {
  require_cmd git

  ensure_remote
  check_gh_auth
  probe_github
  probe_push_permission

  log "Done"
}

main "$@"
