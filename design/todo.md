## Active backlog batch — October 19

- [ ] Payment passives above selector, tighter spacing — payment_polish; preserve money interactions and ability.
- [ ] Member hover costs aligned right, redundant ownership removed — member_hover_polish; preserve effect grouping and full rules.
- [ ] Details toggle works in all game states — details_toggle; preserve explicit reading preference and legal choices.
- Root integrates, checks desktop/phone and ships together. No balance edits; Magenta discussion separate.

## Shipped October 19 — v0.8.3

- [x] Larger shop cards; stable compact/details grid without normal desktop scrolling. Full long-rule/price bounds checked across eight viewport/color cases. Evidence: eval/shop-sizing-v083/.

# Latest: Red deck / Green / unified shop — v0.8.2

- [x] Build twelve-member Red deck and confirmed bodies/costs, including Loyalists and Panel’s “another member” rule. Spec: spheres/red-members-2026-10-18.md.
- [x] Both member copies skip copied On Recruit; preserve future triggers/weights/workers. Resolve demonstrated Panel/Stunt repeat via Panel rule, not an extra chain restriction.
- [x] Chorus count and Copy Previous owner/target fixes; bold timing keywords; unified follower/member shop; stale swap highlight and fast phone Recruit sheet fix.
- [x] Scoped unit/UI and actual desktop/phone recruit/swap/follower-purchase motion checks. Exact release/public evidence: eval/red-members-v082/verification.md.
- [ ] Phone wheel wording/layout: Magenta Round III Ransom label still overlaps adjacent space in the four-arc phone proof; existing precise-wheel-text pass remains required.
- [ ] General animation audit remains open. New Red flows verified; Cory’s unspecified missing Green/Red animations are not a blanket all-fixed claim. Intake: feedback-audit-2026-10-19.md.
- [ ] Replace temporary names Recruit Bonus / Movement Penalty when Cory names them; higher-fidelity art remains separately queued.

# Latest: v0.8.1 resource contests

- [x] Red and Green contests use held red/green resources; other arcs and half prizes unchanged. Immutable build, focused rules/UI checks and desktop/phone last-move scoring flows pass. Evidence: eval/resource-v081/verification.md.
- [x] Red prices and defensive slot implemented in v0.8.2; Mob5/Panel3/Loyalists2 verified. Source of truth: spheres/red-members-2026-10-18.md.
- [x] Before Panel ships, pressure-tested active acquisition/re-entry chains; pricing alone cannot guard infinite Recruit loops.

# Red design intake — confirmed action spec

- [x] Shipped Red action redesign as v0.8.0 (216 focused tests; six public desktop/phone scenarios; eval/red-v080/verification.md): spheres/red-redesign-2026-10-18.md. Promote/Demote target any cult; equal-cost swap any two members; acquire-for-yourself Recruit triggers only.
- [x] Red member redesign built and shipped as v0.8.2. Twelve active members; Family/Big Family retired. See current spec/evidence above.
- [ ] Universal inherent1resource per action is a direction; do not silently apply it to other colors as part of Red.

- [ ] Red picker polish: keep phone turn toast clear of choice sheet; include both outgoing and incoming member in shop-swap turn toast. Existing selection/ownership/buy flow works; observed during v0.8.0 public browser review.

# Shipped: Green v0.7.0

- [x] Implement agreed actions, inherent +1 Green, fresh choices through copies, cycle prevention and serialized branch/recruit continuations.
- [x] Implement all twelve agreed members and confirmed costs; retain working names and documented placeholder costs.
- [x] Migrate obsolete Green contracts; pressure-test copy-all, nested recruit, copied members, Agents/Bait, save/load and full-game progression.
- [x] Check exact immutable v0.7.0 build, desktop/phone nested copy UI, publish and verify public source stamp.
- Scope/source of truth: spheres/green-redesign-2026-10-18.md. Equal deck sizes across other colors remain separate backlog work.

# v4 to-do

Current feedback section reconciled 2026-10-16; later historical sections retain their original context. Exact verified live source and current checks: `design/in-flight.md`. A box is ticked only when code or a gate proves it, not on an agent's report; where it isn't obvious, the proof is in brackets.

Cory's rule (2026-10-14): anything that makes the game playable by humans comes first. Bots and agent tooling only as far as they serve that; no rabbit holes.
Shipping: checked incremental fixes ship promptly under current working instructions. A− is the finished-build goal; historical panel requirements do not block authorized iterations.

## Cory's open calls (2026-10-18; answer by number, default in brackets)
Answered 2026-10-18 at 9pm Eastern; his answers are logged in decisions.md. A pitch thread is handling Sweet Talk, Hold Court, Goody Bags, Cheap Seats, Silver's counterweight, Catch Up, Overseer and Bandwagon.
3. Magenta: Crime Wave "take 3, at least 1 from each" equals Redistribute at 4 players. He asked for a recommendation. [Redistribute → "Take 3 resources from one rival", so it hits one rival hard where Crime Wave spreads the pain]
11. Greatest Hits repeating a copied Echo's gain: what's intuitive? [no: Greatest Hits repeats the space's own gain, which is what the card's words say]

## Build queue from his answers (2026-10-18)
Not built (Cory out of credits, 2026-10-18 9:40pm Eastern). His exact calls are in decisions.md under "Cory's answers to the open calls". Also:
- [ ] 12 coins animate as 12 coins, for any count (no bundling). Tried: every unit its own piece with the stagger tightened to ~200ms spread; it pushed pacing.test over its cap (22970 > 21060), so it was reverted. Needs the pace trimmed elsewhere first; never raise the cap.
- [ ] Details toggle sometimes doesn't respond: it must work at every moment (animations, rival turns, pick and pay steps).
- [ ] Payment screen: move the passives lines from the bottom to the top and tighten the screen.
- [ ] Steals are unbounded except by steal blocks. Grifter keeps only its first sentence.
- [x] Pacing: v0.7.0 trims stationary stage hold; longest wait21,041ms is below unchanged21,060ms cap.
- [ ] The rest of the lag: with the idle animations stopped during moves, React commits still run 80–130ms at 4× (planChain measures places with getBoundingClientRect; GameScreen re-renders). Parked speed diffs in /mnt/project-files/handoff/speed/ no longer apply cleanly.
- [ ] Retinue is worth 3 followers.
- [ ] Help Yourself goes 2 / 4 / 6 by round.
- [ ] A third shop toggle that fades unaffordable members.
- [ ] Cut Social Climber and replace it with a Claude fill-in.
- [ ] "Pants": apply the Max easter egg (taller). Taking a member from another cult counts as a recruit; a member given to you doesn't.
- [ ] Make the yellow on the wheel read yellow, not lime.
- [ ] Show the snake order during round I's resource draft.
- [ ] Top Up scales by round. Feastmaker becomes Chefs, is a little cheaper and counts as at least 2 members.
- [ ] Neutral (guest) cards stay neutral: no sphere color.
- [ ] Drop every cost reduction for now (rework later), with fill-in abilities for Intro Offer and the other discount cards.
- [ ] Every color has the same number of members (Recluse moves out of Blue).
- [ ] With details on, members fit at 1270×700 with no scrolling and their full text.
- [ ] Remove "its color isn't on the table".
- [ ] Player-card member hover: cost on the right, one clean line per member, no "whose it is" line.
- [ ] Animate the member shop refreshing at round start.

## Cory's voice note, 2026-10-18 late (historical Green proposals superseded by shipped Green spec)
- [ ] Scaling text as "I: … / II: … / III: …" lines, dimming the rounds that aren't current.
- [x] Green actions replaced and inherent +1Green shipped in v0.7.0; current spec supersedes these earlier pitches.
- [x] Green copy chains shipped with branch-safe persistence and pressure tests in v0.7.0.
- [x] Green member redesign superseded by the agreed twelve-card v0.7.0 spec; [ ] Chronicler rename and equal counts across other colors remain.
- [ ] Rework Bookkeeper. Rework most of Blue. Retinue: more members, more followers.
- [ ] Member card: total cost as a small number top right.
- [ ] "Player took X from you": shorter, near your player card.
- [ ] Clarity motion: recruit flies to the middle, shows its effect, goes to the buyer; steals show what's taken; action effects play beside the action; a Hearthstone-style stack of bulletin cards before the log.

## Cory's ideas, 2026-10-17 evening (triaged into batches by the backlog thread)
- [ ] "The follower shop needs to be a bit bigger." On-screen size at ~1270×700, a modest bump that keeps the layout. Batch: laptop layout.

## Handoff batches — October 17

Implementation checkmarks below mean focused code/tests passed, NOT public deployment. Sourcef27be278; combined full-game progression remains blocked by ea timeout. See HANDOFF.md for exact next steps.

Every report is recorded here before implementation. Root owns triage, assignment, integration, verification and publication; status questions do not pause execution. Original113-note ledger: `feedback-audit-2026-10-17.md`. Additional reports below are separate from those113. A batch is shipped only after its immutable checks and public verification.

### Batch A — animation boundaries and round transitions (P0, in progress)
- [x] A1: Legal-space lighting, taken dimming, turn ownership and options advance together only after actual sequence completion. Local and online; no stale input. Owner: motion agent. Check: controlled chain-end UI tests plus real browser local/online transitions.
- [x] A2: Include home flights and final settle/roll in completion; skip and reduced motion land cleanly, no deadlock. Owner: performance agent. Check: director lifecycle regressions and real swap/end-round visual verification.
- [x] A3: Remove “Round X Ends” pre-screen. Start competition directly; use existing animation for necessary cues. Owner: card/UI agent. Check: no pre-screen and competition/results still complete.
- [ ] A4: Diagnose and fix result-card appearance lag. Owner: card/UI agent. Check: isolated production browser transition and measured frame gaps; no claim from static review alone.
- [ ] A5: Swap loop leak, aggregate-steal duplicate flights, shared wheel geometry cache and round-start net income. Implemented526abdda;1220tests/build/fullgame green. Exactea desktop/phone swap/steal visual proof passed; no live claim. Broader round-start choreography remains partial.

- [x] A6: Round-end award totals and “+followers” indicators appear only after that reward lands, never before competition animation. Owner: motion/UI agent. Check: pre-award oldtotal/no+tag; postlanding update; final bonuses follow same boundary.

### Batch B — precise card behavior and wording (P1, implemented awaiting integration)
- [x] B1: Sticky Fingers must not imply it doubles. Text: “Your steals from spaces take +1 resource.” Prospector also states only its own bonus. Owner: card agent. Check: unchanged engine ordering and exact text.
- [x] B2: Shakedown artwork advertises≤4, matching legal targets (was≤6). Owner: card agent. Check: engine/art contract regression.
- [x] B3: Newly bought Go-Getter remains usable after final placement, when spaces remain. Offer activation or Done without a second purchase; correct UI labels. Owners: card engine + motion UI. Check: engine activation/Done/full-board/JSON-resume and browser UI.
- [ ] B4: Two-person Late Bloomers, named discount-source explanations, confirmed-rule glossary/help corrections and cancelled stale fallback previews. Implemented526abdda; focused/full checks green, 526card/tap visuals passed; later changes need integrated visual check. Owner: root integration.

- [x] B5: Extortionist triggers when a rival buys5or more followers in one purchase (existing6threshold→5). Owner: card/rules agent. Check:4excluded,5included; exact card text and engine agree.

- [x] B6: Cutpurse does not offer resource choice. Implemented explicit color choice on recruit and round start;1resource from richest eligible rival, no space multipliers. Regression selects gold over larger red pile and excludes poorer rival. Integrated checks pending. Owner: card/rules agent. Check: chosen victim/color/amount resolve exactly.

- [x] B7: Arc competitions default to members; Silver/Gold/Yellow unchanged. Confirmed own-color members; preserve printed member quantities. Owner: card/rules agent. Independent fixes continue.

- [x] B8: Magenta roundIII Poach takes rival member with no replacement recruit. Owner: card/rules agent. Check: ownership/guards intact, shop unchanged, no replacement pending; text agrees.

### Batch C — remaining original feedback (triage continues)
- [ ] Suspected Good Deed misclick: all tested color/recipient branches resolve correctly; no defect reproduced. Keep report open for actual reproduction, do not mark fixed.
- [ ] Separate clear defects from balance changes and unresolved referents in remaining113-note ledger. Implement independent clear fixes; park only the ambiguous decision itself.
- [ ] Follower-shop experiment already completed48 paired Normal-bot games; reconcile ledger status with report `eval/2026-10-17-no-follower-shop.md` rather than rerunning.

## Cory's play notes, 2026-10-16 (implementation tracked)
Original note: `play-feedback-2026-10-16-original.txt`. Item-by-item code audit: `feedback-audit-2026-10-16.md`. Checked items are implemented; see in-flight.md for the verified live commit. Ideas remain design backlog; use Cory’s current instructions and go-with-your-gut defaults rather than old open-call lists.

Cards and wording
- [x] Late Bloomer → Late Bloomers, worth 2 followers, not counted in the follower comparison. *idea:* maybe 3; start making members worth more followers.
- [ ] Crescendo: "more each round" is confusing. *idea:* show I: 2 green, II: 4 green, III: 6 green on the card, gray out the rounds that don't apply.
- [ ] Golden Years: same fix as Crescendo.
- [x] Card timing reads "on recruit" and "at round start" (not "Now").
- [x] Reviewed all 54 specialized action descriptions; corrected misleading text and shortened crowded wheel phrases. First-play comprehension remains open.
- [x] Snap Up explicitly describes the optional paid extra recruit and normal-buy distinction.
- [x] Night Owl states rounds II–III, last placement, one extra turn if room, once per round.
- [x] "Copy space taken since your last turn" → copy the previous action (the one picked on the previous turn, rival or you on a snake double turn).
- [x] Encore → copy any space with a minion (phrase it elegantly and precisely).
- [x] Greatest Hits → repeat all actions where you have a minion.
- [x] Reprise drops its +2 green; copying is good enough.
- [ ] Crescendo and Hum don't fit the card.
- [ ] Member texts WAY more efficient, keeping elegance and precision.
- [ ] Sweet Talk is awkward: something completely different.
- [ ] Hold Court: he doesn't like it; reads like a member ability.
- [ ] Heir is too expensive.
- [ ] Goody Bags is a better Toast and a better Good Deed: needs something more clever.
- [ ] Cheap Seats needs to be different. Sob Story is good.
- [x] Toast: the gift to rivals grows 1 → 2 → 3 by round.
- [ ] Rising Tide is good. *idea:* give everyone else TWO silver.
- [x] Competitions drop tiebreakers; ties all score.
- [ ] *idea:* some members worth 2 followers (Snob, maybe renamed Chatterboxes or Gossips).

Spheres and themes
- [ ] Action names: bring them in line with a "Cults" theme.
- [ ] *idea:* blue as sophisticated/social; tease deeper themes out of each sphere; members themed with their sphere.
- [ ] Silver members play on everyone having lots of silver: pricier, or a dynamic other than spending it. Silver's round III action is bad; tie it to that theme.
- [ ] *idea:* silver rounds II–III reward getting RID of silver members (discard one for lots of resources or followers).
- [ ] White needs a rework he can't pin down yet. Likes fewer followers as a catch-up.
- [ ] Patron Saint is perfect for silver. *idea:* 1 follower per silver member in play (max 10); maybe then it costs more, though cheap lets people fight for it early.
- [ ] *idea:* every sphere has an end-game member for members (usually of its color; yellow maybe "+2 per color you have a member in", phrased better) and one for resources: two paths to end-game points, at odds.
- [ ] *idea:* one reverse sphere: actions gain followers and its members cost followers plus wilds (synergy with green).
- [ ] *idea:* one sphere about action manipulation, defensive, blocking what others want. Goal: clearer what rivals are after, more counterplay in action picks.

Economy and follower buys
- [x] Fewer follower buys: 1 or 2, then 5 for 5, 10 for 10 (see open call). Lets you grind followers on turns you can't buy a member.
- [ ] *idea:* tone resource gain down. Spheres give too much; balance actions that do interesting things vs ones that give resources, and buying members for effects.
- [x] *idea:* fewer members in the shop, maybe 8, freeing a row.
- [x] Keep member release (Cory’s later correction); explicit Release entry added when legal.

Board layout and player cards
- [ ] Member card text on the card itself if it fits; "1 [follower]" or just the follower mark instead of "+1". Keep their charming design.
- [x] Take-a-free-member screen: larger cards show full abilities; checked on laptop and phone.
- [x] Remove "EACH ROUND X" from player boxes; drop "Members X" and SHOW more members, collapsing only rarely.
- [ ] *idea:* log in the middle of the player boxes, two on each side.
- [ ] Minion display on the player box more efficient; follower number better, or different text than the player name.
- [ ] Currencies sit in a weird spot.
- [ ] Shop: drop some members (a whole row), redo the follower shop more noticeable and more compact, give player cards a bit more room. Not a huge change.
- [x] Hover anywhere on a player card's empty space opens their member list (keep the current hover).
- [x] Player-card hovers don't say "you're short".
- [ ] Members too dim, both tinted and active. Follower shops not lit enough either.
- [ ] Can't find how to release a member.
- [ ] Contest arc: followers and emoji off-center from the text. Follower mark distinct from text: a sheen or glimmer, charming-sinister.
- [ ] Opponents' points and engine aren't intuitive even with numbers shown.

Animation and lag
- [x] Default animation speed Relaxed.
- [ ] Round scorecard screens laggy and slow to fade in (likely the broader lag).
- [ ] Action order top to bottom, everything shown: Toast +3 silver to you, +1 silver to rivals, then Majordomo pops in with +2 silver. *idea:* everything that goes in the log flies into the log.
- [ ] *idea:* members pop out of the right side of the player card when they act, maybe with a speech bubble.
- [ ] Unexplained animation right before round end: followers fly out of the piles toward every player (not the contest followers).

End of round and end of game
- [x] Member end-game bonuses go in with the end-of-round animations (he won by 1 thinking he'd lost).
- [ ] End-of-round animations: good design, need smoothing.
- [ ] End-game screen loads slowly, layout is bad, totals animate being calculated for no reason. Polish.
- [ ] End-game tiebreaker unclear (is it members? see open call).

Rules clarity
- [ ] Make it clear the turn order is a snake draft.

Parked on other branches (not on this line; re-fit before shipping)
- [ ] Minion on press, spin on the compositor: 6543c7f on `claude/project-thread-z7shxv` (also /mnt/project-files/handoff/speed/minion-port-on-df5eac1.patch); conflicts with the 2/3/4-sector wheel, re-port Wheel.jsx.
- [ ] Bots never swap back a member they swapped away: b1ae1db on `claude/project-thread-gw4tce`. Its decisions line (87f94fc) is here, the code fix is not. Cherry-pick and quick-check.
- [ ] Smarter Hard bot, parked on purpose: 041dc63 and e527a80 on `claude/project-thread-gw4tce`.

Open calls for Cory (sent 2026-10-16, defaults in brackets)
- [x] Follower buys 1/5/10 (smallest-buy default applied).
- [ ] End-game tiebreaker: most members, shown on the final screen [yes].
- [x] Keep release (Cory explicitly retracted removal). Its discoverability remains above.

## New friend play reports (2026-10-16)
- [ ] Echo can leave a player unable to continue; they used Undo. Reproduce and fix.
- [ ] Wheel design liked, but playing areas take too long to recognize. Subtle colored slice outlines implemented; assess first-play clarity. Friend initially missed inner II/III rings and tutorial’s “lit tiles”; later understood gold/available, dim/taken, dark/future. Improve onboarding without discarding working state cues.

## Later: gate failures seen while shipping White's "Fewest followers" (2026-10-16, a729aa6, quick check on the live tree)
- [ ] hotseat e2e: shop member names overflow their box (Lottery Winner by 3px; Sponsor, Patriarch, Speculator, Stunt Double cut by the app frame).
- [ ] fire-audit unit test "every recruited member with an effect is named acting at least once" fails (one member never named); the audit's table skips White, so not White's. Re-run alone first: the box was loaded.

## Now (2026-10-15 evening, after Cory's B+ play)
- [ ] Strip room at 1270×700 (turnstory t2/t2b): taller seats squeeze "since your last turn".
- [ ] Unit suite to today's rules (see in-flight.md).
- [ ] pay.mjs save for the new Cheap Seats ("dialog-save: never reached P1 on cheap"; the price thread stopped before fixing it).
- [ ] Pacing tune: pacing.test "a rival's turn and the wait between your turns" longest wait 15973 ms vs the 15600 cap since the price calls (more buys per turn). Trim the pace; never raise the cap.
- [ ] Cory's call: thin deck at 2–3 players (deal guest members from other spheres? [yes]).
- [ ] Cory's call: Greatest Hits repeating a copied Echo's gain [no].
- [ ] Still from his notes: gold vs yellow members more distinct; animation lag late in the game; Sweet Talk simpler (incremental); "follower claims" visibility (incremental).

## Earlier: Cory's notes from this morning, in this order
- [ ] **Balance calls waiting on Cory (2026-10-16, from the balance thread).** Live and built: six prices, Trade Seeds +2 then swap, Cheap Seats +1 follower per 3 white, 2 for 2 followers. Open, each with Claude's default in brackets: (1) Rush Hour "+1 purple per 2 minions on the board" in Overtime's place is built and live; the name and rule are Claude's fill-in [keep]. (2) Intro Offer "your next member costs 4 less" → "+2 gold, plus 1 per gold member you have" [yes]. (3) Sweet Talk → "+4 silver, then swap up to 4 of your silver for one other color" [yes]. (4) Red's contest counts members, not their followers [keep the count]. (5) Magenta keeps "most magenta members" [yes]. Overtime's "show the extra turn on screen" no longer applies (it's off the board). Also check: White now scores fewest followers (another thread), while Cheap Seats pays for white held.
- [ ] **Pacing gate red since 2-for-2** (src/test/v4/ui/pacing.test.js, "wait between your turns"): the longest wait is 15973 ms against 15600 (seed 7, seat 3, six rival turns). Tune the pace, not the cap. Global trims barely move it (pieceStagger 50→30: 15709). An unfinished director.js attempt is in the balance thread's scratchpad (director-wip.patch), unverified.
- [ ] (Cory, 2026-10-15) End-game scoring animation that shows where every point comes from: followers score on their own; then each member pops a small +x over its head for the people in it, then a second round of pop-ups for followers it grants (like Recluse). First in the next round of work if it doesn't fit the A− loop.
None of these is done. Each also becomes an answer-key item (design/eval/critic-calibration/answer-key.md, Part 3) and a gate.
- [x] **Hover lag** (speed thread, live since df5eac1): hovers wait 200 ms (HOVER_DELAY_MS, src/v4/game/hoverDelay.js), are drawn hidden meanwhile and open whole in one frame (4× CPU: seat 233 → 52 ms, member 268 → 51). Gates time from the end of the wait and fail a card that fills in. Cory: "way snappier".
- [ ] **Speed, open (Cory 2026-10-16 on df5eac1):** (1) lingering on a member card, its little motion takes a while to start (the 200 ms wait, then the Tip's own entrance): start it at once after the wait. (2) Hover "still a tiny bit wonky", he can't say why: film it frame by frame (position shift, reflow, swap between neighbours, nub) and fix what moves. (3) Ends of animations still laggy, worse late game and when members land on seats; suspected (not proven) landing-time work: the seat re-renders and layout is read as a card lands (~500-element commits with 30–95 ms forced layout at 4×). Unshipped speed work in /mnt/project-files/handoff/speed/: minion press 355 → 85 ms and the wheel spin on the compositor (minion-port-on-df5eac1.patch: passes quick on df5eac1, conflicts with the 2/3/4-sector wheel in bc019a2, needs a re-port of Wheel.jsx), table (own turn card in a small store, #root:has() → a flag), seat (cs-bob on transform), shop, space (You'd get precompute), late (scripts/v4-late-flights.mjs probe, no fix yet). Idle animations cost ~190 ms of style per 4 s at 4×; cs-bob animating `translate` is the biggest.
- [ ] **Pass is hard to find.** Move it into the shop column as "Done, no buy", under the follower buys. (Today it's a small "Pass" button in the buy step's prompt, `GameScreen.jsx`.)
- [ ] **Turn-order rail is confusing** ("in 4 ×2", dots, arrow). Remove it. The seats already sit in turn order and the one playing glows; add a quiet "next" on the following seat, "next · twice in a row" when the snake doubles back, and "your turn in 3" on your own seat. (The rail is `.cs-order` in `CultSeat.jsx`; turnstory.mjs t1 checks its chips and must change with it.)
- [ ] **Wheel emojis too big and out of line.** Rim leaders smaller, upright like the lettering, inside the rim band; minions on spaces smaller and tucked at the panel's edge, never over the words.
- [ ] **Gift/steal picker beside the space.** Good Deed's two-step gift (your color stack in the corner, then a seat) is "very bad/confusing". A small card beside the space you just took: your colors as big dots, then the rivals' faces. Two taps, your eye stays on the wheel. Same for every gift and steal.
- [ ] **Animation pace.** Too fast even on Relaxed, and not smooth. Relaxed about 2× Steady, Steady a little slower (today `SPEEDS` in `src/v4/motion.js` is quick 0.5 / steady 1 / relaxed 1.55). Then re-check smoothness by eye on the live build (the wheel-shadow fix, c8f3e3f, may already have fixed the choppiness).
- [ ] **Purple and Catch Up, once Cory answers.** "No board action should require spending." Proposed: Overtime "Take 1 extra turn right after this one", Crunch Time "Take 2 extra turns right after this one" [yes]; trades (Cheap Seats, All In, Sell High, Trade Seeds) don't count as spending [no change]; rework Corner-Cutter later [yes]. Catch Up never pays its bonus (your own minion is counted first, so in a normal snake nobody is ahead of you): "+1 purple, and +1 per rival who's placed more minions than you this round", counted before yours lands [yes]. He also got nothing at all from it: check that the +1 is granted. (Code today, `content/purple.js`: Catch Up "+2 per rival with more minions on the board than you"; Overtime "Pay N purple: take 2 extra turns".)
- [ ] **4× CPU perf regression** (quiet-machine run on 0c1cd51, design/eval/perf/quiet-final-0c1cd51.md on claude/cults-perf-final). Against 8ea3e24: wait for your turn 12.0 s (was 9.5 s), blocking 23–24 s (was 8–9 s), first click 2.1–2.6 s (was 1.1–1.3 s), a placement shows in ~0.9 s (was 0.4–0.5 s). Something between 8ea3e24 and 0c1cd51 added main-thread work; look at the forced layout in the first click and in the React scheduler frames. At 1× it's the quickest build yet (hovers 30–40 ms p95). On a normal laptop (1×) the wait is 9.5 s, the fix Cory saw; this is the slowed-down test only.
- [ ] **Stale preview / hosting move (pending Cory).** The preview shows a pre-10:00 build ("Ransom a member", "2 extra turns for 8"). Cause not confirmed: likely ~60 overnight pushes used up Netlify's free credits, or a build failed. Proposed [yes]: move to Cloudflare Pages (500 free builds a month; Cory connects the repo once). On any host: checkpoints go to a WIP branch, only gate-green builds deploy, and check the preview's build stamp before sending a link. Also gives the stable release link below.
- [ ] **Fresh blind panel to A−** (2 screen-only testers + game-skeptic, quiet remote machines), after the last fix round, on the build Cory will open. Nobody has graded 0c1cd51; the last grades (8ea3e24) were C+, C+, B− (hobby gamer), B− (skeptic). "The design is still clunky": a design pass graded to A−, with his notes as the answer key.
- [ ] **The morning note's calls 1–10** (design/morning-note.md), all unanswered. Call 9 (balance pass 3: 25 members repriced) is the biggest.

## The design pod's closing lists (what's left, worst first)
Full lists: design/eval/design-pod/log.md ("Closing (art director…)"), details.md and queue.md ("Closing (detail designer, 12:55)"). Laptop items first; phone is out of scope.
- [x] The turn card can credit the previous move's lines (trail.js turn segmentation): a member used before placing (Tribute Band) now keeps its own gains (turn-story-fixes.test.js).
- [ ] At 900×600 a rival's four stacks crowd its total and minions (the three-row chair applies from 680px tall only).
- [ ] Silver, white and colorless members look alike at card size; white/silver colour ground reads as a grey status halo.
- [x] The steal toast tells the same coins twice (magenta and "from P2/P4"): one line, "1 gold from P2, 1 red from P3, as magenta".
- [ ] Hover p95 117–222 ms on a loaded box (info.mjs (d)). Folds into hover lag above.
- [ ] A minion runs past its panel's edge on space 0-1, red/yellow/market/thieves table (spaces.mjs s9). Folds into the emoji item above.
- [ ] Shop refill seen sliding cards once; not reproduced.
- [ ] The snake rail has only a native title (one tester read it as a scrollbar). Goes away with the rail.
- [ ] With a turn card up at 1270×700 the strip often holds one line.
- [ ] Large screens (≥1600px): the side columns don't scale with the wheel (zoom proposal in queue.md).
- [ ] Trade Seeds' "Swap nothing" read as part of its caption.
- [ ] Phone (later): rail pills over rivals' totals, hub text into the medallion, own turn card over the wheel, game-over seats repeat rank and total, 14px name targets.

## Milestone: friends build (Cory, 2026-10-14)
Finish every running process and to-do, then a multiplayer version Cory can play with friends.
- [x] Land the overnight agents' work (77b3618: overnight done; final build 0c1cd51)
- [ ] check:v4 green on a committed snapshot. On 0c1cd51 the full gate failed 6 of 20 lines on a quiet 4-CPU box, but every failing file passed run alone: the gate overloads the box by itself (load ~27). Needs a gate that doesn't fail on its own load.
- [ ] Online play verified on the real link: 2–4 real browsers, create/join by link, full game to results (blocked: this container can't reach firebaseio.com or netlify.app; see design/eval/multiplayer-readiness.md)
- [x] Friends-proof online: rejoin after reload or dropped wifi, a bot takes over a player who leaves, host can leave without killing the room, mismatched versions refused (src/test/v4/session/friends.test.js, versions.test.js, e2e/v4/online.mjs; tested in memory, over BroadcastChannel and on the RTDB emulator, not yet on the real link)
- [ ] A stable release link that only changes when Claude has verified a build. See the hosting item above.
- [x] One-page "how to start a game with friends": "Playing with friends" in the rulebook (How to play)

## 1. Playable by humans (always first)
- [x] Show the members for sale during setup (now all 10; touch.mjs gate k)
- [x] Reload near game end erases a hot-seat game (resume.test.js resumes at every step)
- [x] Undo pill stuck on "Placement undone" (hotseat.mjs gate)
- [x] Panel 7 fixes: choice panel over the buy row, shop text while placing, bot pacing, phone motion (touch.mjs g, layout.mjs l1, motion.mjs m1–m4)
- [x] Phone setup: hover card pops on tap, resource tray below the fold, page scrolls sideways (touch.mjs i, j, h)
- [x] Table picker: any 4 spheres, `?table=` (tables.mjs)
- [x] Buttons for Release, Straggler, Squatter, Insider's pile buys (benders.mjs)
- [x] Every card does what its text says, and every number traces to a log line (card ledgers A and B, cards-*.test.js, the fire-audit gate)
- [x] New follower costs in the rulebook; colors named for any table (layout.mjs l4, l5)
- [x] Every UI element has a hover with more info (long-press on phone); hovers open next to what you point at (info.mjs a, m, q)
- [x] Every choice picked on the board, no chip grids (steal.mjs, pay.mjs; the gift's two-step pick is what Cory now calls confusing, see Now)
- [x] Hardening: saves never crash-loop across deploys, error screen, "copy game record" + replay, bot errors never stall, a gate that runs every sphere test fast, CI (Recovery.jsx, saved.js, record.js, scripts/v4-replay.mjs, bot-failure.test.js, V4_GAMES=fast, .github/workflows/v4.yml)
- [ ] Later (engineering review): structured events instead of log parsing; shared verbs for copies; online auth rules; type checking
- [ ] (tabled by Cory) Live feedback tab + auto-fix pipeline: needs firebaseio.com / netlify.app allowed in the environment. Notes for later: deployed rules deny a shallow read of v3rooms, so clients also write an index at v3rooms/fbinbox/<id>; mount the tab outside <Recovered> in its own error boundary; reuse trackedState()/currentRecord() and Recovery's copyText. A copy-only tab (no Firebase) is a small safe first step.

## 1b. The look (plate 1b, Lamplit Table)
- [x] Pay by dropping coins into cost slots, then a clean pay sheet (touch.mjs l, pay.mjs)
- [x] Followers have their own mark, never ★ (info.mjs c); resources are the plain dot (info.mjs k)
- [x] Per-player, skippable pixel intro (Intro.jsx)
- [x] Layout: who | where | what to buy (seats left in turn order, wheel big in the middle, follower buys then members on the right; layout.mjs). Replaces "every cult at a corner, slim shop strip".
- [x] Shop cards show identity and price; what you can't afford is dim; the space under your pointer brightens what it would unlock (ShopCards.jsx; layout.mjs l1, info.mjs i)
- [x] Each player picks a pixel emoji; unplaced minions in a column on the seat (EmojiPicker.jsx, emoji.test.js). Replaces "minions float around the leader" (Cory's call).
- [x] The Reckoning: round end told quadrant by quadrant, totals climb as prizes land (reckoning.mjs r1–r8)
- [x] Every turn told in one place: turn card and "since your last turn" strip (turnstory.mjs t1–t8, turndock.mjs). Open: it can credit the previous move's lines (pod list above).
- [ ] Hover that feels instant. Gates pass alone (snappy s2 61 ms, info (d) 83 ms p95) but Cory still feels lag; see hover lag in Now.
- [ ] Pixel art: members look alike at seat size (call 8); pixel animations weak (Cory: "a little weak, good enough for now")
- [ ] Stretch: living cults (idle loops, reactions when an ability fires, the leader's gestures)

## 2. Balance (serves play)
- [ ] Balance pass 3 (call 9, design/eval/balance-pass-3.md): 20 members lower, 5 higher; not applied
- [ ] Big followers at ~25% with the final bots; members ~6–7 a player (pure follower buying wins ~10%, call 5)
- [ ] Fair-price test: screen every card, then a careful check on outliers
- [ ] Dead-window fixes: the rest of the ranked list in design/eval/cory-notes-2026-10-14.md §4
- [ ] Watch: White's 1-for-1 follower trades (Buy Low, Boom) vs the new costs
- [ ] Blue's direction and the "+1 when…" members as relative payoffs (calls 2–4)

## 3. Bots (only as far as they serve 1 and 2)
- [x] Easy / Normal / Hard, chosen in setup (Screens.jsx "Bot level", online lobby too; bot-level.test.js)
- [x] No hoarding, no recruiting everything (the Normal level: bot-levels.test.js guards the last buy; ~3.4 members a game against Easy's ~7.9, design/eval/top-tier.md)
- [ ] Improve the thinking bot: better rollouts and card valuation, fast enough for 4 at a table (Hard is back to 43% against three Normal bots after a planning fix)
- [ ] Later, only if bot prices keep disagreeing with Cory's feel in play: a bot that learns from its own games

## Phone (basic compatibility requested, 2026-10-16)
- [ ] Online, phone guest stuck on "Place here" (QA, 2026-10-15; design/eval/qa/online-phone-place-stall.png). ab783f9 removed the Place-here wait for board picks (the Sleepwalker stall); not re-checked on a phone. Next: on a quiet box, tap Place here and check whether the move reaches the host.
- [ ] The pod's phone notes (see the pod list above and design/eval/design-pod/queue.md)

## Waiting on Cory
- [ ] Purple and Catch Up (see Now)
- [ ] Hosting move to Cloudflare Pages (see Now)
- [ ] The morning note's calls 1–10
- [ ] Allow *.firebaseio.com, identitytoolkit.googleapis.com, securetoken.googleapis.com, *.netlify.app (or do the two-laptop check yourself)
- [ ] What the ~25% big-followers target is measured against [Normal bots on Classic, then a check with people]
- [ ] Bandwagon (Turnout) "+1 red per member recruited this round, by anyone" gave +8 red late in round I; tame it? [yes, bring one measured variant]
- [ ] Contest ties: every tied leader keeps scoring in full? [keep, unless the measurement shows contests are the meal]
- [ ] Rework candidates (design/eval/rework-candidates.md): judge by playing
- [ ] Action names batch 2: applied, pending Cory's grade (decisions.md; design/eval/action-names-calibration.md). Spaces show no names now (names only in the hover), so this matters less.

Settled 2026-10-14 (Cory's calls or Claude's logged gut calls, see decisions.md): Lamplit Table look; spinning wheel kept; pay by coins; Watchdog blocks Trade; loot stays magenta; Release on, refunds the colored part only, not in the round recruited; Late Riser; doubled discounts; the game always ends after round III and 10→10 is unlimited; Barter cut (Dividend); Even Swap replaces Scout; action names batch 1 and member renames applied; Investor/Sower set-asides return undoubled; only loose followers sell (White rework fixes Pawn); shop of 10; pixel art good enough for now.
Settled 2026-10-15 (decisions.md): plate 1b look (plain dots, follower mark, words, no names or pictures on spaces); every choice picked on the board; one Speed setting (Quick / Steady / Relaxed); shop cards show identity and price, ability in the hover; seats in turn order, re-sorted each round; minions in a column; action spaces' redesign (doorways and the three looks rejected; plate 1b instead).

## Latest handoff intake
See feedback-addendum-2026-10-17.md for every new report. Six small UI fixes implemented with focused checks. ExtraHand only-unplaced transfer is confirmed but NOT IMPLEMENTED; correct sourceUID provenance required. The round-end redesign, Undo reverse motion and hard Green copy-chain pressure tests remain open.

## Continued release work after handoff request
Cory authorized continued work and shipping while usage remained. Original f27fast result:1244pass/19fail/1skip, buildpass; full log in eval/handoff-2026-10-17/final-check.log. Those failures are being repaired with preserved independent coverage. New numbering/changelog workflow in releasing.md. Green chain pressuretests32pass. Motion lane resolving real Kickback progression and stale reverse-draft harness assumption; ExtraHand source-entitlement transfer assigned core lane. Do not read earlier “no agents running” as current state.

## FINAL STOP / next agent
User requested immediate stop and GitHub handoff. Sourcef00f20e1 contains targeted regression repairs, version/changelog workflow and ExtraHandtransfer implementation.19prior failures have targeted green proof; combined immutable gate/fullbrowser verification NOTRUN on this source. Start with HANDOFF finalcheckpoint; no further work was authorized in this ending turn. All remaining original/addendum ideas retained.
