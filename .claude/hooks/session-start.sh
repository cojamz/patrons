#!/bin/bash
# Install deps in fresh cloud containers so tests/builds work.
cd "$CLAUDE_PROJECT_DIR" || exit 0
if [ ! -d node_modules ]; then
  npm ci --no-audit --no-fund >/dev/null 2>&1 || npm install --no-audit --no-fund >/dev/null 2>&1
fi
exit 0
