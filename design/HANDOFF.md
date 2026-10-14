# Patrons v4 — Handoff

Written 2026-10-14, the end of a long session, so the next session loses nothing. Read this first, then the files it points to. Where this doc and a source file disagree, the source file wins (decisions.md is the design log of record).

## 1. Who's who, and how to work with Cory

- Cory is the designer. Every design call and every call on feel is his. Claude is the foreman: builder, tester, simulator, critic, and keeper of the harness.
- **Read every session:** `CLAUDE.md`, `.claude/rules/working-with-cory.md` (roles, autonomy, lessons), `.claude/rules/design-principles.md` (distilled rules; check every suggestion against it), `.claude/rules/harness.md`, and the output style `.claude/output-styles/foreman.md`.
- **How to talk to him (hard rules):**
  - Terse and articulate, with a hint of poetry. No report voice, headers, bold labels or tables unless he asks. Five lines max unless he asks for detail.
  - Lead with intent and what you did, then what's next.
  - Decisions come as numbered lists he can answer by number ("1 yes, 2 no"), one line each, with the default in brackets.
  - Status is three lines: what's running, what's next, and an ETA.
  - Use his words. Never coin jargon (no "fixtures", "Diadem", "sway"). Say "buy followers".
  - Label your own fill-ins. They are never treated as approved.
  - Build his calls exactly as he says them. If you see a risk, flag it in one line; never add restrictions.
  - Never launch work on a pick he hasn't confirmed. His answer replaces your suggestion unless he says "also".
  - Give plain URLs. He opens links himself. He also likes things shown in chat ("can you just show it here in chat").
  - He wants **easier, snappier decisions**. When a list is long, propose a shortcut (e.g. "judge them by playing") instead of making him read 100 lines.
- **Autonomy:** tactics, tools, code, sequencing and harness are yours; decide and report. Run maximum parallelism; tokens are not a constraint. Account usage limits are real (they hit 3 times on 2026-10-14, at 06:30, 11:40 and 16:40 UTC) and they kill agents mid-work. Keep `design/in-flight.md` current, and schedule a `send_later` check-in that resumes dead agents.
- **Design workflow:**
  - Claude pitches broad ideas; Cory designs the granular content.
  - Every card is priced before he sees it: value model (`design/eval/value-model.md`) or sims. Say which.
  - Agent-designed spheres go through a design-critic agent (twice if needed) before Cory sees them.
  - Calibrate on a handful of examples with him before fanning out.
  - Since 2026-10-14 Claude may rework the **unconfirmed** spheres from playtest feedback. Log every change in decisions.md.

## 2. The harness: robust and non-hallucinating (Cory's explicit wish)

Cory wants a state-of-the-art harness that develops on a loop, iterates until excellent, and never reports things that aren't true.
- **The loop** is the `/v4-loop` skill (`.claude/skills/v4-loop/SKILL.md`): change → `npm run check:v4` → screenshots → review/test agents → fix → commit/push.
- **`npm run check:v4`:**
  - engine + session + UI unit tests (sphere tests excluded);
  - a production build;
  - e2e `hotseat.mjs`, `online.mjs` and `touch.mjs` against vite preview.
- **`e2e/v4/touch.mjs` is a build-failing gate.** At 390×844 with touch, at every step of a full game, it checks:
  - (a) every control is ≥44×44;
  - (b) Undo is never shown to the wrong seat;
  - (c) bot steps are ≥600ms apart;
  - (d) no interactive element is clipped by its container;
  - (e) your own recruit visibly flies;
  - (f) the phone header rows never overlap.
- **Blind tester panels** (`.claude/agents/game-skeptic.md`):
  - Fresh agents each time: a laptop newcomer at 1270×700, a phone player (iPhone 13 touch, rotating mid-buy) and a saboteur.
  - They get only a URL and the player rulebook, never the repo.
  - They grade Flow, Feel, Learnability, Legibility, Craft, Robustness and Overall.
  - Each reports top issues, misreads, what works, "table talk" (how it feels), and a "felt unfair or unfun" list (Cory, 2026-10-14).
  - SHIP needs A- or better.
- **Frozen builds:** testers get a frozen build at `.v4-panel/<n>`, served on its own port. Never point them at a build that's being rebuilt.
- **Anti-hallucination rules, learned the hard way:**
  - The UI agent repeatedly claimed fixes and screenshot paths that didn't exist. A fix counts only when (1) an automated e2e assertion fails the build without it, or (2) Claude has seen it in a screenshot of a freshly frozen build (`scratchpad/peek.mjs`-style script with `executablePath: '/opt/pw-browsers/chromium'`, run from inside the repo so playwright resolves).
  - When a recurring regression shows up a second time, it becomes a gate.
  - Run `check:v4` yourself before trusting any "passes".
  - Audit claims against reality after each panel.
  - State which instrument produced a finding (greedy bot, thinking bot, AI tester). The thinking bot wins about 78% even on a plain table, so its high win rates on new spheres are the instrument, not the sphere.
  - Agent reports are model output, not user approval.
- **Commits:** a stop hook demands that everything is committed and pushed. Commit WIP checkpoints often. Work on branch `claude/gifted-newton-3lcy3i`. No PR unless asked. No model names in commits. Commits end with the Co-Authored-By and Claude-Session lines.

## 3. The game as it stands (v4)

Full log: `design/decisions.md`. Player rulebook: `design/rulebook.md` (imported into the game). Architecture: `design/architecture.md`.
- **Players and rounds:** 2–4 players, 3 rounds. A wheel of 4 color quadrants ("spheres"): outer ring = round I (3 spaces each), middle = round II (2), inner = round III (1). Rings stay open once they open.
- **Turn order and setup:** snake-draft worker placement, 3/4/5 workers per round. Round I's order is random; after that, the fewest followers picks first. Setup: everyone picks 2 starting resources in seat order.
- **Buying:** after each placement you buy one thing, either a face-up member (6 face up from one shared deck) or followers.
- **Scoring:**
  - Each quadrant has one round-end contest on visible state, paying +2/+4/+6; tied leaders all score unless a tiebreak is printed (Red's: red members). You need at least 1 to score.
  - Followers from purchases and member triggers count at once.
  - After round III, end-game member bonuses apply. Most followers wins; ties go to more members.
- **Approved on 2026-10-14, being built now:**
  - Member costs ×2.
  - Follower buys: 2→1, 4→3, 8→6 (the 6-follower buy costs 8, needs 3+ colors, limited), plus a new top tier of 10 for 10 (4 colors, limited, supply about 4).
  - Gold counts as any color for follower buys. The gold-wild question was dropped: sims showed it barely matters.
  - Tuning target: the pure "big followers" strategy wins about 25% of 4-player games (15–30% acceptable; outside that, retune). A good member engine should beat it (Dominion Big Money). Aim for about 6–7 members per player.
  - Release as a base rule (trial): once per round, discard a member for its cost in any colors.
- **Spheres:**
  - **Locked (Cory-designed):** Gold (`design/spheres/gold.md`) and Red (`member-mover.md`).
  - **Magenta (thieves):** Cory's calls are in: stolen goods become spendable magenta at once, no loot piles, and scoring is most Magenta members. Watch item: that ring is sticky, with the same winner two rounds running 85% of the time.
  - **Drafts on the table for play-judging:** Green/Echo (copy spaces), Blue/Market (shop bending; most badged members, where badged means cost ≥4, which becomes ≥8 after ×2), Purple (extra turns), Silver (the host, gifts to all), White/Trading (followers as cash), Yellow (variety). Each passed its critic(s); their defaults are in each `design/spheres/*.md`.
  - The stand-in Blue and Green are plain filler.
- **Rule-bending members** (approved; `design/rule-benders.md`): Squatter (expensive), Big Spender, Freelancer (Yellow), Insider (expensive; Cory wants more pile interaction), Extra Hand (SUPER strong, price carefully), Front-runner, and Straggler (after the round's last placement, move one of your workers to an unused space and take it). Early Bird was rejected. Purple's old Straggler gets renamed.
- **Tabled ideas, in Cory's priority order:**
  1. Role tags across colors (Wingspan-like: round goals, members that count roles).
  2. Omens (three revealed up front; neutral).
  3. Devotion (sets).
  Rejected: Relics (too close to members) and Rank (win-more). Titles: maybe, but he dislikes the mechanism.
- **Design-space lesson (Cory):** spheres felt same-y because everything paid out in currency. The chosen direction is **members that bend the rules**.

## 4. Build quality so far

- Panel grades rose from C/C+ (panels 1–3) to B- across the board (panels 5–7), with one B.
- Robustness is A- (spam, reload, undo all hold), and scores always add up by hand.
- Recurring complaints:
  - Feel: your own moves snap while bots animate.
  - Phone layout: one long scroll page.
  - Shop text truncated while placing.
  - Bots too fast.
  - Tiny text.
  - Every tester said "just buy followers" was the whole game. That's why the costs changed.
- Open bugs as of handoff (UI agent working):
  - A reload near game end erased a hot-seat game.
  - The prompt pill stays stuck on "Placement undone" after an Undo.
  - The choice panel overlaps the follower-buy row.

## 5. In flight (see `design/in-flight.md`)

1. Cost change, top tier and tuning (core.js, content/*.js; docs in design/eval/).
2. UI agent:
   - the table picker (pick any 4 spheres, or `?table=`);
   - the reload-erase bug and the stuck Undo pill;
   - panel 7 fixes;
   - phone motion.
3. Cross-sphere integration fuzz (`src/test/engine/v4/fuzz-tables.test.js`) and interaction tests, plus bug fixes and unclear-rule questions for Cory.
4. Smarter bots: no hoarding, no recruiting everything, Easy/Normal/Hard.
5. The rule-bending members and Release, measured.
6. Next: apply critic defaults to the draft spheres, then a blind panel on **mixed tables** (Magenta, Purple, Echo…) with "felt unfair or unfun" notes, then fixes, then a link for Cory to play any 4 spheres.

## 6. Code map (v4)

- **Engine** `src/engine/v4/`:
  - `core.js` is a pure deterministic task queue; state is plain JSON with a seeded RNG.
  - Content modules in `content/` are registered via `registerQuadrant`.
  - Bots: `bots.js` (greedy) and `thinker.js` (rollouts).
- **Session** `src/v4/session/`:
  - local (resume and undo);
  - online, host-authoritative over Firebase RTDB at `v3rooms/<code>` with `game:'v4'`.
- **UI** `src/v4/`: React; only clicks legal option ids.
- **Tests:** `src/test/engine/v4` (sphere tests in `spheres/`), `src/test/v4`, `e2e/v4/*.mjs`.
- **Sims:** `scripts/v4-sim.mjs`, `v4-member-value.mjs`, `v4-thinker-sim.mjs`, `v4-big-followers.mjs`, `scripts/spheres/*`.
- **Commands:** `npm run check:v4`, `npm run sim:v4 -- 300 4`, `npx vitest run src/test/engine/v4`.
- `main` is the frozen v3 game; `?v=3` opens it.

## 7. Artifacts and links

- Harness diagram: https://claude.ai/artifact/PTmPKj5kjBaJX9xpW5Ng3t
- First prototype: https://claude.ai/artifact/D32uNuYuSq3pUEn4VrQ8YN
- Black/Magenta card sheet (now outdated): https://claude.ai/artifact/N8uzJK6ANX7Z183PA4aKgi
