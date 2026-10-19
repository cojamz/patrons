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
