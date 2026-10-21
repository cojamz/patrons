#!/bin/bash
# SessionStart: put a fresh thread on the v4 branch, install deps, and print a short orientation.
# The same file lives on main (mirrored by scripts/harness-sync-main.sh), because cloud threads start on main.
cd "$CLAUDE_PROJECT_DIR" || exit 0
INPUT=$(cat)
SID=$(echo "$INPUT" | jq -r '.session_id // empty' 2>/dev/null)
SRC=$(echo "$INPUT" | jq -r '.source // "startup"' 2>/dev/null)
V4=claude/gifted-newton-3lcy3i
[ -n "$CLAUDE_ENV_FILE" ] && [ -n "$SID" ] && echo "export CULTS_SESSION=$SID" >> "$CLAUDE_ENV_FILE"

if [ "$SRC" = startup ] || [ "$SRC" = resume ]; then
  for i in 1 2 3; do git fetch -q origin "$V4" main 2>/dev/null && break; sleep $((i * 2)); done
  CUR=$(git rev-parse --abbrev-ref HEAD)
  # A fresh clone (nothing of our own on HEAD, clean tree) moves to the v4 line of work.
  if [ "$CUR" != "$V4" ] && [ -z "$(git status --porcelain)" ] && git merge-base --is-ancestor HEAD origin/main 2>/dev/null; then
    git checkout -q -B "$V4" "origin/$V4" 2>/dev/null && MOVED=1
  fi
  if [ ! -d node_modules ]; then
    npm ci --no-audit --no-fund >/dev/null 2>&1 || npm install --no-audit --no-fund >/dev/null 2>&1
  fi
fi

[ "${MOVED:-0}" = 1 ] && echo "Checked out $V4 (the v4 game) from a fresh clone of main. Push v4 work there, never to main."
[ -f .claude/hooks/orient.mjs ] && node .claude/hooks/orient.mjs "$SRC" 2>/dev/null
exit 0
