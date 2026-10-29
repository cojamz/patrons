#!/usr/bin/env bash
# Fast lane for a small, already-committed screen or wording change: check what it touches, bump, publish.
# Usage: bash scripts/v4-ship-ui.sh "One plain line for the changelog" src/v4/game/ShopCards.jsx [more files…]
# Runs the unit tests related to those files plus the build (no browser games), bumps the patch version,
# pushes and publishes. Take your own screenshot of the change before telling Cory. Prints each step's time.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
NOTE=${1:?Usage: v4-ship-ui.sh "changelog line" <changed files…>}; shift
[ $# -gt 0 ] || { echo 'Name the changed files, so only their tests run.' >&2; exit 2; }
BRANCH=claude/gifted-newton-3lcy3i
[ "$(git rev-parse --abbrev-ref HEAD)" = "$BRANCH" ] || { echo "Ship from $BRANCH." >&2; exit 2; }
[ -z "$(git status --porcelain -- src)" ] || { echo 'Commit the change under src/ first.' >&2; exit 2; }
T0=$SECONDS; t() { echo "[$(( SECONDS - T0 ))s] $*"; }

t "pull"; git pull -q --rebase origin "$BRANCH"
t "check: related tests + build"
FILES=$(IFS=,; echo "$*")
V4_QUICK_E2E=none V4_OUTDIR=.v4-build-ship V4_PORT=${V4_PORT:-5299} npm run -s check:v4:quick -- --related "$FILES" | tail -4
t "version"; npm run -s version:v4 -- patch "$NOTE"
git add src/v4/version.js CHANGELOG.md
git commit -qm "Release $(node -p "require('fs').readFileSync('src/v4/version.js','utf8').match(/v[\d.]+/)[0]"): $NOTE"
# other threads push during the ~4 min check: take their work again before pushing (a version clash stops here)
t "push"; git pull -q --rebase origin "$BRANCH" && git push -q origin "HEAD:$BRANCH"
t "publish"; V4_PAGES_POLL=${V4_PAGES_POLL:-5} bash scripts/v4-play.sh HEAD
t "live"
