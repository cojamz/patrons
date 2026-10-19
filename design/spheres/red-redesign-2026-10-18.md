# Red action direction — October 18, 2026

Confirmed by Cory in the Red discussion. Implementation authorized by Cory and built for v0.8.0. Member redesign remains open; existing Red members are retained. Release verification lives in ../eval/red-v080/verification.md.

## Shared rules

- Cost means total printed colored + wild cost. No payment or discount changes that comparison.
- Red actions give the acting player 1 Red, like Green's inherent resource. The simple gain's displayed totals are 2/3/4 by round, including that inherent resource. Cory indicated this may become the general rule for all colors; other colors have not been changed.
- Recruit effects fire when a leader actively brings a member into their own cult, including taking it or swapping for it. Moving a member into somebody else's cult does not trigger that recipient's Recruit effect. In an initiated player-to-player swap, the initiator's incoming card fires; the other recipient's does not. Taking is distinct from receiving a gift.
- Promote and Demote intentionally say “a member,” not “your member.” Both can target any cult, including a rival. The replacement shop member goes to that same cult; the outgoing member goes to the shop. Only an acquisition for the acting leader triggers Recruit.

## Actions

| Round | Action | Text |
|---|---|---|
| I | Open Door | Recruit the cheapest shop member. |
| I | Gather (placeholder name) | I: +2 Red / II: +3 Red / III: +4 Red total. |
| I | Even Swap | Swap any two members of equal cost. |
| II | Promote | Swap a member with a shop member costing up to 2 more. |
| II | Demote | Swap a member with a shop member costing at least 2 less. |
| III | Recruit a Member | Recruit a shop member. |

Add the inherent +1 Red to all actions except the simple gain's already-inclusive totals. Exact final UI spacing/symbols will follow the existing style. Recruit actions retain the free-acquisition intent of the existing Red action progression; this spec does not introduce a payment requirement.

## Clarifications explicitly answered

- Demoting a cost 6 member can select a shop member costing 4 or less (at least 2 cheaper), not just 4–5.
- Round I equal-cost swaps may use any two members across cults and the shop, including two rivals' members. No ownership restriction.
- Round II promotion/demotion also may target rivals' members; the general wording is intentional.

## Implementation boundary

Implemented the new actions, atomic shop/cult exchanges, and acting-leader Recruit triggers. Verify card quantities, worker entitlements, protections and Green copying on the immutable release. No additional effect, ownership or cost restriction is approved by this document.
