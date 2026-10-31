#!/bin/bash
# First command of every chat thread: chat threads don't run the SessionStart hook (checked Oct 31),
# so this does its job by hand: move to the game's branch, install, print where things stand.
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)" || exit 0
export CLAUDE_PROJECT_DIR=$PWD
echo '{"source":"startup"}' | bash .claude/hooks/bootstrap.sh
rm -f /tmp/cults-presend/rules-seen   # a fresh thread sees every live rule on its first presend
echo
echo "Before every message to Cory: node .claude/hooks/presend.mjs <<'EOF' (the message) EOF. Fix what it says, then send."
