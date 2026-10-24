# Patrons v4 backlog triage — 2026-10-17 (HEAD 8c5bdd50 = 41f09d86 + a how-we-work doc commit)

Unit run during triage: V4_GAMES=fast, src/test/engine/v4 + src/test/v4, 1273 pass / 1 skip / 0 fail (239 s). No browser/e2e gate was run.

Sources: todo = design/todo.md (only open "- [ ]" lines), audit#N = feedback-audit-2026-10-17.md rows that aren't LIVE6c1e97eb or Verified/preserved, H = feedback-addendum-2026-10-17.md.
Read across decisions.md, design/HANDOFF.md, git log, and the code (card text taken from a dump of src/engine/v4/content/*).
Duplicates are merged into one line, with every source ref listed.

## CLAUDE — clear intent, in priority order

### Correctness, progression, release blockers
1. HANDOFF first action + todo:Milestone/"check:v4 green": CLAUDE M. No combined gate has run on f00f20e1. Steps: run the immutable quick gate on the exact SHA, refresh the replay corpus if Extra Hand changed it, then diagnose the full-hotseat 4-minute timeout seen on ea406700. 628febbd says the rejected-click flight stall is fixed, but no full game has proved it. After that, run a full local game, an online game and the phone touch smoke, then publish with scripts/v4-play.sh. Also make the gate stop failing from the load it puts on the box (run fewer jobs at once).
2. todo:FinalStop + addendum "ExtraHand" + HANDOFF#4: CLAUDE S. Run the integrated proof for the source-tagged Extra Hand transfer (core.js:631, extra-hand-transfer.test.js). The code is in; only the combined verification is pending.
3. NEW (found here) Social Climber is a dead card: market.climber "Whenever you release another member, +2 of any color…" is still dealt (it isn't in cull.js CUT), but DEFAULT_RULES.release=false (core.js:25) since audit#40/#57. CLAUDE S: add it to CUT, or deal it only when rules.release is on. Cory may want a replacement later.
4. todo:Now/"pay.mjs save for the new Cheap Seats": CLAUDE S. e2e/v4/pay.mjs:340 (c2) still drives the old "Pay 1 for 1 follower" Cheap Seats card. The current Cheap Seats is "+1 follower per 3 white you hold (you keep the white)" and has no pay card. Remove or replace c2.
5. audit#98 "middle player went twice" + audit#99 "Crunch Time took 2 Next turns, non-intuitive" + todo:"Make it clear the turn order is a snake draft": CLAUDE M. Replay a record to confirm #98 is the snake turn plus extra/Crunch turns rather than a bug. Then make double turns readable on the board: the seat cue "your turn, then again" exists, but needs a visible reason ("Crunch Time: 2 turns", "snake: again").
6. todo:"Unexplained animation right before round end: followers fly out of piles": CLAUDE S. Probably fixed by the score-arrival / no-duplicate-flight fix (f27be278, score-arrival.test.jsx). Verify in a real browser at round end and close or fix.
7. audit#102 "Log did not indicate a Night Owl turn": CLAUDE S. The grant is logged. Add a visible "Night Owl: extra turn" cue on the turn card and strip, the same treatment as #7.
8. todo:Design pod/"turn card can credit the previous move's lines (trail.js)": CLAUDE S. Bug in trail.js turn segmentation. Write a regression with a reproducible seed and fix.
9. todo:Design pod/"steal toast tells the same coins twice (magenta and 'from P2/P4')": CLAUDE S. Check against the paired Magenta flight (ae2fc11a) and collapse it to one line.

### Human-playability UI
10. A4 + H06 + H17 + todo:"Round scorecard screens laggy/slow to fade in" + todo:"End-of-round animations need smoothing" + todo:"End-game screen loads slowly, layout bad": CLAUDE L. The pre-screen is gone (A3) and the recount is removed. Still to do: profile result-card appearance in a production build, then redesign the round-end and final screens so they're readable, hoverable for detail, and snappy (H17).
11. todo:Earlier/"End-game scoring animation that shows where every point comes from" (Cory 2026-10-15): CLAUDE M. Reckoning already adds sourced final bonuses. Still missing is Cory's picture: each member pops "+x" over its head for its people, then a second pop for the followers it grants. Fold into #12.
12. audit#50 + A5 remainder + audit#46 "sequencing of member effects not intuitive": CLAUDE M. Round-start choreography: home flights, then net income, then hooks and market refill, each as its own legible beat. Same cause-ordered rule as director.js.
13. H24 Undo reverses animation: CLAUDE M. Restore state immediately and play the finite visual sequence backwards without duplicate effects. Test undo both during and after motion.
14. H13 Follower/member buys need a clear purchase signal: CLAUDE M. Pulse the bought shop tier or card before its reward flies, keeping sequencing snappy.
15. H14 Stacks of 20+ resources look disproportionate: CLAUDE M. Add size or density tiers that keep exact counts and touch targets.
16. todo:Friend reports/"playing areas take too long to recognize" + onboarding "lit tiles": CLAUDE M. Slice outlines are live. Fix the intro/tutorial wording and cue ("gold = available, dim = taken, dark = future"; point at the inner II/III rings).
17. audit#111 steal wording + todo:"Member texts WAY more efficient" + H16 "Better organized wheel action text": CLAUDE M. A precise-and-minimal wording pass over member text, steal text and wheel layout (rule-style.md). No rule changes; show Cory a before/after sheet.
18. H19 + todo:pod/"Trade Seeds' 'Swap nothing' read as part of its caption": CLAUDE S. Reword Trade Seeds ("+2 yellow, then swap up to 3 of your resources for other colors") and separate its skip button. Any rule tweak goes to CORY.
19. H21 Hover costs on the right, visually cleaner: CLAUDE S.
20. H22 Group cards by effect type, then ascending price: CLAUDE M. Applies to the deck browser and the details view. Define stable categories, and don't change the live market order.
21. audit#13 "Safe this round maybe better icon": CLAUDE S. CultSeat.jsx:224 is a text pill. Replace it with a small shield mark and keep the title.
22. todo:"Contest arc: followers and emoji off-center; follower mark distinct (sheen/glimmer, charming-sinister)": CLAUDE S.
23. todo:"Minion display on the player box more efficient; follower number better" + todo:"Currencies sit in a weird spot" + todo:"Opponents' points and engine aren't intuitive": CLAUDE M. A seat-composition pass. Show Cory 2 mockups before building.
24. todo:pod/"At 900×600 a rival's four stacks crowd its total" + todo:Now/"Strip room at 1270×700" + todo:pod/"turn card up at 1270×700, strip holds one line": CLAUDE S. Laptop layout fits.
25. todo:pod/"A minion runs past its panel's edge on space 0-1 (spaces.mjs s9)": CLAUDE S. Check that it still happens after the 16px rim and minion tuck work.
26. todo:pod/"Silver, white and colorless members look alike at card size; white/silver ground reads as grey halo": CLAUDE S. Verify after the member redraw, then tune the card grounds.
27. audit#44 "Sounds and animation sound off": CLAUDE S. Tie each sound to its actual landing callback; check sync after the completion-boundary change.
28. todo:pod/"Large screens ≥1600px side columns don't scale" (zoom proposal in queue.md): CLAUDE M.
29. H04 Show the Round I resource draft animated "once snappy enough": CLAUDE S, after the perf items.
30. H20 Extra Hand art is poor; sample a higher-fidelity pixel pass: CLAUDE M. Redraw Extra Hand plus 2–3 samples for Cory; no mass replacement.

### Performance
31. todo:Earlier/"Speed, open" (1) linger motion starts late, (2) hover "tiny bit wonky", (3) animation ends laggy late game + todo:1b/"Hover that feels instant" + todo:pod/"Hover p95 117–222 ms" + todo:Now/"animation lag late in the game": CLAUDE M. Film the hover frame by frame and fix what moves. Profile seat landing re-renders (the ~500-element commits with forced layout).
32. todo:Parked/"Minion on press, spin on the compositor (6543c7f)": CLAUDE M. Not ported: Wheel.jsx has no Web-Animations spin. The patch survives at /mnt/project-files/handoff/speed/minion-port-on-df5eac1.patch, along with the seat/shop/space/table/late diffs. Re-port onto the 2/3/4-sector wheel.
33. todo:Earlier/"4× CPU perf regression (0c1cd51 vs 8ea3e24)": CLAUDE S. Re-measure on the current source first; this is likely stale after 6c1e97eb and ae2fc11a.

### Polish, tooling, later
34. todo:Earlier/"Fresh blind panel to A−": CLAUDE L. Run after items 1–20, on the exact build Cory will open.
35. todo:1/"Later (engineering review): structured events instead of log parsing; shared verbs for copies; online auth rules; type checking": CLAUDE L, low.

## CORY — decisions needed (default in brackets)
C1. Card replacements Cory said he'd design (decisions 2026-10-16) — todo Sweet Talk/Hold Court/Goody Bags/Cheap Seats, todo:Now Sweet Talk simpler, todo:Earlier(3) Sweet Talk, audit#47, #52, #66, todo:"Silver members… Silver's round III action is bad". Do you want to hand over designs, or should Claude propose 2 options each? Current texts: Sweet Talk "+4 silver, then swap half or all of your silver for one other color…", Hold Court "Gain 1 follower per 2 silver you hold (keep the silver). Everyone else +2 silver", Goody Bags "+2 silver and +2 of another color…; everyone else gets 1 of that color", Cheap Seats "+1 follower per 3 white you hold". [Claude proposes 2 each, with Silver's counterweight built into Hold Court/Sweet Talk]
C2. Prices flagged "too expensive/cheap" (todo Heir; audit#21, #48, #82, #83, #100, #11/#79): Heir "+1 silver per member you have" 6+2, Revelers "Counts as 3 members" 4+2, Freelancer 2+2 (raise?), Alchemist 5+3, Squatter 6+2, Lamplighter 10+2, Front-runner "You always pick first" 2+0 (raise?). [Heir 4+2, Revelers 3+1, Freelancer 4+2, Alchemist 4+2, Squatter 4+2, Lamplighter 6+2, Front-runner 4+0; no bench, per "no balance testing for now"]
C3. Discounts (audit#38 remove all cost reductions; #55 maybe discount is fun; #72 Intro Offer trash or not Gold; todo:Earlier(2)): Intro Offer "Your next member costs 4 less", plus Planner, Underbidder, Sommelier, Reinvestor, Sponsor and Penny Pincher. Keep or remove? [Keep discounts now that the source is shown (#56 done); change Intro Offer to "+2 gold, plus 1 per gold member you have"]
C4. Magenta pass (audit#22, #23, #25 residue, #26, #30, #41, #45, #65, #67, #69): Crime Wave "Take 3 … at least 1 from each" is identical to Redistribute "Take 1 resource from each rival" at 4 players. Redistribute → "Take 3 from one rival"? Robin Hood scales? Kingpin "+1 follower per 2 magenta" → based on members? Shake Down knob? A recurring own-recruit steal as magenta's core? [Redistribute → "Take 3 resources from one rival"; Crime Wave unchanged; Kingpin → "+1 follower per magenta member"; Desperado/Sticky combo left as is]
C5. Purple (audit#78, #80, #87, #92; todo:Earlier(1) Rush Hour name): Catch Up "+1 purple, and +1 per rival who's placed more minions than you this round" is weak; Overseer "gain half your purple … when a rival takes an extra turn" doesn't fit. [Catch Up +2 base; cut Overseer for Corner-Cutter's rework later; keep Rush Hour]
C6. Yellow (audit#84, #96, #97, #95): Top Up "+1 of each color you hold the fewest of" is weak in rounds II/III; yellow doesn't want members; yellow is weak at low player counts; Feastmaker as a multi-person "Chefs"? [Top Up scales ×round; Feastmaker → "Chefs", counts as 2 members]
C7. Neutrals/guests (audit#58, #75/#85 residue, #17): Squatter leans magenta, Front-runner leans purple (they render in that color when the sphere is on the table); Recluse ("+2 followers per rival with more members") sits in Blue. Keep leans, or make guests truly colorless? Move Recluse? [Guests colorless; Recluse → White]
C8. Card naming/theme (todo "Crescendo and Hum don't fit"; todo "Action names: Cults theme"; todo:Waiting "Action names batch 2 grade"; audit#86 "members → assets"): do a cult-themed naming batch now? [Yes, one batch for spheres and actions; keep "members"]
C9. Retinue/multi-follower members (audit#43; todo idea Snob worth 2): Retinue "Worth 2 followers. When recruited, everyone else +1 silver", 1+1. [Retinue worth 3]
C10. Bandwagon (todo:Waiting): "+1 red per member recruited this round, by anyone" gave +8 late in round I. [Cap at +4]
C11. Thin deck at 2–3 players (todo:Now): deal guest members from other spheres? [yes]
C12. Greatest Hits repeating a copied Echo's gain (todo:Now): copies currently skip copy spaces and say so. [no, keep skipping]
C13. Help Yourself (audit#19 "should scale moment"): it already scales "2 / 3 / 4 by round". More? [2/4/6]
C14. Follower shop's role (audit#28 report eval/2026-10-17-no-follower-shop.md; todo:2 "Big followers ~25%"; todo:Waiting "what the 25% is measured against"): keep the 1/5/10 follower shop? [keep; judge by human play]
C15. Affordability highlight (H11): always fade unaffordable cards, or add a third shop toggle? [always fade lightly on your own buy step only, as now]
C16. Unclear referents, one line each (audit#1 "Hover over in the glossary", #6 "Make pants taller", #20 "Round 3 actions", #59 "This should straight up steal", #60 "Should on recruit trigger", #71 "That is not yellow", #77 "keep # of ghosts", #91 "You see in advance round end bonus", todo:Now "follower claims visibility"). [#71 likely the lemon-green yellow members (#d3dd48) → truer yellow; #6 Max's leader?]
C17. Online on the real link (todo:Milestone, todo:Waiting): allow *.firebaseio.com / identitytoolkit / securetoken in the environment, or play a 2-laptop game yourself? [Cory plays one 2-laptop game]
C18. Morning-note calls (todo:Earlier, todo:Waiting): #2, #3 and #4 are dead (Reseller, Groupie, Hustler and Lender are culled; Blue scores members now). #1, #5, #8 and #9 are done or superseded. The only one open is #6, faint marks for colorblind players. [no, unless a friend needs them]

## IDEA — Cory's parked ideas
- todo idea Late Bloomers worth 3; "start making members worth more followers"
- todo idea Snob → Chatterboxes/Gossips worth 2 (with C9)
- audit#2, #3 + todo "blue sophisticated/social, deeper sphere themes" + todo:2 "Blue's direction / +1 when… relative payoffs" + audit#35 "Blue: rearrange shop then buy a bunch"
- todo idea silver II–III reward discarding silver members
- todo "White needs a rework he can't pin down; likes fewer followers as catch-up"
- todo idea Patron Saint "+1 follower per silver member in play (max 10)" (now "+1 per 2 silver members in play")
- todo idea every sphere has a member end-game and a resource end-game card
- todo idea reverse sphere (actions gain followers, members cost followers)
- todo idea defensive/blocking action-manipulation sphere
- todo idea tone resource gain down + H23 runaway resources vs end-game bonuses
- todo idea log in the middle of player boxes
- todo idea members pop out of the seat with a speech bubble; everything in the log flies into the log
- H05 optional remote mouse pointers + hide-my-mouse
- H12 resource bank vs wheel-origin animation
- todo:1b "Stretch: living cults"; pixel animations "weak, good enough for now"
- todo:2 "Dead-window fixes (cory-notes-2026-10-14 §4)", "Rework candidates: judge by playing"
- todo:3 "Improve the thinking bot", "a bot that learns", todo:Parked "Smarter Hard bot (041dc63/e527a80)": parked by Cory's humans-first rule; the Hard work lost 42% to old Hard
- todo:1 "(tabled by Cory) live feedback tab + auto-fix pipeline"

## PHONE
- todo:Phone "Online phone guest stuck on 'Place here'"
- todo:Phone "pod's phone notes" + todo:pod "Phone (later): rail pills, hub text, own turn card over wheel, game-over seats, 14px targets"

## DONE (evidence)
- todo:A5 swap leak / steal flights / geometry cache / net income: 526abdda, ae2fc11a (round-start remainder moved to CLAUDE #14)
- todo:B4 Late Bloomers art, discount sources, glossary, stale previews: 526abdda, ae2fc11a (discount.js, discount-sources.test.js)
- todo:C "Follower-shop experiment reconcile": design/eval/2026-10-17-no-follower-shop.md, audit#28 already points to it
- todo "Crescendo: more each round confusing" + "Golden Years: same fix": eecddbae (Cory's own commit) uses "+2 green/gold × round"; card text says "+2 … in round I, +4 in round II, +6 in round III"; Wheel.jsx:1024 dims other rounds in the note
- todo "Rising Tide… give everyone else TWO silver": silver.js tide "Everyone else +2 silver" (audit#29)
- todo "Member card text on the card itself if it fits; follower mark not +1": persisted details/compact shop toggle (audit#15 LIVE); worth shown as numeral + mark (ShopCards.jsx)
- todo "Shop: drop a row, compact follower shop": 8-member shop + 1/5/10 tiers (audit-10-16 #22, #29, #32)
- todo "Members too dim / follower shops not lit": bd2bb87 (full-opacity cards, target outline)
- todo "Action order top to bottom, everything shown": director.js cause-ordered beats (audit-10-16 #38); the fly-into-log part is an IDEA
- todo "End-game tiebreaker unclear" + todo:Open call "End-game tiebreaker: most members": format.js winSentence names the member tiebreak (audit-10-16 #58)
- todo:Parked "Bots never swap back": d62ead53 (bots.js + bot-levels.test.js)
- todo:Friend "Echo can leave a player unable to continue": c8dd8a9 (fail-before/pass-after regression)
- todo:Later "hotseat e2e: shop member names overflow": the full hotseat passed on 6c1e97eb and 526abdda (HANDOFF verification); recheck in gate #1
- todo:Now "Unit suite to today's rules": superseded; 1238 tests passed on ea406700 and targeted repairs went into f00f20e1
- todo:Now "gold vs yellow members more distinct": decisions 22:45 (amber vs lemon-green sprites) + full member redraw (21:14)
- todo:Earlier "Balance calls (1)-(5)": Rush Hour live (purple.js); (4)/(5) superseded by the own-color member contests (B7, member-scoring.js); (2) and (3) are open in C3 and C1
- todo:Earlier "Pass is hard to find": GameScreen/layout.css "Done, no buy" under the follower buys (audit#12 LIVE)
- todo:Earlier "Turn-order rail confusing": rail removed; CultSeat.jsx:50/133 "your turn in N"; H10 arrow
- todo:Earlier "Wheel emojis too big": 16px rim emojis with a size/overlap gate (decisions 17:40)
- todo:Earlier "Gift/steal picker beside the space": GiftCard.jsx (decisions 15:40, 21:05)
- todo:Earlier "Animation pace": motion.js:20 SPEEDS {quick .5, steady 1.62, relaxed 3.75}, default relaxed
- todo:Earlier "Purple and Catch Up" + todo:Waiting "Purple and Catch Up": purple.js Catch Up text as proposed; Crunch Time per Cory; Overtime off the board; Corner-Cutter culled
- todo:Earlier "Stale preview / hosting move" + todo:Waiting "Hosting move" + todo:Milestone "stable release link": now GitHub Pages cojamz.github.io/patrons/play via scripts/v4-play.sh with a version guard (628febbd, design/releasing.md)
- todo:1b "Pixel art: members look alike (call 8)": member redraw shipped (decisions 2026-10-15 21:14)
- todo:2 "Balance pass 3": applied ✅ (decisions 2026-10-15 15:40)
- todo:Waiting "Contest ties": Cory ruled each tied leader gets half the prize (audit#112 LIVE)
- audit#8, #27 member scoring on all arcs except Gold/Silver/Yellow: f27be278 member-scoring.js, own-color-contests.test.js
- audit#25 Extortionist: Cory's call B5 (threshold 5) is in thieves.js text
- audit#31 Shakedown: art limit ≤4 (B2); the misclick wasn't reproduced
- audit#56 discount source shown: ae2fc11a discount.js named sources
- audit#76 two-person Late Bloomers: 526abdda
- audit#104 / B3 Go-Getter after the last buy: ea406700/f27be278
- audit#107 Magenta duplicate flights: ae2fc11a director.js paired stream
- audit#110 swap via hub: ae2fc11a swap-animation.test.js; motion-verify.mjs
- H01 Bodyguard immune to Shakedown: cards-thieves.test.js:125-128
- H02 Straggler pending dot: f27be278 CultSeat.jsx:183, round-pending-cue.test.jsx
- H03 Basics removed from normal setup: f27be278 retired-basics.test.js
- H07 Green chain pressure: 628febbd green-chain-history.test.js (32 tests pass)
- H08 Payment shows the ability: PayPicker.jsx:224 CardText
- H09 "more than one way" removed: no match in src/v4
- H10 "Your turn next" replaced by an arrow: no match in src/v4; rank.test.jsx
- H15 Squatter occupied tint: Wheel.jsx:790 squat lit
- H18 usable glow / used dimming: members.css:20-26, 62-63
- H25 versioning: 628febbd scripts/v4-version.mjs, version.js, releasing.md
- H26 history: design/release-history.md (41f09d86)

- todo:Now "Pacing tune" + todo:Earlier "Pacing gate red": `V4_GAMES=fast vitest run src/test/engine/v4 src/test/v4` on 8c5bdd50 → 150 files, 1273 passed / 1 skipped, so pacing.test.js passes (cap now 13000×K). Recheck under the full gate.
- todo:Later "fire-audit … one member never named": passes in the same run (fire-audit.test.js:127)

## DEAD (obsolete or superseded)
- todo "Can't find how to release a member": Release removed (audit#40/#57; core.js:25 release:false; working-with-cory.md "latest removal supersedes keep")
- todo:C "Separate clear defects from balance changes in the 113-note ledger": superseded by this triage
- todo:C "Suspected Good Deed misclick" + audit#68: not reproduced after testing every branch; reopen only on a new report
- todo:Now "Cory's call" items, already merged into C11/C12 (no separate entries)
- todo:pod "Shop refill seen sliding once; not reproduced"
- todo:pod "The snake rail has only a native title": the rail is gone
- todo:2 "Fair-price test": Cory, 2026-10-15: "I don't think we need to do any balance testing for now"
- todo:2 "Watch: White's 1-for-1 follower trades (Buy Low, Boom)": Buy Low became Cheap Seats (no trade), and every follower tier is 1:1 now, so All In equals the shop rate
- todo:Earlier "morning note calls 1–10": see C18; everything except #6 is dead or done
- todo:Now "Still from his notes… follower claims visibility": folded into C16 (unclear referent)
