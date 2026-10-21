#!/bin/bash
# Fair-price sweeps for the live Magenta members that stay as written (Cory's cut pending), at 2, 3 and 4 seats.
# Normal bots, forked at round II, the test seat forced to buy at each price. Deterministic (seeded), so box load
# changes only the wall time.
cd "$(dirname "$0")/../../.."
CARDS=crew,cutpurse,desperado,grifter,bodyguard,doubleagent,stickyfingers,extortionist
for n in 2 3 4; do
  node scripts/v4-fair-price.mjs sweep $CARDS --seats=$n --table=thieves,red,echo,market --games=300 --free=0 \
    --deltas=-4,-2,0,2,4 --round=2 --workers=3 --out=design/eval/member-sims/magenta-live-${n}p.json \
    > design/eval/member-sims/magenta-live-${n}p.txt 2> design/eval/member-sims/magenta-live-${n}p.log
done
