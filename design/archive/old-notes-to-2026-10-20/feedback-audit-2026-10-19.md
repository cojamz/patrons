# October 19 feedback intake — Red / Green / unified shop

Status is evidence-based. Public verification is recorded in eval/red-members-v082/verification.md. This audit does not close older unrelated feedback.

| # | Report / decision | Status | Owner | Evidence | Remaining |
|---|---|---|---|---|---|
| 1 | Prioritize new Red deck; ship all settled members | Implemented / checked | Root + engine lane | Twelve-card composition, price/body, callbacks and chain regressions | Verified public ff535607 |
| 2 | Chorus must exclude the minion placed on itself | Fixed / checked | Green lane | Own Chorus space excluded from count and estimate; focused tests | None identified |
| 3 | Copy Previous uses latest action regardless of owner; highlight same target | Fixed / checked | Green + UI | Latest-entry helper shared by runtime/previews; own/rival/blocked-target tests | None identified |
| 4 | Bold canonical On Recruit and Round Start keywords | Fixed / checked | UI lane | Shared Rich/CardText; hover, details, payment/deck; screenshot inspection | None identified |
| 5 | Swap Any Two highlighting weird | Fixed / checked | UI lane | Stale placement hover cleared during swap choice; selected tile remains pressed | Further concrete reports welcome |
| 6 | Combine follower buys and members into one shop; equal card/cost layout, stacked look | Built / checked | UI lane | Matching compact dimensions; detailed layout; six browser cases include actual follower purchase | Phone remains functional, not redesigned |
| 7 | Printed follower groups must also count as members | Verified | Engine lane | Panel3, Loyalists2, Mob5; printed/effective quantity regressions | Existing behavior retained |
| 8 | Some updated Red/Green animations seem missing | Partially verified | Root | New Red callback sources, actual desktop/phone card/resource/follower motion; exact final state | Broad animation audit remains queued; no blanket performance verdict |
| 9 | Impostor/Doppelganger should not trigger copied On Recruit | Changed / checked | Green lane | Explicit and immediate Now suppressed; ongoing/future hooks and worker entitlement preserved | None identified |
| 10 | Loyalists 2 red +3 wild, 2 followers | Built / checked | Engine lane | Owner/rival swaps blocked; theft allowed; body/price verified | None identified |
| 11 | Panel only moves another member | Built / checked | Engine lane | Saved choice exclusion; genuine Stunt loop terminates | No arbitrary once-per-chain rule |
| 12 | Fast phone Recruit tap loses its sheet | Fixed / checked | UI + root | Controller closes only accepted input; five hover tests; actual touch flow | Intentional animation/tap guard retained |

| 13 | Enlarge shop cards; keep details close in size without desktop scrolling | Shipped v0.8.3 | Root + layout review | Eight viewport/color cases: stable slots, full ability/price bounds; live desktop/phone inspection | Very short desktop windows retain fallback scroll; phones retain swipe |

| 14 | Payment passives above selector, tighter screen | Shipped v0.8.4 | payment_polish + root | Seven payment UI checks; exact desktop/phone payment resources; public inspection | Modal focus retained |
| 15 | Member hover costs on right, effect grouping then price; remove redundant ownership | Shipped v0.8.4 | member_hover_polish |37 focused info/member-use checks; desktop/phone list bounds; full abilities and states | No naming/art redesign |
| 16 | Details toggle always responds rather than forcing details during member choices | Shipped v0.8.4 | details_toggle | Eight unit checks; actual member-choice toggle desktop/phone; size regression | Payment dialog retains modal focus; preference itself is phase independent |
| 17 | Payment member ability nearly invisible on paper, discovered in review | Shipped v0.8.4 | root + payment_polish | Scoped dark ink; real browser computed-color assertion and settled screenshot | No broader theme change |

| 18 | Retinue3 followers and3 members | Shipped v0.8.5 | retinue_three | Paid acquisition, gifts, weighted counts, copied quantity; public desktop/phone purchase | Price/gift unchanged |
| 19 | Yellow reads yellow, not lime | Shipped v0.8.5 | yellow_hue | #ead844 canonical/fallback; contrast and color-distance checks; wheel/resource screenshots | Gold/Green unchanged |
| 20 | Opening draft shows snake placement order | Shipped v0.8.5 | draft_order_cue | Queued reverse draft and engine firstOrder;2/3/4player browser picks; long-name phone bounds | Names truncate visually where needed; full accessible labels |

| 21 | Larger printed member costs and follower icons, not larger game values | Shipped v0.8.6, retained v0.8.7 | Root | Actual16px digits/glyphs; eight public viewport/color layout cases; no footer overlap | No repricing |
| 22 | Magenta victory condition uses Magenta resources | Shipped v0.8.7 | Root |39 focused checks; actual public desktop/phone tie through scoring; labels/counts agree | Remaining Magenta action redesign unbuilt |
| 23 | New Magenta actions and discarded alternatives | Actions shipped v0.8.8 | Cory + root | Authoritative spec; all16 public scenes verified | Color/name and new member deck remain open |

| 24 | Implement all six new Magenta actions; each grants1 Magenta, theft keeps colors | Shipped v0.8.8 | Root +3 helper lanes |88 focused checks; all14 public desktop/phone action scenes +2 scoring scenes; copies/resume/protection/rounding | Full balance pass and new deck remain open |
| 25 | Bodyguard: Rivals can’t steal from you | Shipped v0.8.8 | Root | Resources/member/ransom protections checked; half-stack excludes guarded40gold rival | Cost unchanged |
| 26 | General steals split across rivals; doubling/+1 once to overall total | Shipped v0.8.8 | Root + checks/UI | Split multi-victim/color regression; one-resource picks under doubling; no repeated grants on reload | Half-pile is explicitly one stack |

| 27 | Straggler selection blocks wheel; action names do not explain destinations; cannot inspect/choose | Shipped v0.8.9 | Root | Compact docked prompt; full hover/tap action inspection, Move here;24 focused checks/build and6 public desktop/phone move/stay/escape flows | No redesign of other choice types |
| 28 | Greatest Hits appears wrong | Withdrawn by Cory | Root | User had Agents; own actions protected from copying as designed; investigation stopped | No Green change |
