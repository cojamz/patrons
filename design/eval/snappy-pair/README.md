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
2. A click during an animation does what it points at: the press lands the show and the table catches up before the
   click arrives (it used to skip the show and drop the click, so you clicked twice).

## Next engineering (Claude's, in order)
3. Gate: time from the last landing to your choices lit, and a click 100 ms after a landing applied (catches 2 and 5).
4. Pulses and glows animate only transform and opacity (filter and box-shadow repaint mid-chain): flight.js pulse/press,
   director.js card ring, chip glow.
5. Measure positions once per chain instead of inside animation frames (director.js tug, takeTag, linger, stageOut).
6. Bots think off the main thread (a worker, as previewWorker.js), so a bot's 140-250 ms think never lands mid-spin or
   mid-hover. 5-7h.
7. One animation clock and a reusable layer of flying pieces, with a test that keyframes touch only transform/opacity.
   8-10h.
8. Add an acknowledgment bar (first visible change under 50 ms p95), p95/max instead of averages, and a frame-smoothness
   bar (no animation frame over 50 ms at 4x CPU) to the snappy gate.

## Feel calls (Cory's)
See the thread message; defaults in brackets there.
- Hovers open the moment you point (the 200 ms wait moves to closing). Today a hover takes about 300 ms.
- Your next choices light up as the last piece lands, not after the bounce and the seat's tidy-up (about 0.7 s sooner at
  Steady).
- Rival turns play quicker than your own, beats overlapping, holding only on buys and recruits.
