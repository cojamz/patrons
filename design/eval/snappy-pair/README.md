# Snappy pair, 2026-10-25 (UX expert + architecture engineer)

Full reports beside this file: ux-research.md (research with sources, 12 principles, where our bars fall short) and
eng-audit.md (how a move becomes pixels, ranked problems with file:line, measurement gaps). Both were cut short at
Cory's "faster by any means"; the audit is code reading, no probes.

## What "snappy" means (the research, in one breath)
The first visible change after a press is most of what "laggy" means: it should land on the next paint (under 50 ms),
even if the result follows. Input never waits on animation: a press either finishes the show or is held and applied.
Steady frames beat fast ones. Hovers show without a wait and delay the hide instead. Rival turns compress, never hide.

## Shipped (engineering calls)
1. A card you're reading stays open while rivals take their turns (it closed on every rival step, then needed another
   pointer move plus the 200 ms delay). Follower-rate tips no longer remount every step.
2. Not a bug after all: a press on a space while a rival's last step plays already skips the show and places your
   minion. e2e/v4/midchain.mjs now guards it. The click that is lost is on things hidden until the chain drains
   ("Done, no recruit", the shop's lit cards): that's feel call 2 below (S1 in eng-audit.md).

## Built 2026-10-25 evening (Cory said yes to all three feel calls, 8:21pm)
3. Hovers open the moment you point (drawn hidden and placed that frame, shown the next); closing waits 200 ms.
4. Your next choices light as the last piece lands (director.js onChainLanded); settles and the stage's way home finish under them.
5. Rival turns at 0.65 of your timing, beats overlapping; recruits and follower buys keep full time.
6. Pulses, glows and the bought-card ring animate only transform and opacity; playChain finds places up front.

## Built late 2026-10-25 (on the branch; publish after Cory's game)
7. Bots think in a worker (src/v4/session/botWorker.js, botThink.js), local and online host; rng carries its .state so moves match.
8. One frame loop (src/v4/game/clock.js) for the chain clock, holdStack and Tick; flying pieces pooled (flight.js takePiece); composite-keyframes.test.js guards transform/opacity-only keyframes (two named box-shadow exceptions); flight layers contained.

## Next engineering (Claude's, in order)
- Snappy gate: acknowledgment bar (first visible change < 50 ms p95), p95/max, no animation frame over 50 ms at 4x CPU.
- cult-hop (lamp-b.css:256) still animates filter on a member's sprite mid-chain.

## Feel calls (Cory's, all answered yes 2026-10-25)
- Hovers open the moment you point (the 200 ms wait moves to closing). Today a hover takes about 300 ms.
- Your next choices light up as the last piece lands, not after the bounce and the seat's tidy-up (about 0.7 s sooner at
  Steady).
- Rival turns play quicker than your own, beats overlapping, holding only on buys and recruits.
