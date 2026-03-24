#!/usr/bin/env bash
set -euo pipefail

OWNER="${GITHUB_OWNER:-adaviscourt}"
REPO="${GITHUB_REPO:-sumo}"

log() {
  printf '[checkout-pr-branch] %s\n' "$*"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log "Missing required command: $1"
    exit 1
  fi
}

token_from_env() {
  if [[ -n "${GH_TOKEN:-}" ]]; then
    printf '%s' "$GH_TOKEN"
    return
  fi
  if [[ -n "${GITHUB_TOKEN:-}" ]]; then
    printf '%s' "$GITHUB_TOKEN"
    return
  fi
  printf ''
}

token_from_askpass() {
  local askpass=""
  askpass="$(git config --global --get core.askPass 2>/dev/null || true)"
  if [[ -z "$askpass" || ! -x "$askpass" ]]; then
    printf ''
    return
  fi

  local token=""
  token="$("$askpass" "Password for 'https://github.com':" 2>/dev/null || true)"
  printf '%s' "$token"
}

main() {
  require_cmd git
  require_cmd curl
  require_cmd python3

  local pr_number="${1:-}"
  if [[ -z "$pr_number" ]]; then
    log "Usage: bash scripts/codex/checkout-pr-branch.sh <pr_number>"
    exit 1
  fi

  if ! [[ "$pr_number" =~ ^[0-9]+$ ]]; then
    log "PR number must be numeric"
    exit 1
  fi

  local token
  token="$(token_from_env)"
  if [[ -z "$token" ]]; then
    token="$(token_from_askpass)"
  fi
  if [[ -z "$token" ]]; then
    log "Missing GH_TOKEN/GITHUB_TOKEN and no usable git core.askPass token"
    exit 1
  fi

  local api_url response_file status
  api_url="https://api.github.com/repos/${OWNER}/${REPO}/pulls/${pr_number}"
  response_file="$(mktemp)"

  status="$(curl -sS -o "$response_file" -w '%{http_code}' \
    -H "Accept: application/vnd.github+json" \
    -H "Authorization: Bearer ${token}" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "$api_url")"

  if [[ "$status" != "200" ]]; then
    log "Failed to fetch PR metadata (HTTP ${status})"
    cat "$response_file"
    rm -f "$response_file"
    exit 1
  fi

  local head_ref head_repo_full base_repo_full
  head_ref="$(python3 - <<'PY' "$response_file"
import json,sys
with open(sys.argv[1]) as f:
  data=json.load(f)
print(data['head']['ref'])
PY
)"

  head_repo_full="$(python3 - <<'PY' "$response_file"
import json,sys
with open(sys.argv[1]) as f:
  data=json.load(f)
print(data['head']['repo']['full_name'])
PY
)"

  base_repo_full="$(python3 - <<'PY' "$response_file"
import json,sys
with open(sys.argv[1]) as f:
  data=json.load(f)
print(data['base']['repo']['full_name'])
PY
)"

  rm -f "$response_file"

  if [[ "$head_repo_full" != "$base_repo_full" ]]; then
    log "PR head repo is a fork (${head_repo_full}); refusing automatic push branch checkout"
    log "Base repo: ${base_repo_full}"
    exit 1
  fi

  if ! git remote get-url origin >/dev/null 2>&1; then
    log "Missing git remote 'origin'"
    exit 1
  fi

  log "Target PR #${pr_number} head branch: ${head_ref}"

  if git show-ref --verify --quiet "refs/remotes/origin/${head_ref}"; then
    git fetch origin "$head_ref" --quiet
  else
    git fetch origin "$head_ref:refs/remotes/origin/${head_ref}" --quiet
  fi

  if git show-ref --verify --quiet "refs/heads/${head_ref}"; then
    git switch "$head_ref" >/dev/null
  else
    git switch -c "$head_ref" --track "origin/${head_ref}" >/dev/null
  fi

  git branch --set-upstream-to "origin/${head_ref}" "$head_ref" >/dev/null 2>&1 || true

  local current
  current="$(git rev-parse --abbrev-ref HEAD)"
  if [[ "$current" != "$head_ref" ]]; then
    log "Failed to switch to PR branch; current=${current}, expected=${head_ref}"
    exit 1
  fi

  log "Checked out PR branch: ${current}"
  git status --short --branch
}

main "$@"
