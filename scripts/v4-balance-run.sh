#!/usr/bin/env bash
# Run a balance batch in shards, in parallel, skipping shards already done (safe to re-run after a restart).
# Usage: scripts/v4-balance-run.sh <outdir> <level> <seats> <firstGame> <games> [shard=20] [parallel=4]
# Env passes through to v4-balance.mjs (PRICE, ONLY, MUST, BUDGET). A shard is written to .part, then renamed when whole.
set -euo pipefail
out=$1 level=$2 seats=$3 first=$4 games=$5 shard=${6:-20} par=${7:-4}
mkdir -p "$out"
here=$(cd "$(dirname "$0")" && pwd)
seq "$first" "$shard" $((first + games - 1)) | xargs -P "$par" -I{} bash -c '
  f="$0/'"$level"'-'"$seats"'p-$(printf %05d {}).jsonl"
  [ -s "$f" ] && exit 0
  rm -f "$f.part"
  LEVEL='"$level"' SEATS='"$seats"' node "$1/v4-balance.mjs" {} '"$shard"' "$f.part" && mv "$f.part" "$f"
' "$out" "$here"
echo "done $level ${seats}p $games games -> $out"
