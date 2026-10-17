# October 17 handoff feedback addendum

This is additional intake, not a replacement for the original113-note audit. Cory requested a short final batch, then all code/backlog/docs pushed for another agent. Preserve the existing game design. No unchecked deployment. New fixes below need integrated verification unless evidence explicitly says otherwise.

| ID | Report / intent | Triage | Status / next check |
|---|---|---|---|
| H01 | Should Bodyguard be immune from Shakedown? | Rules verification | Inspect shared member-steal guard. Bodyguard says rivals cannot take your members; verify own protection with regression, do not invent exemption. |
| H02 | Straggler needs a visual that it has yet to happen | Clear UI | Assigned motion agent: subtle pending-round cue until usedRound; focused proof and visual inspection required. |
| H03 | Remove Blue Basic and Green Basic entirely | Clear content/setup | Implemented: normal setup excludes/rejects legacy basics; old selections migrate to Market/Echo. Legacy replay definitions retained.12focused payment/setup tests pass; integrated build pending. |
| H04 | Show player drafting resource once snappy enough | Conditional animation | Backlog; preserve confirmed reverse-order RoundI draft. |
| H05 | Optional remote mouse pointers and hide-my-mouse control | Stretch multiplayer | Backlog; opt-in visibility/privacy, no unsolicited transport work during handoff. |
| H06 | Round scoring animations not smooth | P0 performance | Actual completion boundary implemented; newest full-game gate timed out. Profile actual scoring after fixing progression; do not claim fully smooth. |
| H07 | Pressure-test Encore→Echo and Reprise→Echo, hard Green chaining | P1 correctness | Backlog: multi-hop copies, skips, ownership, cycles, final targets and pacing; use real moves, not only isolated helpers. |
| H08 | Payment screen shows member ability | Clear UI | Implemented existing CardText in PayPicker;7payment tests pass; browser inspection pending. |
| H09 | Remove “you can pay this more than one way” | Clear wording | Implemented; existing payment interaction coverage retained. |
| H10 | Remove “Your turn next”; prefer visuals | Clear wording/UI | Assigned motion agent; preserve useful accessible turn context. |
| H11 | Always highlight affordability, or third toggle? | Design decision | Park toggle choice. Current verified live behavior slightly fades unaffordable cards only in own buy phase. |
| H12 | Resource bank vs wheel-origin animation | Design exploration | Backlog; compare clarity without redesigning whole board. |
| H13 | Follower/member buys need clear purchase signal | P1 animation | Backlog: identify shop/tier/card before reward flies; preserve snappy sequencing. |
| H14 | Large resource stacks20+ look disproportionate | P1 UI | Backlog: density/size tiers, exact counts, touch targets. |
| H15 | Subtle occupied-space cue when using Squatter | Clear UI | Assigned motion agent; keep legal occupied spaces lit and distinguish from normal empty placement. |
| H16 | Better organized wheel action text | P1 language/layout | Existing precise-minimal standard remains. Backlog exact text/layout pass, no vague shortening. |
| H17 | Round-end screen illegible; make snappy, hoverable, better designed | P1 redesign | Separate from removing pre-screen. Backlog: readable hierarchy and on-demand detail, inspect laptop/phone. |
| H18 | Subtle usable-member glow and slight used dimming; maybe already present | Verify / preserve | Existing ready/used cues present; verify before adding redundant animation. |
| H19 | Trade Seeds concept good; reword/tweak | Design/wording | Backlog exact current rule then propose precise wording; no unsolicited balance tweak. |
| H20 | Extra Hand art poor; higher-fidelity pixel-art pass | Art direction | Backlog; preserve charm, sample a small set before mass replacement. |
| H21 | Hover costs on right, visually cleaner | P1 layout | Backlog responsive hover layout; preserve full effects and cost meaning. |
| H22 | Group cards by effect type then ascending price | Clear organization idea | Backlog: define stable categories and sorting, avoid changing live market order unintentionally. |
| H23 | Runaway resources may dominate recurring/end-game bonuses | Balance observation | Future design log only; verify with appropriate games and human feedback, do not change balance silently. |
| H24 | Undo reverses animation | P1 interaction | Backlog: restore authoritative state immediately, reverse finite visual sequence without duplicate effects; test undo during/after motion. |

## Confirmed rules from the preceding live intake
- Own-color member quantities decide arc competitions; Gold, Silver and Yellow keep their current conditions.
- Extortionist triggers when a rival buys5or more followers in one purchase.
- Cutpurse gives a resource choice from an eligible richest rival.
- Poach gives the victim no replacement.
- Extra Hand: only an unplaced extra minion transfers with ownership; already placed minions do not transfer. Implementation assigned separately; verify status in HANDOFF.
- Legal lights/options/turn ownership advance together only after the actual animation completes.
- Round-end follower totals and +followers indicators appear only after the relevant award lands.
- Remove the “Round X Ends” pre-screen; competition itself carries the cue.

## Delivery boundary
GitHub source and playable release are separate. Last verified public source remains6c1e97eb unless HANDOFF records a newer verified public stamp. ea406700 has1238passing tests/build, real swap/steal browser proof, but its full hotseat game timed out; never deploy it merely because unit tests pass. Later own-color/Poach/score-arrival/handoff fixes require a new immutable integrated check.
