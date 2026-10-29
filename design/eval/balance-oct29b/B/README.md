# Balance run B (Oct 29, v0.9.882)

Build: 2f9c602639774c06b251a67b14bf8b1c78439f0f (v0.9.882, includes the Launderers any-mix rule), run from a git archive of that sha.
Method: design/eval/balance-oct29/README.md, `scripts/v4-balance-run.sh <out> <level> 4 <first> <games>`.

- Normal bots, 4 players: 2,000 games, seeds 41001-43000 (shard 20). No stuck games.
- Hard bots, 4 players: 240 games, seeds 41001-41240 (shard 10). 41001-41190 here; 41191-41240 run by runner A
  on the same build, in /mnt/project-files/balance-oct29b/raw/B-split/.
- Every 5th game one seat only buys followers; those games count only toward that seat's win rate.

Raw: /mnt/project-files/balance-oct29b/raw/B/ (and raw-B.tgz beside this file, runner B's own games).
