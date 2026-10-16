# Original play-feedback audit — 2026-10-16

Source: [verbatim original notes](play-feedback-2026-10-16-original.txt). This audit follows those notes in order. **Implemented** means code exists; visual quality claims still require visual verification. **Partial** means a specific part landed, with the remainder explicit. **Open** means requested work remains. **Idea** means exploratory design, not a settled replacement rule.

Release boundary: `ffc44bc` is the earlier published source batch, including member portrait origins and landing sound. The eight-member shop and 1/5/10 follower buys are later local changes being verified; do not infer they were in `ffc44bc`. This document does not certify a later live deployment.

| # | Original feedback | Status and evidence / remaining work |
|---|---|---|
| 1 | Late Bloomer → Late Bloomers; worth 2; excludes itself | **Implemented:** `src/engine/v4/content/yellow.js` latebloomer. Worth 3 remains an **idea**. |
| 2 | Default Relaxed | **Implemented:** `src/v4/motion.js` DEFAULT_SPEED. |
| 3 | Crescendo scaling clear; optional I/II/III gray schedule | **Partial:** `content/echo.js` lists +2/+4/+6 by round; `src/v4/shorts.js` shows current-round gain. Gray schedule not built. |
| 4 | On recruit / at round start | **Implemented:** `src/v4/game/memberTiming.js`, used in member presentations. |
| 5 | Every action's language and visual representation | **Open:** targeted Green wording landed; a complete action-by-action pass is not evidenced. |
| 6 | Golden Years same scaling clarity | **Partial:** `content/gold.js` lists +2/+4/+6 explicitly; no gray schedule. |
| 7 | Cult-themed action names | **Idea / open design:** no replacement naming batch applied. |
| 8 | Round scorecard slow; broader lag | **Partial:** playback and hover fixes landed; complete scorecard/performance quality remains a visual verification task. |
| 9 | Members too dim, active and tinted | **Local follow-up, visually checked at 1270×700 and 390px:** removed compounded shop-region and card opacity; unaffordable cards/rates remain legible with existing actionable glow. Earlier live brightening was insufficient. |
| 10 | Release hard to find | **Open usability:** existing prompt mentions release (`GameScreen.jsx`); release button remains in member details (`MemberUse.jsx`). Keep release per later explicit reversal. |
| 11 | Likes money selector | **Preserve:** no redesign requested. |
| 12 | Snap Up wording poor | **Open:** `content/market.js` still says “+2 blue, then you may recruit a face-up member now, in any colors.” |
| 13 | Opponents' points / engine not intuitive | **Partial:** seat member lists, follower breakdowns and staged effects exist. Intuitive understanding needs observed play, not a checkbox. |
| 14 | Copy previous action, including own snake turn | **Implemented:** `content/echo.js` previous targets and previousNow; Understudy consistent. |
| 15 | Encore any occupied space | **Implemented:** Green targets; `design/rulebook.md` copy rule. Existing no-recursive-copy rule retained. |
| 16 | Greatest Hits own occupied spaces | **Implemented:** Green own targets and rulebook. |
| 17 | Perhaps reduce resource gain | **Idea:** economy rebalance not applied wholesale. |
| 18 | Reprise no +2 green | **Implemented:** Green copy action drops gain. |
| 19 | Crescendo / Hum names do not fit | **Open naming:** names retained in `content/echo.js`. |
| 20 | Larger free-member choice cards | **Open:** `ShopCards.jsx` still uses existing card presentation for recruitment choices. |
| 21 | Fit abilities on member cards; remove worth plus | **Partial:** worth is numeral + follower mark (`ShopCards.jsx`); ability remains hover-only. Preserve charming design. |
| 22 | Shop down to eight | **Local later change:** SHOP_SIZE in `src/engine/v4/core.js`; verify next live build, absent from earlier `ffc44bc`. |
| 23 | Remove EACH ROUND / Members labels; show figures | **Implemented:** `CultSeat.jsx` removes labels, measures row capacity and displays more figures. |
| 24 | Log between paired player cards | **Idea:** not implemented. |
| 25 | More efficient minions; follower typography | **Open polish:** existing minion column retained; no comprehensive seat redesign. |
| 26 | Currency position feels odd | **Open polish:** retained placement. |
| 27 | Follower shop brighter | **Implemented treatment:** `lamp-b.css` rate styling; visual judgment still applies. |
| 28 | Member pops from seat side, speech bubble | **Idea:** existing member staging retained, not a new side bubble. |
| 29 | Smaller shop / compact noticeable follower buys / seat room | **Partial, local later change:** eight cards and three compact follower tiers; verify composition. No dramatic layout change. |
| 30 | Empty player-card space opens member list | **Implemented:** `CultSeat.jsx` bodyHover and openSeat handlers. Preserve existing hover. |
| 31 | Efficient, elegant member ability text | **Open:** timing normalization done; complete ability text pass remains. |
| 32 | Follower buys 1 or 2 / 5 / 10 | **Local later change:** TIERS uses 1/5/10, unlimited. Assistant chose recorded default 1; absent from earlier `ffc44bc`. |
| 33 | Snob worth 2 / Chatterboxes or Gossips / Blue social | **Idea:** no batch applied. |
| 34 | Final member bonuses with round scoring, no surprise/recount | **Implemented:** `Reckoning.jsx` reckonSteps appends sourced final bonuses after contests; `GameScreen.jsx` disables FinalScore recount. |
| 35 | End-game layout/load polish | **Partial:** recount removed; broader layout/load evaluation remains. |
| 36 | Call build v0.5 | **Implemented:** version and decision record. |
| 37 | No competition tiebreaks; all tied score | **Implemented:** Red/Yellow scoring; ties-all-score presentation. End-game member tiebreak is separate. |
| 38 | Toast then rivals then Majordomo; member is resource source | **Implemented mechanics:** cause-ordered effect beats and staged portrait anchor in `director.js`; visual sequence remains release verification. Flying into log is only an **idea**. |
| 39 | Toast gifts scale 1/2/3 | **Implemented:** `content/silver.js` toast. |
| 40 | Goody Bags too close to Toast / Good Deed | **Open design:** existing Goody Bags remains. |
| 41 | Rising Tide perhaps gifts two; Silver theme / round III | **Idea / open design:** Rising Tide currently gifts one; broader Silver revision not implemented. |
| 42 | Sweet Talk completely different | **Open design:** existing swap-based Sweet Talk remains. |
| 43 | Silver II/III discard silver members for gains | **Idea:** not implemented. |
| 44 | Contest arc alignment; special follower mark sheen | **Open visual polish:** no specific pass identified. |
| 45 | Cheap Seats different; White catch-up; likes Sob Story | **Open design:** existing Cheap Seats retained; White already scores fewest followers, but no new full rework from this batch. |
| 46 | Patron Saint fits Silver | **Preserve:** existing rule. |
| 47 | Patron Saint +1 per Silver member / price tradeoff | **Idea:** remains +1 per two (`content/silver.js` saint). |
| 48 | Player hover needn't say short | **Implemented:** seat hover no longer includes shortfall prose (`HoverCards.jsx`). |
| 49 | Heir too expensive | **Open balance:** remains 6 silver + 2 any (`content/silver.js` heir). |
| 50 | Snake draft clear | **Partial:** rulebook gives explicit sequence; turnaround prompt says snake order (`format.js`). Persistent board clarity not separately proven. |
| 51 | Delicate resource/member/action balance | **Open strategic design:** no sweeping balance changes claimed. |
| 52 | Unexplained follower flights before round end | **Open investigation:** not specifically reproduced or closed. |
| 53 | Hold Court feels like member ability | **Open design:** current action remains. |
| 54 | Each sphere member-vs-resource end-game paths | **Idea:** no systematic new set applied. |
| 55 | Follower-cost reverse sphere; defensive action sphere | **Idea:** parked. Strategic goal of clearer rival plans/counterplay retained. |
| 56 | Perhaps no release | **Superseded:** user later explicitly said leave release in. |
| 57 | Night Owl wording poor | **Open:** current long wording remains in `content/purple.js`. |
| 58 | End-game tiebreak unclear | **Implemented clarification in local follow-up:** rulebook already states more members; `format.js` winSentence now names winner by members or shared tie. Targeted regression added. |
| 59 | Log everything; update handoff docs | **Partial:** original saved verbatim, this audit maps every item. Current todo/handoff/inflight reconciliation is being handled separately; older unchecked lists are not evidence of source status. |

## Additional feedback after the original batch

- Friend feedback: wheel play areas are hard to parse. **Open visual/usability review**; preserve the existing design while improving comprehension.
- Phone must function: isolated touch smoke passes at 390 and 412 widths; this is emulation, not physical-device verification.
- Member landing noise: universal quiet member sound in earlier `ffc44bc`; distinct voices remain optional.
- Action recruit should trigger Go-Between and Exporter: three action-recruit engine regressions pass with both owned. Reported missing effect not reproduced; do not label a rules fix without evidence. Member-origin presentation improved separately.
- Root `/patrons/` must work: main index redirects to built `/patrons/play/`; deployment manifest identifies which source batch is actually served.

- Echo stall reproduced at place→choose transition: auto-copy hit the input lock and never retried. Local fix and fail-before/pass-after regression ready.
- Animation overlap: local sequencing work separates named payouts and waits for member landing. Pending final checks; do not claim shipped from this audit.
- Wheel areas: subtle sphere-colored slice outlines added and visually checked locally.
- Resource source: wheel-ring anchors requested for action gains/spending; member bonuses remain portrait-sourced. Visible bank remains an idea for later.
- Friend first-play detail: initially missed inner round-II/III rings and did not see tiles as “lit” when tutorial asked for a lit tile. During play they understood gold = available, dim = taken, dark = future. Treat as onboarding/first-impression issue, not proof that state cues are entirely broken; verify slice outlines help without competing with gold availability.
