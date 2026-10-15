#!/bin/sh
# Interleaved real-time runs of pace.mjs on the before and after production builds (same seed, same driver), so the
# box's load lands on both alike. Usage: sh compare.sh <before url> <after url> <outdir> [secs] [cpu]
B="$1"; A="$2"; O="$3"; S="${4:-90}"; C="${5:-1}"
D=$(dirname "$0")
mkdir -p "$O"
for rep in 1 2; do
  for sp in steady relaxed; do
    for w in before after; do
      if [ "$w" = before ]; then U="$B"; else U="$A"; fi
      echo "== $w $sp rep$rep cpu$C load $(cut -d' ' -f1 /proc/loadavg)"
      timeout 400 node "$D/pace.mjs" "$U" "$sp" "$O/$w-$sp-cpu$C-rep$rep.json" --secs="$S" --cpu="$C"
    done
  done
done
