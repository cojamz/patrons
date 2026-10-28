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
  # (untracked files don't count: the status line's .status/ kept a fresh thread on main on Oct 28)
  if [ "$CUR" != "$V4" ] && [ -z "$(git status --porcelain --untracked-files=no)" ] && git merge-base --is-ancestor HEAD origin/main 2>/dev/null; then
    git checkout -q -B "$V4" "origin/$V4" 2>/dev/null && MOVED=1
  fi
  if [ ! -d node_modules ]; then
    npm ci --no-audit --no-fund >/dev/null 2>&1 || npm install --no-audit --no-fund >/dev/null 2>&1
  fi
  # Firefox for the gates and the freeze probe (V4_ENGINE=firefox; Cory plays Firefox on a Mac). The box ships only
  # Chromium, and Playwright's download hosts are often blocked, so a copy lives in the project files (Oct 28).
  FF=/mnt/project-files/harness/browsers/firefox-1509.tgz
  if [ -d /opt/pw-browsers ] && ! ls -d /opt/pw-browsers/firefox-* >/dev/null 2>&1; then
    if [ -f "$FF" ]; then tar -xzf "$FF" -C /opt/pw-browsers 2>/dev/null
    else (PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD= timeout 240 npx playwright install firefox >/dev/null 2>&1 &) ; fi
  fi
fi

[ "${MOVED:-0}" = 1 ] && echo "Checked out $V4 (the v4 game) from a fresh clone of main. Push v4 work there, never to main."
[ -f .claude/hooks/orient.mjs ] && node .claude/hooks/orient.mjs "$SRC" 2>/dev/null
exit 0
