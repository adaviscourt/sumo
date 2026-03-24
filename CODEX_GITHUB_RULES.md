# Codex GitHub Execution Contract

Use these rules for Codex Cloud tasks in this repository.

## Mandatory startup confirmation
Before doing any implementation work, read this file and include this block in the first response:

- `Loaded CODEX_GITHUB_RULES.md`
- `Version heading:` `# Codex GitHub Execution Contract`
- `Enforced rules:` three bullet points summarizing the branch/push/PR requirements you will follow

If this file cannot be read, stop and report the blocker. Do not proceed with implementation.

## Branch and commit policy
1. Work on the currently checked-out branch unless explicitly instructed to create/switch branches.
2. Do not claim success for commit, push, or PR creation unless verified with commands and included in output.
3. Never report completion for local-only commits.

## Required command sequence before final response
Run and verify in this order:

```bash
git status --short --branch
git rev-parse --abbrev-ref HEAD
git add <files>
git commit -m "<message>"        # only if there are staged changes
git push -u origin <current-branch>  # or git push origin <current-branch>
git ls-remote --heads origin <current-branch>
```

## PR creation policy
1. Preferred: create PR via API/CLI tool.
2. If PR tool fails or returns no URL, treat PR as **not created**.
3. Mandatory fallback URL format:

```text
https://github.com/adaviscourt/sumo/pull/new/<current-branch>
```

4. Do not mark task done without a valid PR URL.

## Required verification block in final response
Include all fields:

- `Branch:` `<name>`
- `Commit:` `<full sha>`
- `Pushed to origin:` `yes/no`
- `git ls-remote output:` `<exact line or exact error>`
- `PR URL:` `<url>`

If any step failed, include exact command + full error output.

## Failure behavior
- If auth/network/policy prevents push or PR creation, stop and report blocker with exact logs.
- Do not fabricate commit IDs, push status, or PR URLs.
