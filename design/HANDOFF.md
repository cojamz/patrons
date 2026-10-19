# Latest — v0.8.4 backlog UI batch shipped, October 19

- Public https://cojamz.github.io/patrons/play/: **v0.8.4**, immutable source `1acee1a6c9db85d8dda4381389ffe751eacca525`, Pages main `70c0fa4`. Served stamp and HTML verified by publisher; actual public desktop/phone flows checked.
- Three parallel lanes: payment passives above money rows with tighter layout; member hover costs at right and no redundant ownership footer; details toggle no longer forced/disabled during member choices and remembers explicit preferences. Member lists preserve effect groups then ascending price, full abilities and live controls.
- Visual review also caught/fixed pale member ability text on payment paper. Scoped ink rule plus real-browser contrast assertion; do not revert it while styling `.ability` globally.
- Exact final source: production build,52 focused UI checks and6 actual desktop/phone payment/choice/hover cases PASS. Eight viewport/color shop-sizing cases passed on immediately prior source before only the payment ink correction. No full-suite/sim or performance claim. Evidence: eval/backlog-ui-v084/.
- v0.8.3 larger stable shop preserved: same twelve slots in compact/details; normal desktop fits; phone/tablet swipe; tiny desktop retains readable fallback scroll. Prior evidence: eval/shop-sizing-v083/.
- All three lanes complete; no persistent previews. Root reconciled duplicate historical todo entries and refreshed board. General motion/wheel/round-summary backlog remains open.
- Next design discussion: seven remaining identities Gold/Blue/Purple/Silver/Yellow/Magenta/White. Magenta suggested as next, working backward from Poach. No redesigned Magenta rule locked. Historical spheres/thieves.md now explicitly warns that old prices, Poach replacement and protection text are stale; use runtime code/current decisions.
- Stay v0.8.x. Red/Green rules from v0.8.2 remain unchanged below.

# Current handoff — v0.8.2 new Red deck shipped

- Public https://cojamz.github.io/patrons/play/: **v0.8.2**, checked source `ff5356072225432d24eb0b7eb4dd6c50302d3903`, Pages main `47358624d1693631e8c2991fd794b2c939578fbe`. Full served stamp/HTML and all six actual public desktop/phone scenarios verified. Evidence: eval/red-members-v082/verification.md. Public unified shop/timing/layout also inspected.
- New Red twelve-member deck built and live. Authoritative spec: spheres/red-members-2026-10-18.md. Volunteer free; Twins2 red; Panel3 bodies/cost4+2; Mob5 bodies/cost6+4; Loyalists2 bodies/cost2+3. Other new passives use descriptive temporary names Recruit Bonus / Movement Penalty. Remaining proposed prices adopted under Cory’s implementation-priority/go-with-your-gut instructions, identified in spec.
- Panel **On Recruit: Promote or Demote another member**. Physical Panel excluded through saved choices and handler revalidation. Loyalists blocks owner/rival swaps but not theft. Active acquisition invokes Recruiter; movement penalty stops at zero without hidden debt. Printed followers count as member quantity.
- Both Impostor and Doppelganger become copies without firing copied On Recruit/immediate Now; ongoing effects, future Round Start, quantities and worker grants retained. Chorus excludes itself; Copy Previous follows most recent action regardless owner and shares targets with previews.
- Unified member/follower shop, matching compact card/price anatomy; bold canonical timing labels; stale swap hover cleared. Rejected rapid phone Recruit keeps its sheet; accepted actions close through controller. Intentional motion/tap guards remain.
- Checks: 241 focused engine/UI checks on integrated source; final additional-fix scoped 38 checks and production build on exact shipped SHA; all six browser cases public/local pass with observed actual motion and restored buying/placing. Counts overlap; no whole-suite, long sim, independent RTDB, performance or balance verdict.
- Loop history: initial Impostor/Mentor example was wrong and corrected. Verified identity-copy loop terminates under no copied Recruit; verified Panel/Stunt repeat terminates via Panel’s “another” rule. No once-per-chain rule added.
- All lanes complete; owned review5324 stopped, gate5325 self-cleaned, public browsers closed. Next: Cory playtest feedback, names for two passives, remaining general animation/wording/round-summary backlog. New intake audit: feedback-audit-2026-10-19.md. No all-backlog-done claim.
- Stay on **v0.8.x**, default new-card cost ceiling10. Other legacy prices above10 require a separate reviewed pass, not silent global repricing. Historical checkpoints below contain superseded versions/instructions.

# Cults — agent handoff, October 18, 2026

## Top-10 thread, wound down 9:45pm Eastern, Oct 17 (Cory out of credits)
- Shipped v0.6.4: the seven price nudges. Shipped v0.6.5: idle animations stop while a move plays (lamp-b.css, keyed on .app.game[data-chain]). Proof: 4× CPU CDP trace over 25s of play, main-thread work 19.3s → 5.9s, long tasks 64 → 22.
- Known red: pacing.test (a rival's turn is ~0.4s over its cap since the prices). It's on todo.md; trim the pace, never the cap.
- Everything else Cory decided tonight is unbuilt and listed under "Build queue from his answers" in todo.md, with his calls in decisions.md.
- Tooling: `V4_QUICK_E2E=none|file.mjs` makes check:v4:quick skip its full hot-seat game (Cory: test only what changed). After `npm ci`, Playwright's bundled headless shell is missing; scripts must pass executablePath '/opt/pw-browsers/chromium' (the e2e scripts already do).

## Backlog thread, wound down 12:30am Eastern (Cory low on usage)
- Public: v0.6.2 (source f9a419f, main 15e674c). Shipped tonight on top of v0.6.0: v0.6.1 (turn words: Crunch Time back-to-back, snake order on the round card, extra turns named, used members credited, one-line magenta steals) and v0.6.2 (round-end followers fly from their real sources). Each passed the quick check on its exact commit.
- The backlog is triaged in design/backlog-triage-2026-10-17.md. Start with its CLAUDE list (item 1, the browser suite back to green, belongs to whoever picks up the full gate). Cory's open calls are numbered at the top of design/todo.md.
- Parked work and next steps: design/in-flight.md.
- Echo dead end (friend report): fixed by c8dd8a99 on Oct 16; ~900 engine/jsdom/browser runs found no stall since. Kept closed unless it's seen again.
- Cory's working calls tonight (working-with-cory.md): backlog in batches of 5–10; a go-live note per ship with version, concise change notes and a screenshot; price nudges are Claude's (measured, logged as gut calls); progress every 5 minutes while he's waiting.


## SHIPPED v0.6.0 — 2026-10-17 7:32pm Eastern
- Public: v0.6.0, source 41f09d86749401c1577bbd569921ed59c32ab46b, main 11c3ee2 (play/build.json). Published with v4-play.sh logic from a box that can't reach github.io, so Pages was confirmed through its Actions run, not the served stamp.
- Verdict gate on 41f09d8: unit + build PASS; 15/30 browser tests FAIL. Same gate on v0.5 (6c1e97e): unit FAIL, 15/30 browser FAIL. Failing on both: hotseat (only "hovering a space did not show its card"; the 4-minute timeout is load: alone it finishes ~3 min), touch, benders, members, pay, payflow (stale save: tier:big illegal), sound, steal, travel, turndock, turnstory, layout, info, motion (assumes Steady; default is Relaxed). New on 41f09d8: tables (obsolete contract after Basic Blue left setup; fixed in the e2e) and phone-smoke (Kickback rival pick on a phone, the space card opens over it; phone out of scope).
- Logs: none durable; re-run `npm run check:v4 -- --commit <sha>` on a quiet box.
- First next action: bring the browser suite back to green (refresh stale saves, motion.mjs speed, hover-space card), then the HANDOFF items below that still apply.
- The gh-pages workflow is manual-only now (7a8fce9).


## Earlier: final stop checkpoint before v0.6.0 shipped (kept for its evidence)

- **Source candidate:f00f20e1246f30e979e22d9e6510744ccd366dce**, branch claude/gifted-newton-3lcy3i. Documentation commits above it may follow. Versionv0.6.0 is UNRELEASED.
- **Verified PUBLIC remainsv0.5 /6c1e97eb**. No new deployment was made. Do not confuse source pushed to GitHub with playable release.
- User explicitly stopped further work because usage was low. All agent lanes must remain frozen. Do not start new changes before inspecting this checkpoint.
- The19failures fromf27were repaired by preserved-coverage targeted passes: scoring71, card/payment/Poach142, replay2, motion15. Green hard-chain/save regressions32pass. **No combined full gate has been run onf00f20e1.**
- Actual full-game stall was found/fixed: rejected held gift/seat clicks started tracked decorative flights before rejection, preventing animation drain. Guard now runs before effects; actual completion cancels leftover estimated dwell. The old4minute gate is retained. Updated harness accepts automatic last draft and baselines settled per-round seat order. Dev diagnostic was invalidated by HMR; final immutable full-game proof remains REQUIRED.
- ExtraHand source-entitlement transfer is now implemented with physical-source tags, only unplaced grants move; alreadyplaced does not.67focused boundary/existing tests passed, real Poach path passed, and the exact final5-case transfer file reran5/5green. An invalid exploratory midround-copy fixture/API was removed; no claim that path is verified. Evidence:eval/handoff-2026-10-17/extra-hand-final.log. **Combined engine/game proof pending**, do not treat this as shipped.
- Version/changelog workflow added: visiblev0.6.0+buildref, npm version:v4 tool, publisher rejects reused release number/missing notes, build.json includes version/commit/time. Read design/releasing.md. Prior CHANGELOG retained; design/release-history.md reconstructs actualv0.2/v0.5 and deployment evidence without inventing versions.
- **First next action:** refresh replay corpus if ExtraHand source changes stale it, commit any fixture change, run immutable quick gate on exact source; fix genuine failures, complete local/online/phone and motion/scoring-arrival UI proof, then publish via v4-play and verify public version+fullSHA.

## Start here
1. Read this file, `.claude/rules/working-with-cory.md`, `.claude/rules/harness.md`, `design/todo.md`.
2. Read `design/feedback-audit-2026-10-17.md` (original113notes) and `design/feedback-addendum-2026-10-17.md` (new24triaged rows, mouse visibility includes both controls).
3. Check current branch and final evidence below before claiming anything is live.

## Repository and release boundary
- GitHub: `cojamz/patrons`, branch `claude/gifted-newton-3lcy3i`, existing PR#1. Pushes to this source branch are checkpoints; Pages serves main/play.
- Previous implementation checkpoint: **f27be278** (superseded byf00f20e1). All completed work is committed; documentation follow-up commits may sit above it.
- Last VERIFIED PUBLIC source: **6c1e97eb4bef2d4050f6dba1a70c94886f0ddd36**, main/playf71fd9a. Play: https://cojamz.github.io/patrons/play/ . Root/patrons redirects there.
- **Do not deploy the current source yet.** ea406700 built and1238tests passed, but its full browser game timed out4minutes. Later changes have focused proof, not a complete game pass. Resolve progression/coverage first.
- Final immutable build/unit check onf27be278: `scripts/v4-check.mjs --commit f27be278 --fast`; final results recorded in `design/eval/handoff-2026-10-17/final-check.log` when complete. This fast run deliberately has no browser verdict.
- Publish only a checked immutable source with `bash scripts/v4-play.sh <full-sha>`; verify full publicbuild.json source and actual desktop/phone UI. Do not treat a pushed source branch as a deployed game.

## Working with Cory
Warm, terse, precise updates. Own intake, triage, assignment, integration, tests and shipping without repeated nudges. A status question does not pause the work. Use parallel agents for independent tasks; quiet performance runs reserve CPU/browser resources, not all reading/editing. Preserve the charming existing design, iterate rather than redesign wholesale.

Visual verification is essential. Native screen capture was declined; isolated browser screenshots are authorized. No claimed visual check without actual inspection. New wording must be **precise and minimal**. Keep a persistent backlog and meaningful checkpoint board. Announce “Shipped—ready to test” only after verified public deployment.

Historical agent credit-error messages were mistaken for a new quota event; Cory corrected this. Do not infer current credit exhaustion from delayed agent notices.

## Completed source since the verified live release
- Actual-completion presentation boundary: legal lights/taken dimming/options/turn ownership queue together for local and online. Physical flight targets can mount earlier; stale input cannot submit. Completion includes finite destination settles, rolls and stage returns, excludes ambient loops. Skip/reduced motion settle immediately.
- Score-arrival fix: pending scoring awards withheld even during closing action; no early follower total/+tag or duplicate ordinary follower flights. Awards reveal via scoring arrival callback. Focused tests passed; latest browser proof pending.
- Swaps via side-by-side hub; permanent swap animation-counter leak fixed; aggregate Magenta steals travel once per resource.
- Shared exact wheel geometry cache. Layout equivalent across40configurations; fixture radius checks66%fewer. Quiet526profile: resource-chain spin318ms/17.7msworst at1x;324ms/34.2msworst at4x; no long tasks. Do not claim every device or lag path solved.
- Round-end pre-screen removed; competition starts on action completion, no fixed gap/lead or trailing400ms. Scoring rows initialized once. Summary entrance shortened. Full readable round-end redesign remains backlog.
- Own-color member competitions for all arcs except Gold/Silver/Yellow; printed multi-member counts apply. Engine/standings/rim/hover share scoring definitions.
- Sticky Fingers/Prospector state only their own bonus. Extortionist threshold: rival purchase5+followers. Cutpurse explicit resource choice from richest eligible rival. Poach no victim replacement.
- Go-Getter bought on final placement gets post-purchase activation/Endturn window; no second purchase; auto-skip unavailable uses/fullboard.
- Two-person LateBloomers; persistent named discount provenance; corrected glossary/help/recruit-vs-transfer rules; cancelled obsolete fallback preview jobs.
- Six final small UI tasks implemented: Basics removed from normal setup/migratedlegacy selections; payment shows ability; payment explanation removed; Yourturnnext→arrow with accessible title; Straggler pending dot; occupied legal Squatter tint stays lit. Focused tests pass; final integrated visuals pending.

## Verification evidence
-6c verified live: build,1203tests/1skip, fullhotseat,3-tab BroadcastChannel online, phone touch390/412, public affordability/details/sort/deck/Done. Online fallback shares storage; not independent remote devices/RTDB proof.
-526abdda: build+1220tests/1skip+fullgame pass; quiet contention evidence retained.
-ea406700: build+1238tests/1skip PASS; fullhotseat FAIL(timeout4minutes with seat-region movement warnings). Do not erase or mask this failure; determine harness vs actual progression.
-Exact ea realbrowser verifier PASS: swap1270, touchswap390, Magenta1270. Four travel legs, hub separation68px, correctowners,3stolenunits once, chainidle, no errors/overflow. Initial false failure was test waiting for no-chain before chain started/counting hub hops. Durable corrected script: `e2e/v4/motion-verify.mjs`; requires V4_URL immutable preview, matching source fixture.
-Latest focused: owncolor/Poach92; payment/setup12; cues12; scorearrival/finalscore8. Updated originalscoring contracts in market/purple/echo/trading; final market+roundendwords34pass. Combined newer snapshot requires final result review.
-Evidence directory: `design/eval/handoff-2026-10-17/`. Do not depend on /tmp from this machine.

## Next actions, in order
1. Inspect finalf27fast check results and repair genuine failures/obsolete contracts without weakening coverage.
2. Diagnose ea full-game timeout under actual completion boundary. Use real browser and inspect where progression stops. Also inspect seat-region movement warning; do not hide it by removing checks. Rerun complete local and online games and phone touch on final immutable source.
3. Verify scoring withholding/arrival, no pre-screen, final summary, changed own-color scoring and new payment/cue UI on laptop/phone. Run Green Encore/Reprise/Echo chaining pressure tests.
4. **ExtraHand verification remains PENDING; source implementation now inf00f20e1.** Confirmed rule: only unplaced extra minion transfers; alreadyplaced does not. Current extra-turn tasks lack sourceUID; correct fix needs provenance in roundstart+workersNow paths and preservation through partially active/deferred turns, left/workers/order updates once, copy/repeated-transfer tests. A naive+1/-1duplicates turns. A complete source-tagged implementation was subsequently added with focused tests; final integrated proof is still required.
5. Execute remaining clear backlog batches; park only ambiguous design calls. Original113plusaddendum retain all notes. Bodyguard already has explicit existing protection regression against Shakedown/Poach/DoubleAgent; verify test and report protected rather than silently change.
6. Publish checked candidate via v4-play, verify public fullstamp/UI, refresh audits/board and notify Cory succinctly.

## Process state and cleanup
No agent should be assumed active after handoff. All agent edits frozen; all root previews5298/5300/5302 stopped after verification. Finalcheck may finish during documentation wrap; record its outcome and stop leftover owned processes. Scratch source/build exports live under /tmp only; source checkout remains shared and committed. Older handoff archived in `design/archive/handoff-before-2026-10-17.md`.
