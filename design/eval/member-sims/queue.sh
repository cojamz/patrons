#!/bin/bash
# Overnight sim queue, one sweep at a time (3 workers on a 4-CPU box). Detached so it outlives the shell.
while pgrep -f run-magenta-live.sh >/dev/null; do sleep 60; done
bash /home/user/patrons-magenta/design/eval/member-sims/run-magenta-concepts.sh
bash /home/user/patrons-blue/design/eval/member-sims/run-blue-concepts.sh
bash /home/user/patrons-guests/design/eval/member-sims/run-guests.sh
for b in magenta blue guests; do
  (cd /home/user/patrons-$b && node scripts/v4-big-followers.mjs 400 --level=normal --workers=3 --table=thieves,red,echo,market > design/eval/member-sims/big-followers-4p.txt 2>&1)
done
(cd /home/user/patrons && node scripts/v4-big-followers.mjs 400 --level=normal --workers=3 --table=thieves,red,echo,market > design/eval/member-sims/big-followers-live-4p.txt 2>&1)
echo done > /home/user/patrons/design/eval/member-sims/queue.done
