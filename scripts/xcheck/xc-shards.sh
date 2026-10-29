#!/usr/bin/env bash
# Sharded, resumable runs of xc-run.mjs. Usage: xc-shards.sh <outdir> <policy> <seats> <first> <games> [shard] [par]
# Env passes through (PRICE, SALT).
set -euo pipefail
out=$1 pol=$2 seats=$3 first=$4 games=$5 shard=${6:-25} par=${7:-4}
mkdir -p "$out"; here=$(cd "$(dirname "$0")" && pwd)
seq "$first" "$shard" $((first + games - 1)) | xargs -P "$par" -I{} bash -c '
  f="$0/'"$pol"'-'"$seats"'p-$(printf %05d {}).jsonl"; [ -s "$f" ] && exit 0; rm -f "$f.part"
  POLICY='"$pol"' SEATS='"$seats"' node "$1/xc-run.mjs" {} '"$shard"' "$f.part" && mv "$f.part" "$f"' "$out" "$here"
echo "done $pol ${seats}p $games -> $out"
