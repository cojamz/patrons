#!/bin/bash
# Fair-price sweeps for Blue members on claude/members-blue (new cards are Claude's fill-ins until Cory cuts them):
# the six kept cards plus Shopaholic, Window Dresser, Plus-One, Doorman, Window Shoppers. Normal bots, round II fork.
cd "$(dirname "$0")/../../.."
CARDS=stylist,connoisseur,minimalist,patroness,snob,recluse,shopaholic,windowdresser,plusone,doorman,shoppers
for n in 2 3 4; do
  node scripts/v4-fair-price.mjs sweep $CARDS --seats=$n --table=market,red,echo,thieves --games=300 --free=0 \
    --deltas=-4,-2,0,2,4 --round=2 --workers=3 --out=design/eval/member-sims/blue-concepts-${n}p.json \
    > design/eval/member-sims/blue-concepts-${n}p.txt 2> design/eval/member-sims/blue-concepts-${n}p.log
done
