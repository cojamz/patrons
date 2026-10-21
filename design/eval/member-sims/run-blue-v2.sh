#!/bin/bash
# Fair-price sweeps for Blue v2 (Cory's Oct 21 calls: Connoisseur +1, Patroness on bottom-of-pile, Makeover, Regular,
# Critic; Doorman counting swaps; Claude's fill-in counter Jealous Ex). Normal bots, round II fork. Commits each seat count.
cd "$(dirname "$0")/../../.."
CARDS=connoisseur,patroness,makeover,regular,critic,jealousex,doorman
for n in 2 3 4; do
  o=design/eval/member-sims/blue-v2-${n}p
  [ -s $o.json ] && continue
  node scripts/v4-fair-price.mjs sweep $CARDS --seats=$n --table=market,red,echo,thieves --games=300 --free=0 \
    --deltas=-4,-2,0,2,4 --round=2 --workers=3 --out=$o.json > $o.txt 2> $o.log
  git add $o.*; git commit -qm "Sims: Blue v2 concepts, $n seats

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013QvjBSpETkE9ttpXrrjio5"; git push -q origin claude/members-blue-v2
done
