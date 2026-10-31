# Firefox spin and whole game (Oct 28, freeze thread)

Playwright Firefox 146, headless, this box's speed (no CPU throttle in Firefox). scripts/v4-spin.mjs --firefox.

- 1270x700: v0.9.3 35 frames per 700 ms, worst gap median 151 ms; v0.9.6 (filters rest while turning) 42 frames, 49 ms.
- 1512x945 at 2x (a 14-inch Mac): v0.9.3 31 frames, worst gap 217 ms; v0.9.6 37 frames, 116 ms.
- Frame by frame (--frames): the spin itself paints at 60 fps; the worst gap is one 80-150 ms frame about 350 ms after the key, where the spin lands and the board re-lays.
- Hiding the whole stage takes the gap to 17 ms; hiding any one layer of it (paper, rim, sockets, hub) doesn't, so it is the landing redraw as a whole.
- Through a whole game (spins on every one of your turns, rounds I-III): the first spin of a turn has 2-5 slow frames (worst 100-200 ms), the second almost none. Nothing near Cory's "0.5 frames per second".
- Whole game with a press every 250 ms (freeze-ff-v093.md, freeze-ff-live.md): no press waited over 100 ms in either build; frame gaps over 50 ms add to about 125 s of a 9 minute game in both.

Reading: headless Firefox on this box does not reproduce what Cory sees on his Mac. Next is a profile from his own Firefox.

## Oct 29: the landing repaint (v0.9.831)
- Firefox profile (MOZ_PROFILER_STARTUP in firefox.launch env) on slowed Firefox: the page's thread idle, the compositor's CONTENT_FULL_PAINT_TIME up to 1081 ms right after a landing. Hiding the paper drawing (--css) took the worst gap from 884 to 116 ms; hiding the spaces only to 466.
- Cause: the landed angle was written into the SVG (rotate on its groups), so the whole board was re-rasterized. Fix: the layers keep the angle as a CSS rotate at rest; the drawings never carry it.
- Slowed Firefox, a press every 1.2 s: worst gap 750-884 ms before, 117-249 ms after. Full speed: worst 500 before, ~170-200 after (one per game).
- Left: one ~180 ms full paint the first time the rims' words flip upright (hiding the rim words removes it). The words on their own layer: no change (117/167 vs 117/167 ms), dropped. Glyphs at a new turn seem to be the cost.
- Headless Firefox here renders WebRender in software, so the compositor costs overstate a Mac's GPU; the landing repaint was real on both (blob images raster on the CPU).
