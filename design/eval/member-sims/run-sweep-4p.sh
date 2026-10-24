#!/bin/bash
# Member balance thread (Oct 21): paired sweeps at 4 seats for every reworked member not yet priced at 1.5x on this
# engine. Normal bots, forked at round II, test seat forced to buy at printed-3, printed, printed+3. 300 seeds.
# The screen (screen-4p/) can't give absolute worth (its price slope is 0.14), so it only cross-checks the order.
# Each group commits when done; finished groups are skipped.
cd "$(dirname "$0")/../../.."
D=design/eval/member-sims/sweep-4p
mkdir -p $D
run() { local name=$1 cards=$2
  grep -q "^sweep" $D/$name.txt 2>/dev/null && return
  node scripts/v4-fair-price.mjs sweep $cards --seats=4 --table=thieves,red,echo,market --games=300 --free=0 \
    --deltas=-3,0,3 --round=2 --workers=${W:-4} --out=$D/$name.json > $D/$name.txt 2> $D/$name.log
  git add $D; git commit -qm "Sims: 4p sweep $name

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01SVddTfgiatH8rVyyjFmx6G"; git push -q origin claude/project-thread-ty861h
}
run blue market.stylist,market.connoisseur,market.patroness,market.snob,market.shopaholic,market.windowdresser,market.plusone,market.doorman,market.makeover,market.regular,market.trendsetter,market.critic
run guests benders.squatter,benders.freelancer,benders.extrahand,benders.frontrunner,benders.straggler,benders.launderer,benders.tiebreaker,thieves.shoplifter
run red red.twins,red.mentor,red.proselytizer,red.mob,red.recruiter,red.host,red.patriarch,red.recruitbonus,red.movementpenalty,red.panel,red.loyalists,red.volunteer
run green echo.agents,echo.bait,echo.chronicler,echo.connector,echo.dejavu,echo.doppel,echo.ensemble,echo.evergreen,echo.hourglass,echo.impostor,echo.muse,echo.tuningfork
