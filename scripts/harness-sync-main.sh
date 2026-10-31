#!/usr/bin/env bash
# Mirror the harness (CLAUDE.md, AGENTS.md, .claude/ settings, hooks, rules, skills, agents, output style) onto main.
# Cloud threads clone main, so this is what every new thread loads at start.
# Usage: bash scripts/harness-sync-main.sh [commit]          standalone: commits and pushes to main
#        bash scripts/harness-sync-main.sh --into <src> <wt>  used by v4-play.sh inside its main worktree
set -euo pipefail
PARTS=(CLAUDE.md AGENTS.md .claude/settings.json .claude/hooks .claude/rules .claude/skills .claude/agents .claude/output-styles)

mirror() { # $1 source tree, $2 main worktree
  local src=$1 wt=$2
  # Once: main's own v3 rules and skills would auto-load into every thread; keep them, out of the way.
  if [ -f "$wt/.claude/rules/game-rules.md" ]; then
    mkdir -p "$wt/archive/v3-claude"
    git -C "$wt" mv .claude/rules/game-rules.md archive/v3-claude/game-rules.md
    for s in discard experiment ship; do [ -d "$wt/.claude/skills/$s" ] && git -C "$wt" mv ".claude/skills/$s" "archive/v3-claude/skill-$s"; done
    [ -f "$wt/CLAUDE.md" ] && cp "$wt/CLAUDE.md" "$wt/archive/v3-claude/CLAUDE-v3.md"
  fi
  for p in "${PARTS[@]}"; do
    [ -e "$src/$p" ] || continue
    rm -rf "${wt:?}/$p"; mkdir -p "$(dirname "$wt/$p")"; cp -R "$src/$p" "$wt/$p"
  done
  [ -f "$wt/.nojekyll" ] || touch "$wt/.nojekyll"   # Pages skips Jekyll: faster deploys
  git -C "$wt" add -- .nojekyll
  git -C "$wt" add --all -- "${PARTS[@]}" archive/v3-claude 2>/dev/null || git -C "$wt" add --all -- "${PARTS[@]}"
}

if [ "${1:-}" = --into ]; then mirror "$2" "$3"; exit 0; fi

cd "$(git rev-parse --show-toplevel)"
SHA=$(git rev-parse --verify "${1:-HEAD}^{commit}")
TMP=$(mktemp -d "${TMPDIR:-/tmp}/harness-sync.XXXXXX")
trap 'git worktree remove --force "$TMP/main" >/dev/null 2>&1 || true; rm -rf "$TMP"' EXIT
mkdir "$TMP/src"; git archive "$SHA" -- "${PARTS[@]}" | tar -x -C "$TMP/src"
git fetch -q origin '+main:refs/remotes/origin/main'  # forced: a diverged local copy refused a plain fetch (Oct 22)
git worktree add -q --detach "$TMP/main" origin/main
mirror "$TMP/src" "$TMP/main"
if git -C "$TMP/main" diff --cached --quiet; then echo "main's harness already matches ${SHA:0:7}"; exit 0; fi
git -C "$TMP/main" commit -qm "Harness mirror from v4 ${SHA:0:7} (no game changes)"
for attempt in 1 2 3 4; do
  git -C "$TMP/main" push -q origin HEAD:main && { echo "main's harness now mirrors ${SHA:0:7}"; exit 0; }
  sleep $((attempt * 2)); git -C "$TMP/main" fetch -q origin main:refs/remotes/origin/main; git -C "$TMP/main" rebase -q origin/main
done
echo 'Harness mirror push failed after four attempts.' >&2; exit 1
