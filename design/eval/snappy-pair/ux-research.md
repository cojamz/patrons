# Cults: what makes it feel responsive (UX research brief)

Note on sources: secondary summaries are marked (secondary). Some game-studio claims (Balatro, Slay the Spire, BGA, Hearthstone) come from player forums, not developer statements.

## 1. Research in short

### Latency thresholds
- **0.1 s / 1 s / 10 s** (Miller 1968; Card, Moran and Newell; Nielsen). Under 0.1 s feels like the object answered you directly. Under 1 s keeps your train of thought. https://www.nngroup.com/articles/response-times-3-important-limits/
- **Model Human Processor**: perceptual cycle is about 100 ms (50 to 200 ms range). Events closer together than that fuse into one cause and effect. https://en.wikipedia.org/wiki/Human_processor_model
- **RAIL** (Google): visible response under 100 ms, so handlers get 50 ms. Animation frames get 10 ms of app work. Idle work goes in chunks of 50 ms or less. https://web.dev/articles/rail
- **INP**: 200 ms or less counts as "good" for interaction to next paint. That is a pass mark for the web, not a target for a game. https://web.dev/articles/inp
- **Doherty threshold**: productivity jumps when the system answers within 400 ms (Doherty and Thadani, IBM 1982) (secondary). https://lawsofux.com/doherty-threshold/
- **Direct manipulation**: Ng et al. found people notice drag latency down to about 6 ms. Jota et al. (CHI 2013) found performance drops above about 25 ms of drag latency. Deber et al. (CHI 2015) measured just-noticeable differences of 11 ms for dragging and 69 ms for tapping, and found an 8.3 ms improvement is noticeable. https://webdocs.cs.ualberta.ca/~wfb/publications/C-2014-SIGCHI-Latency.pdf
- **Button feedback** (Kaaresoja and Brewster): rated quality drops between 100 and 150 ms for visual feedback, and between 70 and 100 ms for audio. Audio feels simultaneous at about 19 ms and visual at about 32 ms. Steady delays beat jittery ones: a fixed 18 ms with low variation was faster and gave fewer errors. Longer delays make a button feel heavier. https://theses.gla.ac.uk/7075 , https://eprints.gla.ac.uk/104653
- **Games**: the median player stops noticing motor-to-visual delay somewhere around 51 to 90 ms, and some players notice under 40 ms (Raaen, Eg and Griwodz 2014). On average people notice about 200 ms on a click-and-watch task (Raaen and Petlund 2015). https://www.simula.no/research/can-gamers-detect-cloud-delay-0 , https://www.simula.no/publications/how-much-delay-there-really-current-games
- **Two latencies, not one.** *Acknowledgment latency* is the time from input to the first pixel showing the system heard you (press state, highlight). *Completion latency* is the time until the result is fully shown. Players judge "laggy" mostly on acknowledgment and on steadiness. They forgive a longer completion if something happens at once and keeps moving. Apple puts it as "highlight on touch-down, confirm on touch-up". https://developer.apple.com/videos/play/wwdc2018/803/

### Game feel and juice
- **Swink, *Game Feel***: game feel is real-time control (a correction cycle under 100 ms) with "polish", meaning animation, sound and effects in harmony with input-driven motion. https://en.wikipedia.org/wiki/Game_feel
- **Jonasson and Purho, "Juice It or Lose It"** (GDC Europe 2012): the same Breakout becomes fun through tweens, squash and stretch, sound and particles that answer every input. Juice is feedback on input, not cutscenes. https://www.gamedeveloper.com/design/video-is-your-game-juicy-enough-
- **Nijman (Vlambeer), "The Art of Screenshake"**: dozens of tiny layered responses per action (kick, flash, shake, sound). Each is short, and together they read as weight. https://infovore.org/?p=5275 (Kelly's "Don't Juice It or Lose It" is the counterweight: juice that hides the game state hurts.)
- **Digital card and board games**:
  - Balatro has a game-speed multiplier, and players asked for faster than its top setting. The complaint is that it doesn't scale every animation. https://steamcommunity.com/app/2379780/discussions/0/4346606879508270539
  - Slay the Spire's Fast Mode noticeably shortens animations. A popular mod speeds up only the animations that bottleneck play and leaves flavor animations alone. https://github.com/houeland/SuperFastMode
  - BGA has a per-game "animation time" slider (forum). https://forum.boardgamearena.com/viewtopic.php?p=180546
  - In Hearthstone, animation queues ate into the opponent's turn, and Blizzard fixed Shudderwock by doubling its animation speed. Animation length is a real cost that players feel and exploit. https://us.forums.blizzard.com/en/hearthstone/t/abuse-of-animations/108732
- **Input buffering** (fighting games, Smash): store input made during an animation and run it when legal, about 10 frames in Brawl. Over-buffering of repeated taps causes unwanted actions. Buffer one intent, not a queue of clicks. https://www.ssbwiki.com/Buffer , https://dgmiwiki.wpi.edu/mechanic/input_buffer

### Motion that explains
- **Material**: scale duration by distance and size. Mobile is typically about 300 ms, entering about 225 ms, leaving about 195 ms, and transitions over 400 ms feel slow. Use decelerate easing on entry and accelerate on exit (secondary for M3 tokens). https://m1.material.io/motion/duration-easing.html
- **Apple, "Designing Fluid Interfaces"** (WWDC18): interfaces are responsive, interruptible and redirectable. New input is accepted mid-animation. Motion starts from the current on-screen value and carries velocity (springs). Avoid timers for detecting intent. https://developer.apple.com/videos/play/wwdc2018/803/
- **UX in Motion (Willenskomer)**: motion is behavior, not ornament. "Offset and delay" (stagger) separates simultaneous moves so each reads as distinct. "Parenting" ties the motion of children to their source. https://uxmag.com/articles/creating-usability-with-motion-the-ux-in-motion-manifesto
- **Disney principles applied to UI**: anticipation (a tiny wind-up on the source), staging (one thing in focus), follow-through (a small settle on arrival), slow in and slow out. https://blog.adobe.com/en/publish/2016/11/08/redesigning-the-12-principles-of-animation-for-motion-design
- **Optimistic UI**: show the result the moment it is known locally, and reconcile later. For a deterministic local engine, the result is known at click time, so nothing should wait on anything.

### Perceived-performance tricks
- Press state in the same frame. Animate from the click point (cause visibly connects to effect).
- No layout shift on hover cards: reserve space and pre-render.
- Pre-warm on hover intent. Amazon's "menu-aim" uses cursor direction instead of a fixed delay, and NN/g recommends a short delay before hiding, not before showing. https://www.nngroup.com/articles/timing-exposing-content
- Sound: audio feels simultaneous at about 19 ms and gives a strong "it happened" signal, so a click sound at input time masks visual completion latency (Kaaresoja).
- Frame pacing: steadiness beats average fps. Variable frame timing lowers perceived smoothness (https://ar5iv.labs.arxiv.org/html/2306.01691). A practitioner rule of thumb is that 10 to 20 ms swings read as micro-stutter. Chrome flags any frame where rendering is delayed over 50 ms as a long animation frame. https://developer.chrome.com/articles/long-animation-frames

## 2. Principles for Cults (applied)

1. **Acknowledge in the same frame; let the result follow.** (Apple touch-down highlight; Kaaresoja: visual quality drops past 100 ms; Deber: tap JND about 69 ms.) Every click and every hover shows a press or lift state on the very next paint, in under 50 ms and ideally 1 to 2 frames. That state is a CSS class flip with no React re-render of the board. The flying pieces can start up to about 100 ms later.

2. **Never block input on animation.** (Apple: interruptible and redirectable; HIG: don't make people wait.) The engine state updates at once (optimistic, deterministic). Animations replay the change. If the player clicks during a chain, either fast-finish the chain (jump all in-flight pieces to the end and tick counts to final) and apply the click, or buffer one intent and run it when legal. Never ignore the click. Never queue several clicks.

3. **The first beat is local and tiny; the chain overlaps.** (Willenskomer offset and delay; Disney anticipation.) The source pulse begins in the click frame. Later beats start with a 40 to 80 ms stagger, not when the previous beat finishes. A 4-beat chain at 250 ms each should take about 450 ms, not 1 s. Budget the whole chain, not just each beat.

4. **Duration scales with distance, and nothing over 400 ms on the player's own move.** (Material: distance-based, over 400 ms feels slow; Doherty 400 ms.) A short hop to an adjacent seat is about 180 ms, and a cross-board flight is about 300 to 350 ms. Use decelerate easing on arrival, plus a 60 to 100 ms settle or bump on the destination, and tick the count on landing.

5. **Count ticks are the payoff; make them land exactly on arrival.** (Swink polish; Juice.) The number must change in the same frame the piece arrives, with a small scale-bump. A count that changes before the piece lands breaks cause and effect. A count that changes 200 ms after it lands reads as lag.

6. **Rival turns: compress, don't hide.** (Hearthstone: animation time is a felt cost; StS mod: speed up only the bottlenecks.) Show what a rival did (where they placed, what they gained) with the same cause and effect, but at about 0.5 to 0.7x duration, beats overlapped, and short pauses between rivals. Keep a 150 to 250 ms "read" hold only on the result that matters (a buy, a recruit). Clicking anywhere during rival playback fast-forwards to the current state. It should never be blocked.

7. **The speed setting scales everything except acknowledgment.** (Balatro complaint: the setting misses some animations.) Use one multiplier applied to every duration, delay and hold: Relaxed about 1.5x, Steady 1x, Quick about 0.6x. Press states and the first-frame pulse stay instant in all modes. Quick compresses by overlapping more. It never drops the arrival, so the cause stays visible. Test that every animation uses the multiplier.

8. **The wheel answers in a frame, and its spin never blocks.** (RAIL 100 ms; Doherty 400 ms.) Start rotation on the click frame (transform-only, compositor). Land in 400 ms or less with strong deceleration, so most of the travel is in the first 150 ms and it feels fast. Accept the next placement click during the last part of the deceleration, or fast-land on click.

9. **Hovers: zero wait to show, a short grace to hide, pre-rendered.** (NN/g: delay on hide, not on show; Amazon menu-aim.) A hover card should be fully drawn (text, art, numbers) within about 100 ms of pointer entry, with no layout shift. Pre-render or keep cards mounted and toggle visibility. Pre-decode art. Hide after an 80 to 150 ms grace so moving between neighbors doesn't flicker.

10. **Steadiness beats speed: no long frames during motion.** (Kaaresoja: consistent delay beats variable; VFT study; LoAF over 50 ms.) Animate only transform and opacity. Don't re-render the whole board on each tick. Batch React state updates at beat boundaries. A 300 ms flight that hitches once feels worse than a smooth 400 ms one.

11. **Sound as the instant layer (optional).** (Audio feels simultaneous at about 19 ms.) A soft click on press and a tick on arrival make the same visuals feel faster, and cover any small visual delay. Keep it subtle and mutable.

12. **One focus at a time.** (Disney staging; Kelly's counterpoint.) During a chain, only the source and destination move. Everything else stays still. Juice never covers the count the player needs to read.

## 3. Where our bars may be wrong or incomplete

- **"100 ms card complete" is right for completion but misses acknowledgment.** Add a separate bar: first visible change in 50 ms or less (p95) for clicks and hovers. Most "laggy" reports are about this first pixel.
- **Measure p95 and max, not the mean.** Kaaresoja shows variation itself hurts. Add a jitter bar, for example p95 minus p50 of 30 ms or less.
- **Per-beat 150 to 350 ms without a chain budget allows slow chains.** Add a total of 500 ms or less for the player's own move at Steady, and a cap per rival turn (about 600 to 800 ms at Steady).
- **"Never makes the player wait to act" needs a test.** Click during a chain and verify the action applies (or the chain fast-finishes) within 100 ms.
- **The wheel's 400 ms should be measured from click to landing,** with a separate "spin starts in 50 ms or less" check.
- **Relaxed vs Steady:** also assert that Quick is faster than Steady on every animation, and that press feedback is identical in all three.
- **Missing: frame smoothness.** No long animation frames (over 50 ms) during any chain or spin, and a frame-time p95 of 20 ms or less under 4x CPU throttle.

## 4. How to measure it (for tests)

- **Input to first paint (acknowledgment):** use the Event Timing API (`PerformanceObserver({type:'event', durationThreshold:16})`). `duration` runs from the input to the next paint after handlers. Also log `processingStart - startTime` (input delay) and `processingEnd` (handler cost). Alternatively, in Playwright, dispatch the click, then a double `requestAnimationFrame` and check that the press class or computed style is present, recording `performance.now()` deltas.
- **Card complete (completion):** time from the input until the hover card's node is in the DOM, visible, its images decoded (`img.decode()` or `complete`), its fonts loaded, and two rAFs have passed. Report p50, p95 and max over 20 or more hovers.
- **Chain and wheel duration:** use `document.getAnimations()` after the click and await `Promise.all(anims.map(a => a.finished))`. Measure click to last finish. Assert that each animation's `effect.getTiming().duration` scales with the speed setting.
- **Long animation frames:** use `PerformanceObserver({type:'long-animation-frame', buffered:true})` during a chain, spin or rival turn. Assert zero entries over 50 ms. The entries' `scripts` attribution names the culprit (Chrome 123 and later).
- **Frame-time variance:** record rAF deltas during a chain. Report p50, p95 and max, and the count of frames over 25 ms (dropped). Run under CDP CPU throttle 4x.
- **Non-blocking input:** start a chain, click a legal target mid-chain, and assert the game state reflects the click within 100 ms and the chain is fast-finished or overlapping.
- **Layout shift on hover:** use `PerformanceObserver({type:'layout-shift'})` while hovering. Assert a sum of 0 for the board region.
- **Compositor-only motion:** check that animated properties are only `transform`, `opacity` and `filter` (scan the keyframes from `getAnimations()`).
