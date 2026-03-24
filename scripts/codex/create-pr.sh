#!/usr/bin/env bash
set -euo pipefail

OWNER="${GITHUB_OWNER:-adaviscourt}"
REPO="${GITHUB_REPO:-sumo}"
BASE_BRANCH="${BASE_BRANCH:-main}"

log() {
  printf '[create-pr] %s\n' "$*"
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

  # Reuse the configured askpass helper so PR creation works even when
  # GH_TOKEN/GITHUB_TOKEN are not exported in the runtime environment.
  local token=""
  token="$("$askpass" "Password for 'https://github.com':" 2>/dev/null || true)"
  printf '%s' "$token"
}

json_escape() {
  python3 - <<'PY' "$1"
import json,sys
print(json.dumps(sys.argv[1]))
PY
}

main() {
  require_cmd git
  require_cmd curl
  require_cmd python3

  local token
  token="$(token_from_env)"
  if [[ -z "$token" ]]; then
    token="$(token_from_askpass)"
  fi
  if [[ -z "$token" ]]; then
    log "Missing GH_TOKEN/GITHUB_TOKEN and no usable git core.askPass token"
    exit 1
  fi

  local head_branch
  head_branch="$(git rev-parse --abbrev-ref HEAD)"
  if [[ -z "$head_branch" || "$head_branch" == "HEAD" ]]; then
    log "Detached HEAD; cannot determine source branch"
    exit 1
  fi

  local issue_number="${1:-}"
  local title="${PR_TITLE:-}"
  local body="${PR_BODY:-}"

  if [[ -z "$title" ]]; then
    title="Codex changes for ${head_branch}"
  fi

  if [[ -z "$body" ]]; then
    if [[ -n "$issue_number" ]]; then
      body="Closes #${issue_number}"
    else
      body="Automated PR from Codex"
    fi
  fi

  local payload
  payload="$(python3 - <<'PY' "$title" "$head_branch" "$BASE_BRANCH" "$body"
import json,sys
print(json.dumps({
  "title": sys.argv[1],
  "head": sys.argv[2],
  "base": sys.argv[3],
  "body": sys.argv[4],
  "maintainer_can_modify": True,
  "draft": False
}))
PY
)"

  local api_url
  api_url="https://api.github.com/repos/${OWNER}/${REPO}/pulls"

  local response_file status
  response_file="$(mktemp)"
  status="$(curl -sS -o "$response_file" -w '%{http_code}' \
    -X POST "$api_url" \
    -H "Accept: application/vnd.github+json" \
    -H "Authorization: Bearer ${token}" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    -d "$payload")"

  if [[ "$status" == "201" ]]; then
    local url
    url="$(python3 - <<'PY' "$response_file"
import json,sys
with open(sys.argv[1]) as f:
  data=json.load(f)
print(data.get('html_url',''))
PY
)"
    log "PR created: ${url}"
    printf '%s\n' "$url"
    rm -f "$response_file"
    exit 0
  fi

  # 422 often means PR already exists for this head/base.
  if [[ "$status" == "422" ]]; then
    local existing
    existing="$(curl -sS \
      -H "Accept: application/vnd.github+json" \
      -H "Authorization: Bearer ${token}" \
      -H "X-GitHub-Api-Version: 2022-11-28" \
      "https://api.github.com/repos/${OWNER}/${REPO}/pulls?state=open&head=${OWNER}:${head_branch}&base=${BASE_BRANCH}" \
      | python3 - <<'PY'
import json,sys
try:
  data=json.load(sys.stdin)
  if isinstance(data,list) and data:
    print(data[0].get('html_url',''))
except Exception:
  pass
PY
)"
    if [[ -n "$existing" ]]; then
      log "PR already exists: ${existing}"
      printf '%s\n' "$existing"
      rm -f "$response_file"
      exit 0
    fi
  fi

  log "PR creation failed (HTTP ${status})"
  cat "$response_file"
  rm -f "$response_file"
  exit 1
}

main "$@"
