#!/bin/bash
# Log Cory's correction of how Claude works into the shared list (chat threads don't run the hook that does this).
# Usage: bash .claude/hooks/correction.sh "his exact words"
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)" || exit 0
Q=$(printf '%s' "$1" | sed 's/</\&lt;/g')
jq -n --arg p "<message from=\"human\" trust=\"principal\">$Q</message>" '{prompt:$p}' | CLAUDE_PROJECT_DIR=$PWD node .claude/hooks/corrections.mjs
