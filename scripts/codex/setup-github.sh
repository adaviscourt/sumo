#!/usr/bin/env bash
set -euo pipefail

REPO_URL_DEFAULT="https://github.com/adaviscourt/sumo.git"
REPO_URL="${REPO_URL:-$REPO_URL_DEFAULT}"

log() {
  printf '[setup-github] %s\n' "$*"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log "Missing required command: $1"
    exit 1
  fi
}

setup_remote() {
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    if git remote get-url origin >/dev/null 2>&1; then
      git remote set-url origin "$REPO_URL"
      log "Updated origin -> $REPO_URL"
    else
      git remote add origin "$REPO_URL"
      log "Added origin -> $REPO_URL"
    fi
  else
    log "Not inside a git repository; skipping remote setup"
  fi
}

setup_gh_auth() {
  local token=""

  if [[ -n "${GH_TOKEN:-}" ]]; then
    token="$GH_TOKEN"
  elif [[ -n "${GITHUB_TOKEN:-}" ]]; then
    token="$GITHUB_TOKEN"
  fi

  # Avoid accidental reliance on inherited env token behavior.
  unset GH_TOKEN || true
  unset GITHUB_TOKEN || true

  if gh auth status >/dev/null 2>&1; then
    log "gh already authenticated"
    return
  fi

  if [[ -z "$token" ]]; then
    log "No GH_TOKEN/GITHUB_TOKEN provided; leaving gh unauthenticated"
    log "Set GH_TOKEN with repo scope in Codex Cloud secrets"
    return
  fi

  if ! printf '%s' "$token" | gh auth login --hostname github.com --with-token >/dev/null 2>&1; then
    log "gh auth login failed"
    log "Check token scope (repo) and network access to github.com"
    exit 1
  fi

  if ! gh auth setup-git >/dev/null 2>&1; then
    log "gh auth setup-git failed"
    exit 1
  fi

  log "Authenticated gh and configured git credential helper"
}

main() {
  require_cmd git
  require_cmd gh

  setup_gh_auth
  setup_remote

  log "Done"
}

main "$@"
