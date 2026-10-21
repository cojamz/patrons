#!/bin/bash
# Member balance thread (Oct 21): screen every member at once on the merged engine (v0.8.32 recruit rule + Blue v2 +
# guests + Magenta at 1.5x). 6000 Normal-bot games at 4 seats, Magenta/Red/Green/Blue table, every price jittered ±40%.
# Chunks of 1500 commit as they finish; finished chunks are skipped. Merge: --from=chunk0.json,...
cd "$(dirname "$0")/../../.."
D=design/eval/member-sims/screen-4p
mkdir -p $D
for k in 0 1 2 3; do
  o=$D/chunk$k.json
  [ -s $o.done ] && continue
  node scripts/v4-fair-price.mjs screen --games=1500 --first=$((k * 1500)) --workers=${W:-4} --table=thieves,red,echo,market --raw=$o > $D/chunk$k.txt 2> $D/chunk$k.log && echo ok > $o.done
  git add $D; git commit -qm "Sims: member screen 4p chunk $k (1500 games)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01SVddTfgiatH8rVyyjFmx6G"; git push -q origin claude/project-thread-ty861h
done
