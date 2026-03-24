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

has_cmd() {
  command -v "$1" >/dev/null 2>&1
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

setup_git_https_auth_without_gh() {
  local token=""

  if [[ -n "${GH_TOKEN:-}" ]]; then
    token="$GH_TOKEN"
  elif [[ -n "${GITHUB_TOKEN:-}" ]]; then
    token="$GITHUB_TOKEN"
  fi

  unset GH_TOKEN || true
  unset GITHUB_TOKEN || true

  if [[ -z "$token" ]]; then
    log "gh not installed and no GH_TOKEN/GITHUB_TOKEN provided"
    log "Cannot configure git auth for GitHub"
    exit 1
  fi

  git config --global credential.helper store

  local cred_file="${HOME}/.git-credentials"
  local tmp_file
  tmp_file="$(mktemp)"

  # Remove any stale github.com credentials to avoid token drift between runs.
  if [[ -f "$cred_file" ]]; then
    grep -v 'github\.com' "$cred_file" > "$tmp_file" || true
  fi
  echo "https://x-access-token:${token}@github.com" >> "$tmp_file"
  mv "$tmp_file" "$cred_file"
  chmod 600 "${HOME}/.git-credentials"
  log "Configured git HTTPS credentials without gh (stale github credentials removed)"
}

main() {
  require_cmd git

  if has_cmd gh; then
    setup_gh_auth
  else
    log "gh not found; using git credential fallback"
    setup_git_https_auth_without_gh
  fi
  setup_remote

  log "Done"
}

main "$@"
