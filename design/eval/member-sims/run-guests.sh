#!/bin/bash
# Fair-price sweeps for the guests on claude/members-guests: the five live ones (Front-runner at Cory's 5), plus his
# Launderer (simplified for bots: everything into one color) and Tiebreaker. Normal bots, round II fork, 2/3/4 seats.
cd "$(dirname "$0")/../../.."
CARDS=squatter,freelancer,extrahand,frontrunner,straggler,launderer,tiebreaker
for n in 2 3 4; do
  node scripts/v4-fair-price.mjs sweep $CARDS --seats=$n --table=red,echo,thieves,market --games=300 --free=0 \
    --deltas=-4,-2,0,2,4 --round=2 --workers=3 --out=design/eval/member-sims/guests-${n}p.json \
    > design/eval/member-sims/guests-${n}p.txt 2> design/eval/member-sims/guests-${n}p.log
done
