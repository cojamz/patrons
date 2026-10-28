# Firefox spin and whole game (Oct 28, freeze thread)

Playwright Firefox 146, headless, this box's speed (no CPU throttle in Firefox). scripts/v4-spin.mjs --firefox.

- 1270x700: v0.9.3 35 frames per 700 ms, worst gap median 151 ms; v0.9.6 (filters rest while turning) 42 frames, 49 ms.
- 1512x945 at 2x (a 14-inch Mac): v0.9.3 31 frames, worst gap 217 ms; v0.9.6 37 frames, 116 ms.
- Frame by frame (--frames): the spin itself paints at 60 fps; the worst gap is one 80-150 ms frame about 350 ms after the key, where the spin lands and the board re-lays.
- Hiding the whole stage takes the gap to 17 ms; hiding any one layer of it (paper, rim, sockets, hub) doesn't, so it is the landing redraw as a whole.
- Through a whole game (spins on every one of your turns, rounds I-III): the first spin of a turn has 2-5 slow frames (worst 100-200 ms), the second almost none. Nothing near Cory's "0.5 frames per second".
- Whole game with a press every 250 ms (freeze-ff-v093.md, freeze-ff-live.md): no press waited over 100 ms in either build; frame gaps over 50 ms add to about 125 s of a 9 minute game in both.

Reading: headless Firefox on this box does not reproduce what Cory sees on his Mac. Next is a profile from his own Firefox.
