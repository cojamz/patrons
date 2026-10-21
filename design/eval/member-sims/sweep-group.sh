#!/bin/bash
# One group of the 4p sweeps (run-sweep-4p.sh lists them): bash sweep-group.sh <name> [branch to push to]
cd "$(dirname "$0")/../../.."
G=$1; B=${2:-claude/project-thread-ty861h}
line=$(grep "^run $G " design/eval/member-sims/run-sweep-4p.sh); cards=${line#run $G }
D=design/eval/member-sims/sweep-4p; mkdir -p $D
node scripts/v4-fair-price.mjs sweep $cards --seats=4 --table=thieves,red,echo,market --games=300 --free=0 \
  --deltas=-3,0,3 --round=2 --workers=${W:-4} --out=$D/$G.json > $D/$G.txt 2> $D/$G.log
git add $D; git commit -qm "Sims: 4p sweep $G

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01SVddTfgiatH8rVyyjFmx6G"; git push -q origin HEAD:$B
