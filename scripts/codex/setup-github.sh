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

  if env -u GH_TOKEN -u GITHUB_TOKEN gh auth status >/dev/null 2>&1; then
    log "gh already authenticated"
    return
  fi

  if [[ -z "$token" ]]; then
    log "No GH_TOKEN/GITHUB_TOKEN provided; leaving gh unauthenticated"
    log "Set GH_TOKEN with repo scope in Codex Cloud secrets"
    return
  fi

  if ! printf '%s' "$token" | env -u GH_TOKEN -u GITHUB_TOKEN gh auth login --hostname github.com --with-token >/dev/null 2>&1; then
    log "gh auth login failed"
    log "Check token scope (repo) and network access to github.com"
    exit 1
  fi

  if ! env -u GH_TOKEN -u GITHUB_TOKEN gh auth setup-git >/dev/null 2>&1; then
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

  if [[ -z "$token" ]]; then
    log "gh not installed and no GH_TOKEN/GITHUB_TOKEN provided"
    log "Cannot configure git auth for GitHub"
    exit 1
  fi

  # Safer fallback than credential store: use askpass script with restrictive perms.
  local codex_dir askpass_script
  codex_dir="${HOME}/.config/codex"
  askpass_script="${codex_dir}/github-askpass.sh"

  mkdir -p "$codex_dir"
  umask 077
  cat > "$askpass_script" <<EOF_ASKPASS
#!/usr/bin/env bash
case "\${1:-}" in
  *Username*) printf '%s\n' 'x-access-token' ;;
  *Password*) printf '%s\n' '$token' ;;
  *) printf '%s\n' '' ;;
esac
EOF_ASKPASS
  chmod 700 "$askpass_script"

  # Remove previous credential-store config if present.
  git config --global --unset-all credential.helper >/dev/null 2>&1 || true
  git config --global --unset-all credential.useHttpPath >/dev/null 2>&1 || true
  git config --global --unset core.askPass >/dev/null 2>&1 || true

  git config --global core.askPass "$askpass_script"

  # Remove stale plaintext store file if it exists from older runs.
  rm -f "${HOME}/.git-credentials"

  log "Configured git HTTPS auth fallback without plaintext credential store"
}

main() {
  require_cmd git

  if has_cmd gh; then
    setup_gh_auth
  else
    log "gh not found; using git auth fallback"
    setup_git_https_auth_without_gh
  fi
  setup_remote

  log "Done"
}

main "$@"
