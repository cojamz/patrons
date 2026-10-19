# Red action direction — October 18, 2026

Confirmed by Cory in the Red discussion. This is a design spec, not an implemented release. Member redesign is still open. Current public remains Green v0.7.0.

## Shared rules

- Cost means total printed colored + wild cost. No payment or discount changes that comparison.
- Red actions give the acting player1Red, like Green's inherent resource. The simple gain's displayed totals are2/3/4 by round, including that inherent resource. Cory indicated this may become the general rule for all colors; other colors have not been changed.
- Recruit effects fire when a leader actively brings a member into their own cult, including taking it or swapping for it. Moving a member into somebody else's cult does not trigger that recipient's Recruit effect. In an initiated player-to-player swap, the initiator's incoming card fires; the other recipient's does not. Taking is distinct from receiving a gift.
- Promote and Demote intentionally say “a member,” not “your member.” Both can target any cult, including a rival. The replacement shop member goes to that same cult; the outgoing member goes to the shop. Only an acquisition for the acting leader triggers Recruit.

## Actions

| Round | Action | Text |
|---|---|---|
| I | Cheapest recruit (name open) | Recruit the cheapest shop member. |
| I | Simple gain (name open) | I:+2Red / II:+3Red / III:+4Red total. |
| I | Equal-cost swap (name open) | Swap any two members of equal cost. |
| II | Promote | Swap a member with a shop member costing up to2more. |
| II | Demote | Swap a member with a shop member costing at least2less. |
| III | Recruit a Member | Recruit a shop member. |

Add the inherent+1Red to all actions except the simple gain's already-inclusive totals. Exact final UI spacing/symbols will follow the existing style. Recruit actions retain the free-acquisition intent of the existing Red action progression; this spec does not introduce a payment requirement.

## Clarifications explicitly answered

- Demoting a cost6member can select a shop member costing4orless (at least2cheaper), not just4–5.
- RoundI equal-cost swaps may use any two members across cults and the shop, including two rivals' members. No ownership restriction.
- RoundII promotion/demotion also may target rivals' members; the general wording is intentional.

## Implementation work when Red is built

Replace the old Red wheel actions, implement swaps with the market rather than only between cults, apply precise acting-leader Recruit triggers, and verify card quantities/worker entitlements/protections/copying with Green. No additional effect, ownership or cost restriction is approved by this document.
