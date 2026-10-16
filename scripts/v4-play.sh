#!/usr/bin/env bash
# Refresh the play link (https://cojamz.github.io/patrons/play/): build the current HEAD with a relative base and
# publish it as play/ on main (GitHub Pages serves main). Run after pushing a quick-green head to
# claude/gifted-newton-3lcy3i. Usage: bash scripts/v4-play.sh
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
H=$(git rev-parse --short HEAD)
OUT=$(mktemp -d)/play
npx vite build --base ./ --outDir "$OUT" >/dev/null
git fetch -q origin main
WT=$(mktemp -d)/main
git worktree add -q --detach "$WT" origin/main
( cd "$WT" && git rm -rq play && mkdir play && cp -r "$OUT"/* play/ && git add play \
  && git commit -qm "Play link: build $H" && for i in 1 2 3 4; do git push -q origin HEAD:main && break || { git fetch -q origin main; git rebase -q origin/main; }; done )
M=$(git -C "$WT" rev-parse --short HEAD)
git worktree remove --force "$WT"
find "$(dirname "$OUT")" -delete
echo "play link: build $H on main $M; waiting for Pages"
until gh run list -R cojamz/patrons --limit 5 --json headSha,conclusion | grep -A1 "$M" | grep -q success; do sleep 10; done
echo "play link live: $H"
