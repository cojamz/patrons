#!/bin/bash
# Screen every member of the candidate deck at once (Magenta, Blue v2, Red, Green, guests): 3000 Normal-bot games at
# 4 seats on the reworked table, every price jittered ±40% each game. Runs in chunks of 600 games that commit as they
# finish; finished chunks are skipped, so the script can be started again. Merge: --from=chunk0.json,chunk1.json,...
cd "$(dirname "$0")/../../.."
D=design/eval/member-sims/screen
mkdir -p $D
for k in 0 1 2 3 4; do
  o=$D/chunk$k.json
  [ -s $o.done ] && continue
  node scripts/v4-fair-price.mjs screen --games=600 --first=$((k * 600)) --workers=${W:-3} --table=thieves,red,echo,market --raw=$o > $D/chunk$k.txt 2> $D/chunk$k.log && touch $o.done
  git add $D; git commit -qm "Sims: member screen chunk $k (600 games)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013QvjBSpETkE9ttpXrrjio5"; git push -q origin claude/members-blue-v2
done
