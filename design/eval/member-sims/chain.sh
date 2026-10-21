#!/bin/bash
# Sweeps one at a time, each seat count committed and pushed to its branch as soon as it finishes; finished ones are
# skipped, so this can be started again after a restart or a timeout.
step() { # dir branch name cards table
  local d=$1 b=$2 name=$3 cards=$4 table=$5
  for n in 2 3 4; do
    local o=design/eval/member-sims/$name-${n}p
    (cd $d; grep -q "^sweep" $o.txt 2>/dev/null && continue
     node scripts/v4-fair-price.mjs sweep $cards --seats=$n --table=$table --games=300 --free=0 --deltas=-4,-2,0,2,4 \
       --round=2 --workers=4 --out=$o.json > $o.txt 2> $o.log
     git add $o.*; git commit -qm "Sims: $name, $n seats

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013QvjBSpETkE9ttpXrrjio5"; git push -q origin $b)
  done
}
while pgrep -f "sweep robinhood|v4-fair-price.mjs sweep stylist" >/dev/null && [ "$(pgrep -fc "v4-fair-price.mjs sweep")" -ge 2 ]; do sleep 30; done
# was: while pgrep -f "sweep robinhood" >/dev/null; do sleep 30; done
step /home/user/patrons-guests claude/members-guests guests squatter,freelancer,extrahand,frontrunner,straggler,launderer,tiebreaker red,echo,thieves,market
