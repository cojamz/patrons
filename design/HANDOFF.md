# Cults (v4) — Handoff

Rewritten 2026-10-14 ~21:00 UTC so a fresh session loses nothing. Read this first, then the files it points to. Where this doc and a source disagree, the source wins: `design/decisions.md` for design (the append-only log of record), the code for what's built.

## 1. Who's who, and how to work with Cory

- Cory is the designer. Every design call and every call on feel is his. Claude is the foreman: builder, tester, simulator, critic, and keeper of the harness.
- **Read every session:** `CLAUDE.md`, `.claude/rules/working-with-cory.md` (roles, autonomy, lessons), `.claude/rules/design-principles.md` (check every suggestion against it), `.claude/rules/harness.md`, and the output style `.claude/output-styles/foreman.md`.
- **How to talk to him (hard rules):**
  - Terse and articulate, with a hint of poetry. No report voice, headers, bold labels or tables unless he asks. Five lines max unless he asks for detail.
  - Lead with intent and what you did, then what's next.
  - Decisions come as numbered lists he can answer by number ("1 yes, 2 no"), one line each, with the default in brackets.
  - Status is three lines: what's running, what's next, and an ETA.
  - Use his words. Never coin jargon (no "fixtures", "Diadem", "sway"). Say "buy followers".
  - Any question that names a card or space quotes its text in a few words and says what changes for a player. He doesn't have the cards memorized ("what is Guest?").
  - Label your own fill-ins. They are never treated as approved.
  - Build his calls exactly as he says them. If you see a risk, flag it in one line; never add restrictions.
  - Never launch work on a pick he hasn't confirmed. His answer replaces your suggestion unless he says "also".
  - Give plain URLs. He opens links himself. He also likes things shown in chat.
  - He wants easier, snappier decisions. When a list is long, propose a shortcut ("judge them by playing", "all good?").
- **How to decide (Cory, 2026-10-14):**
  - **Go with your gut on fixes.** For fixes and open questions, take the default and build it. Log every gut call in decisions.md as "(Claude, under Cory's go-with-your-gut)" with the why and the measurement, so he can overturn any of them.
  - **Human playability first.** Anything that makes the game playable by people comes before everything else. Bots and agent tooling only as far as they serve that; no rabbit holes. `design/todo.md` is the ordered list.
  - Claude may rework the **unconfirmed** spheres (Green, Silver, Purple, Blue, White, Yellow, Magenta details) from playtest feedback. Cory's earlier calls on them still stand.
- **Autonomy and running agents:**
  - Tactics, tools, code, sequencing and harness are yours; decide and report. Run maximum useful parallelism; tokens are not a constraint.
  - **The box has 4 CPUs.** Throttle heavy sims here. Big sweeps (fair-price screen, bot levels, 4-thinker tables) go to remote sessions on their own machines and branches; the foreman reviews before merging.
  - **Usage limits kill agents mid-work** (four times on 2026-10-14: 06:30, 11:40, 16:40 and 18:55 UTC). Keep `design/in-flight.md` current, and arm a `send_later` check-in that resumes each paused agent with SendMessage (or relaunches it from its brief).
  - Agents never commit. The foreman verifies, then checkpoints (WIP checkpoint commits, often).
- **Design workflow:**
  - Claude pitches broad ideas; Cory designs the granular content.
  - Every card is priced before he sees it, by measurement (member-value sim, fair-price screen) rather than the old value model. Say which instrument.
  - Agent-designed spheres pass a design-critic agent (twice if needed) before Cory sees them.
  - Calibrate on a handful of examples with him before fanning out (pixel art, action names and member names all went this way).

## 2. The harness: robust and non-hallucinating (Cory's explicit wish)

- **The loop** is the `/v4-loop` skill: change → `npm run check:v4` → screenshots → review/test agents → fix → commit/push.
- **`npm run check:v4`** runs every v4 test (engine, all spheres, cards, fire audit, fuzz, session, UI, records), a production build, then every browser gate in `e2e/v4/` against `vite preview`. `-- --fast` skips the browser. CI runs `--fast` on every push (`.github/workflows/v4.yml`).
- **Browser gates (build-failing):**
  - `hotseat`: a full game by clicking, no console errors.
  - `online`: three people, a reload, a closed tab, "let a bot play for them", the host moving.
  - `tables`: the table picker and a game on every sphere.
  - `touch` (phone 390×844): 44px targets, Undo only for the right seat, bot steps ≥600ms apart, no clipped controls or cut-off text (`lib/textclip.mjs`), your recruit flies, header rows never overlap, no sideways scroll, no hover from a touch, setup on screen, pay by coins.
  - `motion`: count-ups, flights, bot pacing on laptop and phone.
  - `layout`: nothing cut off at 900–1270px; no color rules for follower buys.
  - `info`: every game element has hover info (long-press on phone); no ★ anywhere.
  - `benders`: Release, Squatter, Insider and Straggler work through the real UI.
- **Ports:** each agent runs check:v4 on its own `V4_OUTDIR=.v4-build-<name>` and `V4_PORT`. check:v4 refuses to run e2e against a busy port, because a stale server once answered the tests with an old build.
- **Freeze from a commit, never the live tree:** commit, `git worktree add .v4-wt/<sha> <sha>`, build into `.v4-panel/<n>`, serve on 5190+. `node scripts/v4-peek.mjs freeze <n>` builds and serves; `node scripts/v4-peek.mjs shots <url> <dir>` plays a full game at laptop and iPhone 13 and screenshots it, so you see the build yourself.
- **Fresh eyes at every milestone:** three new blind reviewers in parallel on a frozen build: `ui-critic` (picky designer, ends with a Vision of what it could be), `boardgame-enthusiast` (the game: decisions, tension, arc, fun) and an engineer (a fresh agent with repo access). Then a synthesis agent writes the meta picture (themes, agreements, root causes, one ranked list) to `design/eval/meta-round<N>.md`. Act on each report and on the meta list.
- **Blind panels** before a verdict: a laptop newcomer, a phone player by touch and a saboteur, each given only a URL and the rulebook, each reporting table talk and "felt unfair or unfun". `game-skeptic` is the final gate: SHIP needs A- or better.
- **Card truth:** every card has a scenario test that plays it through real moves and checks its log line (card ledgers A and B in `design/eval/`). The fire-audit gate fails if a recruited member with an effect never shows up in the log (`scripts/v4-fire-audit.mjs` for the report). Every number on the table traces to a log line.
- **Anti-hallucination rules, learned the hard way:**
  - A fix counts only when (1) an e2e assertion fails the build without it, or (2) Claude has seen it in a screenshot of a freshly frozen build.
  - A regression that shows up a second time becomes a gate.
  - Run check:v4 yourself before trusting any "passes".
  - Audit claims against reality after each panel.
  - Name the instrument behind every finding (Easy/Normal/Hard bot, 4-thinker tables, AI tester). A lone thinking bot wins ~78% even on a plain table, so its win rates are the instrument, not the sphere.
  - Agent reports are model output, not user approval.
- **Commits:** a stop hook demands everything is committed and pushed. Branch `claude/gifted-newton-3lcy3i`; PR #1 is open (its Netlify preview is the working link); no new PR unless asked. No model names in commit messages beyond the attribution lines; commits end with the Co-Authored-By and Claude-Session lines.

## 3. The game as it stands: Cults v0.2

Full log: `design/decisions.md`. Player rulebook: `design/rulebook.md` (imported into the game as How to play). Architecture: `design/architecture.md`. The UI plan: `design/prototypes/vision/build-plan.md`.
- **Name and version.** The game is **Cults** (the repo and code ids keep "patrons"). The build with all of 2026-10-14's inputs is **v0.2**. Playtest releases are v0.x: each link Cory shares with friends bumps the minor number and gets a git tag; fixes bump a patch (v0.2.1). The version shows on the home screen, in How to play and in every saved game and record.
- **Table.** 2–4 players, 3 rounds. A spinning wheel of 4 colored quadrants ("spheres"): the outer ring is round I (3 spaces each), the middle ring round II (2), the inner ring round III (1 each, 4 around the hub). Rings stay open once they open. One minion per space per round. Each space shows its icon and a short effect; hover (long-press) gives the full text and "you'd get". The wheel spins, but nothing else changes with its orientation.
- **Players.** Each player picks a pixel emoji (20 drawn, one per table). Workers are **minions**: little pixel copies of your emoji, 3/4/5 per round; the unplaced ones float around your **cult leader**, a robed figure with your emoji on the robe. The leader is your identity everywhere. Size order: leader > members > minions > followers.
- **Members** are people or groups, never rooms or objects (renames await Cory). Each is a distinct pixel character tinted in its sphere's color, so a cult reads at a glance. One shared deck holds every sphere on the table plus 7 guest rule-benders; the shop shows **10 face up**, visible during setup too.
- **Costs** have a colored part (that color only) and an "any" part. All member costs doubled on 2026-10-14; plain "worth N followers" members went back to the old price; discounts doubled too. 19 members say "Now and at round start" (they also pay the moment you recruit them); Heir pays now and at the start of round III. Revelers (was Feast Hall) counts as 3 members.
- **Followers** are the score, with their own mark (a little pixel person, never ★). You start with 1; members add their worth; followers from buys and member triggers count at once; contests pay at round end.
- **A turn.** Setup: everyone picks 2 starting resources, in seat order, with the shop visible. Snake order; round I is random, then the fewest followers goes first (ties: whoever went later last round). Send a minion, do the space, then buy one thing (a face-up member, or followers) or pass.
- **Buying followers** takes any resources: 2→1, 4→3, 8→6 (stock 2 per player) and 10→10 (stock 4). When the last 10→10 is gone, the game ends after that round (the clock).
- **Release** (base rule, on): once per round in your buy step, put one of your members on the bottom of the pile. Not one you recruited this round (a stolen one is fine). You get back only its colored part, in its own color (any colors if that color isn't on the table); a member with no colored part can't be released. You keep your buy.
- **Scoring.** Each quadrant has one contest on visible state, scored at round end: +2/+4/+6. Tied leaders all score unless a tiebreak is printed (Red: red members). You need at least 1 to score. After round III, game-end bonuses apply; most followers wins, ties go to more members.
- **Spheres** (11 modules; the setup offers Classic, Random 4, Custom, or `?table=gold,red,thieves,echo`):
  - **Locked (Cory's design):** Gold (most gold) and Red (most members, red members break ties).
  - **Reworked after Cory's first play, under go-with-your-gut:** Purple (most purple; Plan Ahead replaces Linger; Overtime pays 8 for 2 extra turns; Rally spends all your purple; Bookkeeper pays at your last placement; Relay cut), White (most white; Pawn, Barter replaces Cash In, Broker and Dealer at 2+0) and Green/Echo (most green; Echo copies a space a rival took since your last turn; Refrain, Understudy, Ensemble).
  - **Drafts on the table, judged by playing:** Magenta/thieves (most Magenta members; loot is spendable magenta at once), Blue/Market (most badged members; badged = printed cost 8+), Silver (most silver), Yellow (most full sets).
  - The stand-in Blue and Green are plain filler (the Classic table is Gold, Red and the two stand-ins).
  - **Guest rule-benders:** Squatter, Big Spender, Freelancer, Insider, Extra Hand, Front-runner, Straggler (prices in design/rule-benders.md).
- **Bots:** Easy, Normal (default) and Hard in the engine; the setup screen doesn't offer them yet. Bot speed is Slow/Normal/Fast.
- **The look is the Lamplit Table** (approved with Cory's adjustments): a walnut table, cream paper cards, muted inks, Alegreya type. At most 7 groups on screen at a glance; everything else one hover or long-press away, and every element has a hover. You pay by dropping coins into the cost slots. Round end is **the Reckoning**: quadrants pay one at a time and followers fly to each winner. Every turn is told in one place.
- **Layout revision (Cory, after seeing the in-progress build):** the wheel is the focus, bigger and centred. Each player's cult sits at a corner like chairs at a table (yours nearest, slightly larger): leader, floating minions, member crowd, follower mark, resources. The shop is a slim strip of 10 small cards like elegant sports cards (figure, name, cost, worth; the effect on hover). When buying, only what you can afford is lit. Hover must feel instant: under 100ms, one sticky layer, no flicker.
- **Intro:** a ~20s skippable pixel intro of the gist, per player (each sees and skips their own; nobody waits).
- **Living cults** (stretch goal): idle loops for leaders and members; a member reacts when its ability fires; the leader gestures when sending a minion, celebrates a prize and gives a scheming laugh when recruiting.
- **Pixel art:** approved, good enough for now; a polish pass comes later.
- **Feedback pipeline:** tabled until Cory allows Firebase/Netlify in the environment. A copy-only feedback tab may stay if it's done.

## 4. Build quality and harness state

- **Blind panels:** C/C+ (panels 1–3) rose to B- across the board (5–7). Robustness A- (spam, reload, undo all hold); scores always add up by hand. Panel 7 was before the Lamplit Table rework; no blind panel has graded the new look yet.
- **Fresh eyes, round 1:** ui-critic C- (information access D: contest counts that didn't match scoring, no outcome previews, player colors that clashed with resource colors). Those led to `contestTable`, the "you'd get" preview and emoji leaders. The engineering review led to the hardening that has landed: an honest gate, CI, version stamps and content hash, game records and replay, the Recovery screen, the bot-failure fallback, and refusing mixed builds online. The enthusiast hasn't run yet.
- **Cory's own play:** "The game works great"; he loves how smoothly it runs. The UI was "SOOOO much info, no clear hierarchy, maximalist", hence the Lamplit Table. The game felt too chaotic (watch item).
- **Gate status:** agents are mid-edit (UI-A's shell rewrite), so trust check:v4 only from a run on a committed snapshot. CI has the last word on `--fast`.
- **Balance readings** (design/eval/top-tier.md): pure follower buying wins ~10% against Normal bots and ~80% against Easy bots. The 25% target sits between the two instruments. A thinking bot finishes ahead of the buyer 75% of the time. Normal bots recruit ~3.4 members a game, Easy ~7.9 (target 6–7).
- **Tools:** `scripts/v4-peek.mjs` (freeze + screenshots), `v4-fire-audit.mjs`, `v4-replay.mjs`, `v4-fair-price.mjs`, `v4-member-value.mjs`, `v4-big-followers.mjs`, `v4-bot-levels.mjs`, `v4-thinker-tables.mjs` (the standard balance reading: four Hard bots), `v4-art-import.mjs`.

## 5. In flight

See `design/in-flight.md` for the roster, each brief and build dir. In short: UI-A (wheel, shell, pay, the Reckoning, phone), UI-B (shop strip, corner cults, hover layer, art, animations, e2e selectors), hardening, multiplayer, the White and Green reworks, dead-window fixes, the last icon batch, emoji minions and leaders, and the intro. On remote machines: the fair-price screen, bot levels with 4-thinker tables, and Purple member replacements. Held: the board game enthusiast, until the layout revision is frozen.

## 6. Open decisions for Cory (ask by number, defaults in brackets)

1. Action names, calibration batch for Gold, Red and Magenta (18 lines, `design/eval/action-names-calibration.md`): grade by number or "all good". [Claude's picks]
2. Member renames, people or groups only (28 lines, `design/eval/member-names.md`): grade by number or "all good". [Claude's picks]
3. Swap space: one of your members for a rival's of equal cost, +1 red, round I? [yes]
4. What the ~25% big-followers target is measured against. [an in-between bot level, then a check with people]
5. Allow `firebaseio.com` and `netlify.app` in the cloud environment's network settings, so online play can be verified on the real link and the feedback pipeline can come off the table. [yes]

## 7. Watch items and ideas (bring to Cory when relevant; don't decide them yourself)

- **Chaos:** Cory felt the game was too chaotic. Ask friends after their first game. The turn story and slower bots may help. The Purple rework lets one player place 4+ times in a row in 57% of games, which may add to it.
- **Building toward a strategy:** a member you want is often gone before your turn comes back. The shop of 10 is the answer for now; Reserve (hold one face-up member only you can recruit) is the pitched fallback.
- **Magenta:** "most Magenta members" is sticky: the same winner two rounds running 85% of the time. If it plays stale, change the scoring rule, not the cards.
- **Silver:** a resource glut (~58 left per player vs 25 baseline).
- **White:** Lender nets −1 follower, the one exception to "every member is worth at least 1". Cory hasn't ruled.
- **Echo × Plan Ahead:** a copy gives the taker's printed gain, +6 or +8 when Plan Ahead was taken first.
- **Easy tables:** pure follower buying wins 74–80% against loose recruiters, and a first-time human table may look like that.
- **Follower ladder:** if 8→6 stops feeling like a bulk deal, measure 7→6. The ladder echoes Dominion's 1/3/6 + Province clock; Cory might want it more our own later.
- **Making the game more distinctive** (design/novelty.md): the wheel is navigation today; a mechanic using rotation or neighbouring quadrants would make the board the signature. Raise it, don't build it.
- **Tabled overlays, in Cory's order:** role tags across spheres (Wingspan-like) → Omens (three revealed up front, neutral) → Devotion (sets). Rejected: Relics, Rank. Titles: maybe.
- **Design direction:** members that bend the rules. Cory loves pile interaction (Insider). More come in calibrated small batches he grades by number.
- Report the big-followers number with every balance change.

## 8. Code map (v4)

- **Engine** `src/engine/v4/`: `core.js` is a pure deterministic task queue (state is plain JSON with a seeded RNG; buys, Release, `contestTable`, `turnRail`). Content modules in `content/` register via `registerQuadrant`; `benders.js` holds the guests. `bots.js` (Easy/Normal/Hard), `thinker.js` (rollouts), `preview.js` ("you'd get" dry runs).
- **Session** `src/v4/session/`: local (resume and strict undo); online, host-authoritative over Firebase RTDB at `v3rooms/<code>` with `game:'v4'`; `record.js` (content hash, version stamps, game records, replay).
- **UI** `src/v4/`: React; only clicks legal option ids. `game/` (GameScreen, Wheel, ShopCards, CultSeat, HoverCards, PayPicker, RoundEnd…), `screens/`, `art/` (sprites, leaders, minions, follower mark), `lamp.css` (tokens and regions), `Intro.jsx`, `Recovery.jsx`, `glossary.js`, `version.js`.
- **Tests:** `src/test/engine/v4` (spheres in `spheres/`, cards in `cards-*`), `src/test/v4` (session, ui, records), `e2e/v4/*.mjs`.
- **Commands:** `npm run check:v4` (with your own `V4_OUTDIR`/`V4_PORT`), `npm run sim:v4 -- 300 4`, `npx vitest run src/test/engine/v4`.
- `main` is the frozen v3 game; `?v=3` opens it.

## 9. Links and artifacts

- Working preview (PR #1, redeploys on every push): https://deploy-preview-1--cornycolonies.netlify.app (not reachable from this container)
- Harness diagram: https://claude.ai/artifact/PTmPKj5kjBaJX9xpW5Ng3t
- First prototype (old rules): https://claude.ai/artifact/D32uNuYuSq3pUEn4VrQ8YN
- Black/Magenta card sheet (outdated): https://claude.ai/artifact/N8uzJK6ANX7Z183PA4aKgi
- In the repo: the vision frames `design/prototypes/vision/shots/f1–f4.png`; pixel-art contact sheets `design/prototypes/pixel-art/shots/` (one per batch, plus the emoji identity sheet).
