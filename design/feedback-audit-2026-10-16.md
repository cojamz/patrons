# Original play-feedback audit — 2026-10-16

Source: [verbatim original notes](play-feedback-2026-10-16-original.txt). This audit follows those notes in order. **Implemented** means code exists; visual quality claims still require visual verification. **Partial** means a specific part landed, with the remainder explicit. **Open** means requested work remains. **Idea** means exploratory design, not a settled replacement rule.

Release boundary: latest verified live source is `c8dd8a997c527f4e19ed2529b214f463aa5b1b50`, published main/play `53200b7`. Root redirect, full manifest SHA, identical index HTML, eight members, 1/5/10 offers, 24 slice outlines and zero load/runtime errors verified in the public browser. Earlier batch `ffc44bc` included member portrait origins and landing sound. “Local follow-up” below now belongs to this checked, live batch; open/partial quality items remain open.

| # | Original feedback | Status and evidence / remaining work |
|---|---|---|
| 1 | Late Bloomer → Late Bloomers; worth 2; excludes itself | **Implemented:** `src/engine/v4/content/yellow.js` latebloomer. Worth 3 remains an **idea**. |
| 2 | Default Relaxed | **Implemented:** `src/v4/motion.js` DEFAULT_SPEED. |
| 3 | Crescendo scaling clear; optional I/II/III gray schedule | **Partial:** `content/echo.js` lists +2/+4/+6 by round; `src/v4/shorts.js` shows current-round gain. Gray schedule not built. |
| 4 | On recruit / at round start | **Implemented:** `src/v4/game/memberTiming.js`, used in member presentations. |
| 5 | Every action's language and visual representation | **Implemented in working follow-up:** all 54 current specialized actions checked against wheel/short text; seven misleading descriptions corrected, plus six crowded phrases shortened. Full member-language compression remains open. See wording-pass and wheel-readable reports. |
| 6 | Golden Years same scaling clarity | **Partial:** `content/gold.js` lists +2/+4/+6 explicitly; no gray schedule. |
| 7 | Cult-themed action names | **Idea / open design:** no replacement naming batch applied. |
| 8 | Round scorecard slow; broader lag | **Partial:** playback and hover fixes landed; complete scorecard/performance quality remains a visual verification task. |
| 9 | Members too dim, active and tinted | **Live correction bd2bb87:** removed the remaining placement-phase whole-shop brightness filter; full-opacity bright cards and a crisp 3px target outline verified in the actual Open Door hover. Still subject to Cory’s visual judgment. |
| 10 | Release hard to find | **Implemented in working follow-up:** explicit “Release a member…” entry appears on your seat when legal and opens the existing list without releasing immediately; click regression passes. |
| 11 | Likes money selector | **Preserve:** no redesign requested. |
| 12 | Snap Up wording poor | **Implemented in working follow-up:** Snap Up explicitly describes an optional paid extra recruit using any colors, in addition to the normal buy. |
| 13 | Opponents' points / engine not intuitive | **Partial:** seat member lists, follower breakdowns and staged effects exist. Intuitive understanding needs observed play, not a checkbox. |
| 14 | Copy previous action, including own snake turn | **Implemented:** `content/echo.js` previous targets and previousNow; Understudy consistent. |
| 15 | Encore any occupied space | **Implemented:** Green targets; `design/rulebook.md` copy rule. Existing no-recursive-copy rule retained. |
| 16 | Greatest Hits own occupied spaces | **Implemented:** Green own targets and rulebook. |
| 17 | Perhaps reduce resource gain | **Idea:** economy rebalance not applied wholesale. |
| 18 | Reprise no +2 green | **Implemented:** Green copy action drops gain. |
| 19 | Crescendo / Hum names do not fit | **Open naming:** names retained in `content/echo.js`. |
| 20 | Larger free-member choice cards | **Implemented in working follow-up:** member choices use larger cards with full abilities in the existing shop; ordinary shopping stays compact. Desktop and phone screenshots checked; integrated check pending. |
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
| 50 | Snake draft clear | **Partial:** rulebook now explains down then up the player column, including two consecutive end turns; live board cues remain. First-play comprehension still needs feedback. |
| 51 | Delicate resource/member/action balance | **Open strategic design:** no sweeping balance changes claimed. |
| 52 | Unexplained follower flights before round end | **Open investigation:** not specifically reproduced or closed. |
| 53 | Hold Court feels like member ability | **Open design:** current action remains. |
| 54 | Each sphere member-vs-resource end-game paths | **Idea:** no systematic new set applied. |
| 55 | Follower-cost reverse sphere; defensive action sphere | **Idea:** parked. Strategic goal of clearer rival plans/counterplay retained. |
| 56 | Perhaps no release | **Superseded:** user later explicitly said leave release in. |
| 57 | Night Owl wording poor | **Implemented in working follow-up:** Night Owl explicitly states rounds II–III, after last placement, one extra turn if room, once per round. |
| 58 | End-game tiebreak unclear | **Implemented clarification in local follow-up:** rulebook already states more members; `format.js` winSentence now names winner by members or shared tie. Targeted regression added. |
| 59 | Log everything; update handoff docs | **Maintained:** verbatim source, full 59-item audit, current handoff/in-flight/todo and a project progress board. Release status separates local implementation from verified live code. |

## Additional feedback after the original batch

- Friend feedback: wheel play areas are hard to parse. **Open visual/usability review**; preserve the existing design while improving comprehension.
- Phone must function: isolated touch smoke passes at 390 and 412 widths; this is emulation, not physical-device verification.
- Member landing noise: universal quiet member sound in earlier `ffc44bc`; distinct voices remain optional.
- Action recruit should trigger Go-Between and Exporter: three action-recruit engine regressions pass with both owned. Reported missing effect not reproduced; do not label a rules fix without evidence. Member-origin presentation improved separately.
- Root `/patrons/` must work: main index redirects to built `/patrons/play/`; deployment manifest identifies which source batch is actually served.

- Echo stall reproduced at place→choose transition: auto-copy hit the input lock and never retried. Local fix and fail-before/pass-after regression ready.
- Animation overlap: local sequencing work separates named payouts and waits for member landing. Shipped in c8dd8a9; sequencing regressions, pacing and full browser game pass. Smoothness remains a user-observed quality item.
- Wheel areas: subtle sphere-colored slice outlines added and visually checked locally.
- Resource source: wheel-ring anchors requested for action gains/spending; member bonuses remain portrait-sourced. Visible bank remains an idea for later.
- Friend first-play detail: initially missed inner round-II/III rings and did not see tiles as “lit” when tutorial asked for a lit tile. During play they understood gold = available, dim = taken, dark = future. Treat as onboarding/first-impression issue, not proof that state cues are entirely broken; verify slice outlines help without competing with gold availability.
