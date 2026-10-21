#!/bin/bash
# Fair-price sweeps for the Magenta concepts on claude/members-magenta (Claude's fill-ins until Cory cuts them):
# Robin Hood ×round, Kingpin per magenta member, Snitch, Fence, plus Magenta's Crew (the live run swept Shift Crew
# by mistake). Normal bots, forked at round II, 2/3/4 seats.
cd "$(dirname "$0")/../../.."
CARDS=robinhood,kingpin,snitch,fence,thieves.crew
for n in 2 3 4; do
  node scripts/v4-fair-price.mjs sweep $CARDS --seats=$n --table=thieves,red,echo,market --games=300 --free=0 \
    --deltas=-4,-2,0,2,4 --round=2 --workers=3 --out=design/eval/member-sims/magenta-concepts-${n}p.json \
    > design/eval/member-sims/magenta-concepts-${n}p.txt 2> design/eval/member-sims/magenta-concepts-${n}p.log
done
