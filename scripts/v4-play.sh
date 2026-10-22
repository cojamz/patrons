#!/usr/bin/env bash
# Publish one checked commit to https://cojamz.github.io/patrons/play/.
# Usage: bash scripts/v4-play.sh [checked-commit] (defaults to HEAD).
# Only play/ and rules/ change on main; the old v3 game stays intact.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
ROOT=$(pwd)
SHA=$(git rev-parse --verify "${1:-HEAD}^{commit}")
SHORT=${SHA:0:7}
REPO=cojamz/patrons
URL=https://cojamz.github.io/patrons/play
WAIT=${V4_PAGES_WAIT_SECONDS:-600}
case "$WAIT" in ''|*[!0-9]*) echo 'V4_PAGES_WAIT_SECONDS must be an integer' >&2; exit 2 ;; esac
for command in git node curl gh; do command -v "$command" >/dev/null || { echo "Missing $command" >&2; exit 2; }; done
[ -x "$ROOT/node_modules/.bin/vite" ] || { echo 'Install project dependencies before publishing.' >&2; exit 2; }
TMP=$(mktemp -d "${TMPDIR:-/tmp}/patrons-play.XXXXXX")
WT="$TMP/main"
cleanup() {
  git worktree remove --force "$WT" >/dev/null 2>&1 || true
  rm -rf "$TMP"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

# Export the immutable commit, so concurrent edits cannot enter this deployment.
mkdir "$TMP/source"
git archive "$SHA" | tar -x -C "$TMP/source"
ln -s "$ROOT/node_modules" "$TMP/source/node_modules"
# A public release number identifies one immutable source; prevent silent reuse.
if ! curl -fsSL --connect-timeout 5 --max-time 10 "$URL/build.json?version-check=$SHA" -o "$TMP/previous-build.json"; then
  # Some boxes can't reach github.io: the published stamp is also main's play/build.json.
  git fetch -q origin main:refs/remotes/origin/main
  git show origin/main:play/build.json > "$TMP/previous-build.json" || echo '{}' > "$TMP/previous-build.json"
  SERVED_UNREACHABLE=1
fi
node --input-type=module - "$TMP/source" "$TMP/previous-build.json" "$SHA" <<'RELEASE_CHECK'
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const [source,previousPath,sha]=process.argv.slice(2);
const {VERSION}=await import(pathToFileURL(`${source}/src/v4/version.js`));
if(!/^v\d+\.\d+\.\d+$/.test(VERSION))throw new Error('Release version must be semantic, for example v0.6.0.');
const notes=readFileSync(`${source}/CHANGELOG.md`,'utf8');
if(!notes.split('\n').some(line=>line.startsWith(`## ${VERSION} `)))throw new Error(`Missing changelog section for ${VERSION}.`);
const previous=JSON.parse(readFileSync(previousPath,'utf8'));
if(previous.version===VERSION && previous.commit!==sha)throw new Error(`${VERSION} is already published from another commit. Bump with npm run version:v4 before checking the next release.`);
RELEASE_CHECK
echo "Building checked commit $SHORT"
( cd "$TMP/source" && COMMIT_REF="$SHA" "$ROOT/node_modules/.bin/vite" build --base ./ --outDir "$TMP/play" )
node --input-type=module - "$TMP/play/build.json" "$SHA" "$TMP/source/src/v4/version.js" <<'MANIFEST'
import {writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const {VERSION}=await import(pathToFileURL(process.argv[4]));
writeFileSync(process.argv[2],JSON.stringify({version:VERSION,commit:process.argv[3],builtAt:new Date().toISOString()})+'\n');
MANIFEST

git fetch -q origin main:refs/remotes/origin/main
git worktree add -q --detach "$WT" origin/main
# Replace only play/ (and rules/ below), including dotfiles, and preserve every other main path.
rm -rf "$WT/play"
mkdir "$WT/play"
cp -R "$TMP/play/." "$WT/play/"
# Pages serves main as plain files: skipping Jekyll makes each publish deploy faster.
[ -f "$WT/.nojekyll" ] || { touch "$WT/.nojekyll"; git -C "$WT" add .nojekyll; }
git -C "$WT" add --all -- play
# The rules page (https://cojamz.github.io/patrons/rules/): this build's rulebook and glossary as a plain page.
if [ -f "$TMP/source/scripts/v4-rules-page.mjs" ]; then
  node "$TMP/source/scripts/v4-rules-page.mjs" "$TMP/rules" "$TMP/source" >/dev/null
  rm -rf "$WT/rules"; mkdir "$WT/rules"; cp -R "$TMP/rules/." "$WT/rules/"
  git -C "$WT" add --all -- rules
fi
# New threads clone main: keep its copy of the harness in step with the shipped commit.
[ -f "$TMP/source/scripts/harness-sync-main.sh" ] && bash "$TMP/source/scripts/harness-sync-main.sh" --into "$TMP/source" "$WT"
if ! git -C "$WT" diff --cached --quiet; then
  git -C "$WT" commit -qm "Play link: build $SHORT"
fi
PUSHED=0
for attempt in 1 2 3 4; do
  if git -C "$WT" push -q origin HEAD:main; then PUSHED=1; break; fi
  [ "$attempt" -lt 4 ] || break
  echo "main advanced; retrying publish ($attempt/4)"
  git -C "$WT" fetch -q origin main:refs/remotes/origin/main
  git -C "$WT" rebase -q origin/main
done
[ "$PUSHED" = 1 ] || { echo 'Publishing failed after four push attempts.' >&2; exit 1; }
MAIN_SHA=$(git -C "$WT" rev-parse HEAD)
echo "Published $SHORT on main ${MAIN_SHA:0:7}; waiting up to ${WAIT}s for Pages"

# The served stamp and HTML are authoritative. Workflow polling supplies early failures,
# using full SHAs and parsed JSON rather than grep against a shortened commit.
DEADLINE=$((SECONDS + WAIT))
while [ "$SECONDS" -le "$DEADLINE" ]; do
  if curl -fsSL --connect-timeout 5 --max-time 10 "$URL/build.json?commit=$SHA&attempt=$SECONDS" -o "$TMP/live-build.json" \
    && node -e 'const fs=require("fs"); try {process.exit(JSON.parse(fs.readFileSync(process.argv[1])).commit===process.argv[2]?0:1)}catch{process.exit(1)}' "$TMP/live-build.json" "$SHA" \
    && curl -fsSL --connect-timeout 5 --max-time 10 "$URL/?commit=$SHA&attempt=$SECONDS" -o "$TMP/live-index.html" \
    && cmp -s "$TMP/play/index.html" "$TMP/live-index.html"; then
    echo "Play link verified live: $SHORT ($URL/)"
    exit 0
  fi
  if node -e 'const r=require("child_process").spawnSync("gh",process.argv.slice(1),{encoding:"utf8",timeout:15000}); if(r.stdout)process.stdout.write(r.stdout);process.exit(r.status??1)' \
    run list -R "$REPO" --branch main --limit 20 --json headSha,name,status,conclusion > "$TMP/runs.json" 2>/dev/null; then
    if ! node -e 'const runs=JSON.parse(require("fs").readFileSync(process.argv[1])); const r=runs.find(r=>r.headSha===process.argv[2]&&/pages/i.test(r.name)); if(r?.status==="completed"&&r.conclusion!=="success"){console.error(`Pages failed: ${r.conclusion}`);process.exit(1)}' "$TMP/runs.json" "$MAIN_SHA"; then exit 1; fi
    # From a box that can't reach github.io, the Pages deployment of main's commit is the proof we can get.
    if [ "${SERVED_UNREACHABLE:-0}" = 1 ] && node -e 'const runs=JSON.parse(require("fs").readFileSync(process.argv[1])); const r=runs.find(r=>r.headSha===process.argv[2]&&/pages/i.test(r.name)); process.exit(r?.status==="completed"&&r.conclusion==="success"?0:1)' "$TMP/runs.json" "$MAIN_SHA"; then
      echo "Pages deployed main ${MAIN_SHA:0:7} (build $SHORT); github.io is unreachable from this box, so the served stamp was not read ($URL/)"
      exit 0
    fi
  fi
  [ "$SECONDS" -lt "$DEADLINE" ] || break
  echo "Waiting for Pages to serve ${SHORT}..."
  sleep "${V4_PAGES_POLL:-5}"
done
echo "Pages did not serve verified build $SHORT within ${WAIT}s. main was pushed; inspect its Pages deployment before retrying." >&2
exit 1
