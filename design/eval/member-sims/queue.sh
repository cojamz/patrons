#!/bin/bash
# Overnight sim queue, one sweep at a time, 4 workers. Detached; skips any sweep whose output is already complete,
# so it can simply be started again after a container restart.
run() { # dir name cards table
  local d=$1 name=$2 cards=$3 table=$4
  for n in 2 3 4; do
    local out=$d/design/eval/member-sims/$name-${n}p
    grep -q "^sweep" $out.txt 2>/dev/null && continue
    (cd $d && node scripts/v4-fair-price.mjs sweep $cards --seats=$n --table=$table --games=300 --free=0 \
      --deltas=-4,-2,0,2,4 --round=2 --workers=4 --out=$out.json > $out.txt 2> $out.log)
  done
}
run /home/user/patrons-magenta magenta-concepts robinhood,kingpin,snitch,fence,thieves.crew thieves,red,echo,market
run /home/user/patrons-blue blue-concepts stylist,connoisseur,minimalist,patroness,snob,recluse,shopaholic,windowdresser,plusone,doorman,shoppers market,red,echo,thieves
run /home/user/patrons-guests guests squatter,freelancer,extrahand,frontrunner,straggler,launderer,tiebreaker red,echo,thieves,market
for d in patrons-magenta patrons-blue patrons-guests patrons; do
  f=/home/user/$d/design/eval/member-sims/big-followers-4p.txt
  grep -q "big followers" $f 2>/dev/null || (cd /home/user/$d && node scripts/v4-big-followers.mjs 400 --level=normal --workers=4 --table=thieves,red,echo,market > $f 2>&1)
done
echo done > /home/user/patrons/design/eval/member-sims/queue.done
