#!/usr/bin/env bash
# Publish one commit as a try build at https://cojamz.github.io/patrons/try/<name>/, beside the live game.
# Usage: bash scripts/v4-try.sh <name> [commit] (defaults to HEAD). Only try/<name>/ changes on main; play/ and the
# old game stay as they are, so a game running on the play link is never interrupted.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
ROOT=$(pwd)
NAME=${1:?usage: v4-try.sh <name> [commit]}
case "$NAME" in *[!a-z0-9-]*|'') echo 'name: lowercase letters, digits and dashes' >&2; exit 2 ;; esac
SHA=$(git rev-parse --verify "${2:-HEAD}^{commit}")
SHORT=${SHA:0:7}
URL=https://cojamz.github.io/patrons/try/$NAME
[ -x "$ROOT/node_modules/.bin/vite" ] || { echo 'Install project dependencies first.' >&2; exit 2; }
TMP=$(mktemp -d "${TMPDIR:-/tmp}/patrons-try.XXXXXX")
WT="$TMP/main"
cleanup() { git worktree remove --force "$WT" >/dev/null 2>&1 || true; rm -rf "$TMP"; }
trap cleanup EXIT

mkdir "$TMP/source"
git archive "$SHA" | tar -x -C "$TMP/source"
ln -s "$ROOT/node_modules" "$TMP/source/node_modules"
echo "Building $SHORT for try/$NAME"
( cd "$TMP/source" && COMMIT_REF="$SHA" "$ROOT/node_modules/.bin/vite" build --base ./ --outDir "$TMP/out" )
printf '{"try":"%s","commit":"%s","builtAt":"%s"}\n' "$NAME" "$SHA" "$(date -u +%FT%TZ)" > "$TMP/out/build.json"

git fetch -q origin '+main:refs/remotes/origin/main'
git worktree add -q --detach "$WT" origin/main
rm -rf "$WT/try/$NAME"; mkdir -p "$WT/try/$NAME"
cp -R "$TMP/out/." "$WT/try/$NAME/"
git -C "$WT" add --all -- "try/$NAME"
git -C "$WT" diff --cached --quiet || git -C "$WT" commit -qm "Try link $NAME: build $SHORT"
for attempt in 1 2 3 4; do
  if git -C "$WT" push -q origin HEAD:main; then break; fi
  [ "$attempt" -lt 4 ] || { echo 'Push failed.' >&2; exit 1; }
  git -C "$WT" fetch -q origin '+main:refs/remotes/origin/main'; git -C "$WT" rebase -q origin/main
done
echo "Pushed; waiting for Pages to serve $URL/"
for _ in $(seq 1 120); do
  if curl -fsSL --max-time 10 "$URL/build.json?t=$SECONDS" 2>/dev/null | grep -q "$SHA"; then echo "Try link live: $URL/ ($SHORT)"; exit 0; fi
  sleep 5
done
echo "Pages did not serve $SHORT at $URL/ within 10 minutes; check main's Pages run." >&2
exit 1
