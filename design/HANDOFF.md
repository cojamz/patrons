# Cults (v4): Handoff

Rewritten 2026-10-15 (afternoon), so a fresh thread loses nothing. Read this first, then the files it points to. Where this doc and a source disagree, the source wins: `design/decisions.md` for design calls, the code for what's built.

## Current collaboration update (2026-10-16, Codex)
- Cory wants warm, terse, clear updates; fast delivery with integrity, assistant-owned harness, visual checks and current docs. Preserve the existing design. Native screenshots were declined; isolated browser screenshots are authorized.
- Source branch: `claude/gifted-newton-3lcy3i`. Publish checked commits with `scripts/v4-play.sh` to main/play, verify full live build stamp. Root `/patrons/` redirects to `/patrons/play/`. Historical Netlify instructions below are superseded.
- First fixes published through `ffc44bc`: Green copy rules, Late Bloomers, Toast, contest ties, timing, Relaxed default, seats/hover, final bonuses, member-origin resources, landing sound and speed-change stall. Phone touch smoke passed 390/412px (emulation).
- Latest live source `c8dd8a9` (main/play `53200b7`), verified through public root and full build manifest: eight members, compact 1/5/10 buys, readable shop/rates, colored slice outlines, Echo lock fix, sequential payouts, ring anchors and clearer final tiebreak. Release stays. Check: 1163 passed / 1 skipped, build/full browser game green, phone touch smoke 390/412px green. All agents finished.
- Original feedback is preserved verbatim in `play-feedback-2026-10-16-original.txt`; `feedback-audit-2026-10-16.md` maps it to code and remaining work. `todo.md` is refreshed, not a claim every note has shipped.
- Free recruit with owned Go-Between/Exporter: three action regression cases pass; no engine defect reproduced. Do not claim this fixed without distinguishing visible attribution from rules.

## 0. Latest (2026-10-15, 10:40pm Eastern)
Cory played and called it v0.5 ("quite good"). Historical state at that time; superseded by current update above. Notes: todo.md top section, decisions.md 2026-10-16, answer key 48–53. Start there. Open to him: follower buys 1/5/10 or 2/5/10 [1/5/10]; end-game tiebreaker most members, shown [yes]; remove member release [keep, make findable].

## 0b. Before that (2026-10-15, 8:25pm Eastern)
Cory rated his own play B+ and switched us from grading to fixing his notes. Shipped today, live at https://cojamz.github.io/patrons/play/ (build bc019a2): one sphere per player; turn order drawn and shown before the starting picks, with your pick inside your seat; the Paying/Keeping pay picker; "Done, no buy" lit and only in the buy step; seats show a member count and every member during a member pick; Free Recruit's hover lights the cheapest card(s); Greatest Hits says what it copies and skips; no extra minions in round I; Banker by swap pays; Night Owl explains itself; speed slices (hovers in one frame, bot turns in slices, cached pixel art); price calls (Rush Hour for Overtime, 2-for-2, Cheap Seats). How to ship now: `.claude/rules/working-with-cory.md` ("Ship straight away"); times go to Cory in US Eastern 12-hour. Unfinished work: `design/in-flight.md` top section. Open question to Cory: should Greatest Hits repeat what a copied Echo gave instead of skipping it [no]; deck too thin at 2–3 players (25/35 cards; shop ran short in a third of bot games).

## 1. Who's who, and how to work with Cory

- Cory is the designer. Every design call and every call on feel is his. Claude is the foreman: builder, tester, simulator, critic, keeper of the harness.
- **Read every thread:** `CLAUDE.md`, `.claude/rules/working-with-cory.md`, `.claude/rules/design-principles.md`, `.claude/rules/harness.md`, `.claude/output-styles/foreman.md`, then `design/in-flight.md` and `design/todo.md`. The standing brief Cory approved is `/mnt/project-files/setup/project-instructions.md`.
- **Talking to him:**
  - Foreman voice: terse, plain, a hint of poetry. Five lines at most unless he asks. No tables, headers or bold-label report voice. No "want me to…?" offers.
  - Lead with what you did and what's next. Status is three lines: what's running, what's next, ETA.
  - Decisions as a numbered list he answers by number ("1 yes, 2 no"), one line each, default in brackets.
  - His words only. Say "buy followers". Any question naming a card or space quotes its text in a few words and says what changes for a player.
  - Show, don't describe: a link, a screenshot or a GIF with a plain caption. Plain URLs.
  - Never talk about sessions, tools or harness internals. If something is blocked, say so once, plainly, with the one thing he can do.
  - Label your own fill-ins. They are never approved until he says so.
- **Deciding:**
  - Fixes: go with your gut, and log each gut call in decisions.md as "(Claude, under Cory's go-with-your-gut)" with the why.
  - Design direction is his. Never start on a pick he hasn't confirmed; his answer replaces your suggestion unless he says "also". Build his calls exactly as said; flag a risk in one line, never add restrictions.
  - A gut call that changes HOW a choice is made gets shown to him as a picture first (the two-step gift was a gut call he then hated).
  - Human playability first. Laptops only; phone is out of scope.
- **Running work:** tokens are not a constraint; run the most useful parallelism. Agents never commit; the foreman verifies and checkpoints. Keep at most one scheduled check-in pending, and delete it when the work ends (seven leftovers flooded him on 2026-10-15).

## 2. The bar (Cory, 2026-10-15)

- Nothing reaches Cory below **A−** from a fresh blind panel (two screen-only testers, lists merged, plus game-skeptic) on the exact build he will open, run on quiet remote machines.
- Before sending a link, confirm the live preview shows that build's version stamp. This morning he played a stale build.
- Cory shouldn't be the one catching obvious UX problems. Every catch he makes joins the answer key (`design/eval/critic-calibration/answer-key.md`) and becomes a gate.
- Snappy is measured as "card complete", not "card present": every click and hover answers within 100 ms; the wheel spin lands in 400 ms or less. Pace is judged by eye on filmstrips at every speed. Relaxed must feel clearly slower than Steady.

## 3. The game as built: Cults v0.2

Rules: `design/rulebook.md` (in the game as How to play). Every call: `design/decisions.md`. Architecture: `design/architecture.md`. Taste: `design/taste.md`.

- **Table.** 2–4 players, 3 rounds, a spinning wheel of 4 colored quadrants (spheres). Outer ring is round I, middle round II, inner ring round III; rings stay open. Workers are **minions**, 3/4/5 per round, one per space per round. Snake order; round I random, then fewest followers first. A turn: send a minion, do the space, then recruit one face-up member, buy followers, or pass. Followers are the score. Each quadrant's contest pays +2/+4/+6 at round end (the Reckoning). The version shows on the home screen (`src/v4/version.js`, `VERSION = 'v0.2'`).
- **Layout: who | where | what to buy** (`src/v4/game/layout.css`). Seats on the left in turn order with the story of the turns since yours under them; the wheel big in the middle; on the right the follower buys first, then the member deck and shop. A turn-order rail sits beside the seats today ("now", "next", "×2"); Cory found it confusing and it's coming out (section 5).
- **Visual language: plate 1b** (`design/prototypes/language/plate1b.png`, grammar.md, kit.css; tokens in `src/v4/lamp.css`). The only symbols are the colored resource dot (a split dot for "any") and the follower mark; everything else is words. Action spaces show the gain, then a plain phrase; the name is in the hover. Rims read like "MOST BLUE · +2" with the leader's emoji.
- **Motion director** (`src/v4/game/director.js`, timings in `src/v4/motion.js`). Every move plays as a chain from cause to effect: pieces fly from where they came from to where they land, members hop when they fire, counts tick as pieces arrive. One Speed setting in setup and the ☰ menu: Quick, **Steady** (default), Relaxed. A click or Space skips to the end.
- **Choices are picked on the board** (`src/v4/game/boardPick.js`): click the space to copy, the rival's stack to steal, the member or seat to pick. Gifts are two clicks today (your color, then their seat), which Cory called "very bad/confusing" (section 5). What has no place on the board (Pass, an amount, "All 3 as green") stays a button by the caption, and every pick is also in a keyboard list.
- **Effect stream and follower ledger.** The engine records every effect as it happens (`src/engine/v4/effects.js`); the director's animation, the turn story and the "since your last turn" strip all read from it. The follower ledger (`state.ledger`, `src/engine/v4/core.js`) records where every follower came from, so the results breakdown adds up exactly.
- **Members** are people, each a pixel character tinted its sphere's color. One shared deck, 10 face up, the deck and its count at the head of the strip. Hover a seat to see each member's ability and state; a member you can use now glows ("Use: +7 ●").
- **Spheres:** 11 modules (Classic table = Gold, Red, Blue market, Green echo; also Random 4, Custom, `?table=`). Gold and Red are Cory's locked designs; the rest are drafts judged by playing. Guest rule-benders: Squatter, Big Spender, Freelancer, Insider, Extra Hand, Front-runner, Straggler. Release is a base rule.
- **Online:** host-authoritative over Firebase RTDB (`src/v4/session/online.js`), separate from the static host, so moving hosts changes nothing about multiplayer. Bots Easy/Normal/Hard; the lobby offers the bot level.
- **Intro:** one continuous ~27 s shot, once per browser, Skip always visible (Cory: "amazing").

## 4. The harness as it stands

- **The loop** is the `/v4-loop` skill: change → check → screenshots → review → fix → checkpoint. `npm run check:v4:quick` (about 2 min, `-- --related <files>`) while iterating; the verdict is `npm run check:v4 -- --commit <sha>` on a committed snapshot, never the live tree. Each agent sets its own `V4_OUTDIR=.v4-build-<name>` and `V4_PORT` (5281+).
- **The local box has 4 CPUs** and a full gate overloads it (load 27 on 2026-10-15), so a timing failure there is often load. Re-run a failure alone once before calling it real.
- **Quiet remote machines** run verdicts, perf numbers and blind panels. Remote sessions take a branch name, so push `claude/cults-freeze-<wave>` first (w3 and w4 exist). Results land in `design/eval/perf/quiet-*.md` on their own branch (`claude/cults-perf-<wave>`).
- **Screen-only testers.** Every tester and critic drives the build only through `scripts/v4-eyes.mjs` (screenshots, coordinates, timings; never the DOM), with just the URL and the rulebook. Brief v4 (2026-10-15 afternoon) adds a speed ladder, hover "complete" timing, an outcome ledger, eye distance, assigned tables (coverage table in brief.md) and taste.md's "Cory's own calls" as house style. Replayed on the wave-2 build, two fresh v4 testers merged caught 82% of the items present (90% of Cory's morning catches) against the old panel's 61% (30%) (`design/eval/critic-calibration/results.md`, `replay-w2-v4/scoring.md`). v4-eyes prints a response line (first → complete, bursts), a motion line (beats, stutters, load), `watch` and `motion-log`. game-skeptic is the final grader.
- **Standing design pod:** an art director and a detail designer fix the UI with guards whenever it is changing. Briefs: `.claude/agents/art-director.md`, `detail-designer.md` (read the answer key, play live games on rotating tables, feel camera, outcome ledger, never build a tester's wish against Cory's calls). Tools `scripts/design-pod/`, logs `design/eval/design-pod/`.
- **Branches:** checkpoints go to `claude/cults-wip`; freeze branches `claude/cults-freeze-<wave>`; the last frozen build is `claude/cults-final` at 0c1cd51. Only gate-green builds go to the PR branch `claude/gifted-newton-3lcy3i` (PR #1), because every push there redeploys the preview. Each thread works on its own branch cut from the PR head.
- **Guards worth knowing** (each fails the build): `src/test/v4/ui/css-has.test.js` (no page-level `:has()` or root custom properties, the big perf win); `e2e/v4/snappy.mjs` s6 (30 fps idle on your turn) and s7 (a press paints within 100 ms); `e2e/v4/lib/typescale.mjs` (type scale everywhere outside the wheel); `e2e/v4/turndock.mjs`; `e2e/v4/travel.mjs`; `e2e/v4/members.mjs` m14 (a seat card opens within 150 ms of one move onto it). Plus hotseat, online, tables, info, layout, motion, reckoning, spaces, steal, pay, benders, memory, resume-edge, turnstory.
- **Proof rule:** a fix counts only when a gate fails without it, or Claude saw it on a fresh frozen build at about 1270×700. An agent's report is never proof. A regression seen twice becomes a gate. Never weaken an assertion.
- **Tools:** `scripts/v4-peek.mjs` (freeze + shots), `v4-perf.mjs` (4× CPU), `v4-eyes.mjs`, `v4-clips.mjs` / `v4-gif.mjs`, `design/prototypes/motion/film.mjs` (filmstrips on a fake clock), `v4-fire-audit.mjs`, `v4-replay.mjs`, the bench on `claude/cults-bench`.

## 5. Where it stands (2026-10-15, ~14:30 UTC)

- **Build.** Final overnight build 0c1cd51 on `claude/cults-final`. The PR head 8afc4dd is the same code plus notes (morning note, design pod closing lists).
- **Preview is stale.** https://deploy-preview-1--cornycolonies.netlify.app shows a build from before 10:00 ("Ransom a member", "2 extra turns for 8"). Cause not confirmed. Likely: about 60 overnight pushes used up Netlify's free deploy credits (300 a month). A failed build would look the same. Nobody has checked the Netlify dashboard yet.
- **Grades.** Last blind grades were on 8ea3e24: testers C+ and C+, hobby gamer B−, game-skeptic B−. Nobody has graded 0c1cd51. The bar is now A−.
- **Quiet machine on 0c1cd51** (`design/eval/perf/quiet-final-0c1cd51.md`, branch `claude/cults-perf-final`; nobody read it until this afternoon):
  - All 6 gate failures passed when re-run alone. They were load flakes.
  - At 1× it's the quickest build yet: hovers open in 30–40 ms p95. snappy alone: spin 396 ms, hover p95 61 ms.
  - At 4× CPU it **regressed** against 8ea3e24: wait for your turn 12.0 s (was 9.5 s), main-thread blocking 23–24 s (was 8–9 s), first click 2.1–2.6 s (was 1.1–1.3 s), a placement shows in about 0.9 s (was 0.4–0.5 s). Look at forced layout in the first click and the React scheduler frames. On a normal laptop (1×) the wait is 9.5 s, the fix Cory saw; this is the slowed-down test only.

### Cory's seven notes this morning, and the plan for each
1. **Hovers feel laggy.** Likely the card opens before its "You'd get" line is ready. Precompute every open space's forecast at turn start, keep the card's size fixed, and gate on "card complete" in a real headed browser.
2. **Pass is hard to find.** Move it into the shop column as "Done, no buy", under the follower buys.
3. **The turn-order rail is confusing.** Remove it. The seats already sit in turn order and the one playing glows. Add a quiet "next" on the following seat, "next · twice in a row" where the snake doubles back, and "your turn in 3" on your own seat.
4. **Wheel emojis too big and out of line.** Rim leaders smaller, upright, inside the rim band. Minions on spaces smaller and tucked at the panel edge, never over the words.
5. **Good Deed's two-step gift is "very bad/confusing".** A small card beside the space you just took: your colors as big dots, then the rivals' faces. Two taps, your eye stays on the wheel. Same for every gift and steal.
6. **Animations too fast even on Relaxed, and not smooth.** Relaxed about 2× Steady, Steady a little slower. Re-check smoothness on a live build (the wheel-shadow fix may already help, but he only saw the stale one).
7. **"The design is still clunky."** A design pass graded to A−, with his notes as the testers' answer key.

Order: 1–6 in code now (one thread), then Purple and Catch Up once he answers, then the 4× perf regression, then a fresh blind panel to A−.

## 6. Waiting on Cory

- **Purple** ("no board action should require spending"):
  1. Overtime → "Take 1 extra turn right after this one", Crunch Time → "Take 2 extra turns right after this one". [yes]
  2. Trades (Cheap Seats, All In, Sell High, Trade Seeds) don't count as spending. [no change]
  3. Rework Corner-Cutter later. [yes]
- **Catch Up** never pays its bonus (code today: "+1 purple, and +2 per rival with more minions on the board than you", counted after your own minion lands, so nobody is ahead of you in a normal snake). Proposed: "+1 purple, and +1 per rival who's placed more minions than you this round", counted before yours lands. He also said it gave nothing at all, so check the +1 is granted. [yes] (An earlier proposal the same morning kept +2 per rival "after extra turns"; the +1 version is the later one.)
- **Hosting:** move from Netlify to Cloudflare Pages (500 free builds a month, a preview per branch). He connects the repo once, about 5 minutes; Claude sets up the rest and publishes only gate-green builds. [yes]
- **The morning note's calls 1–10** (`design/morning-note.md`), all unanswered. Call 9 is the biggest: balance pass 3 reprices 25 members (`design/eval/balance-pass-3.md`).

## 7. Where everything lives

- Design calls: `design/decisions.md`. Rules: `design/rulebook.md`. Taste and Cory's own calls: `design/taste.md`. Visual language: `design/prototypes/language/`. Motion language: `design/prototypes/motion/grammar.md`.
- What's running: `design/in-flight.md`. Ordered to-do: `design/todo.md`. Morning note and its calls: `design/morning-note.md` (pictures in `design/morning/`).
- Evaluations: `design/eval/` (testers' answer key and recall in `critic-calibration/`, design pod in `design-pod/`, perf in `perf/`, waves in `wave2/`, `wave4/`, `overnight-wave3.md`, `game-skeptic-w4.md`, the bench in `bench/`).
- **Code:** engine `src/engine/v4/` (`core.js` pure deterministic task queue, `effects.js` the effect stream, `content/` the spheres and guests, `bots.js`, `thinker.js`, `preview.js` for "you'd get"). Session `src/v4/session/` (local, online, `record.js`). UI `src/v4/` (`game/` for the screen: GameScreen, Wheel, CultSeat, ShopCards, HoverCards, director, boardPick; `lamp.css` tokens; `motion.js`; `Intro.jsx`). Tests `src/test/engine/v4`, `src/test/v4`, `e2e/v4/*.mjs`. `main` is the frozen v3 game.
- Links: preview (stale) https://deploy-preview-1--cornycolonies.netlify.app · harness diagram https://claude.ai/artifact/PTmPKj5kjBaJX9xpW5Ng3t

## 8. The open list

- Get the current build live: find out why the preview is stale; if Cory says yes, move to Cloudflare Pages. Confirm the version stamp before any link.
- Cory's notes 1–6 in code (running), then note 7's design pass.
- Purple, Catch Up and calls 1–10 once he answers.
- Find and fix the 4× CPU regression between 8ea3e24 and 0c1cd51.
- The gate overloads the 4-CPU box by itself; timing gates flake under it. Run verdicts remotely.
- Reckoning count drift under load: the quiet machine saw "5 quadrants told, 9 winners" on a 4-quadrant board in the loaded gate run. Passed alone; worth a look.
- A fresh blind panel on the fixed build, graded to A−, before Cory sees it.
- Watch items (raise with Cory when relevant, don't decide): chaos feel, Magenta's sticky rim, Silver's resource glut, Lender's −1, pure follower buying at about 10% (his band is 15–30%), members looking alike at seat size (call 8).

## 9. History in brief

- 2026-10-14: Cults v0.2 rules, the Lamplit Table look, members doubled in cost, intro, online hardening, the screen-only tester harness.
- Overnight into 2026-10-15: four waves of blind testers and fixes, plate 1b visual language, the motion director, board picks, the who | where | what-to-buy layout, perf rounds 1–5 (4× wait 18–20 s → 9.5 s on 8ea3e24), final build 0c1cd51 frozen ~12:40.
- 2026-10-15 morning: Cory played the stale preview and sent seven notes; the old thread lost its tools and couldn't edit files, so this afternoon's threads are fixing the notes and refreshing the docs.
