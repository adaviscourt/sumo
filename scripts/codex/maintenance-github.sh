#!/usr/bin/env bash
set -euo pipefail

REPO_URL_DEFAULT="https://github.com/adaviscourt/sumo.git"
REPO_URL="${REPO_URL:-$REPO_URL_DEFAULT}"

log() {
  printf '[maintenance-github] %s\n' "$*"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log "Missing required command: $1"
    exit 1
  fi
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
  if gh auth status >/dev/null 2>&1; then
    log "gh auth OK"
  else
    log "gh not authenticated"
    log "Run setup command or provide GH_TOKEN and rerun setup"
    exit 1
  fi
}

probe_github() {
  if ! gh api user >/dev/null 2>&1; then
    log "GitHub API probe failed (possible network/proxy restriction)"
    exit 1
  fi
  log "GitHub API probe OK"
}

main() {
  require_cmd git
  require_cmd gh

  ensure_remote
  check_gh_auth
  probe_github

  log "Done"
}

main "$@"
