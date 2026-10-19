# Magenta redesign — October 19

## Agreed direction (design only; not deployed)

- Stolen resources retain their original colors. Stop converting theft into Magenta.
- Every action in this arc grants1 of the arc’s resource, in addition to its printed effect. “Magenta” remains an internal/temporary name; Cory dislikes this color and the replacement is open.
- Round I theft: **Steal1 resource × round, split among rivals as you choose.** Including the inherent grant, total gain is2/3/4 resources. This supersedes earlier2/4/6 theft suggestions and is not a separate flat Magenta-income action.
- Round I protection shape: **Steal1 resource. Your members and resources can’t be stolen this round.** Cory identified that this outclasses plain steal1 in RoundI. Revised proposal is protection only plus the inherent grant; not yet approved. The inherent+1 applies.
- Round II stack theft: **Steal half of one rival’s resource pile, rounded down.** Cory clarified pile means ONE COLOR’S STACK, not all resources combined. It does not require the largest stack. Add inherent1 arc resource.
- Round II Shakedown: choose a rival’s member; they pay to keep it, or you take it. Total-cost5-or-less is provisional; payment formula remains to settle. Current runtime still uses target cost ceiling4 and payment equal to total cost.
- Round III: **Take any rival’s member.** Previously confirmed theft protections remain, victim gets no replacement, active acquisition triggers Recruit; gifts do not.

## Round I principles

Scale in value into later rounds; avoid a disproportionately profitable first pick in Round I; count the inherent1 arc resource when evaluating each action. Scaling may come from what the effect protects or lets you spend, rather than a larger printed resource payout.

## Latest exploration (supersedes protection-only suggestion)

Cory proposes matching2/3/4 payouts with different benefits. Assistant suggests steal1×round + protection versus steal1×round + extra follower purchase, both with inherent1 Magenta. Neither final wording nor second benefit is approved. Remove a plain-steal duplicate if both are adopted; third RoundI slot remains open. Protection-only and purchase-only were earlier responses, not committed rules.

## Open proposals

- Superseded assistant proposal: steal1+extra follower purchase. It also outclasses plain steal1 in RoundI. Revised proposal removes its steal and retains the inherent grant plus extra purchase; not approved. It is additional to the normal buy. Prior ten-option list is brainstorming, not a committed deck/action list.
- Other option: steal1 per2 of a rival’s members. Not approved.
- New color/name; final Round I selection; Shakedown target/payment limits; member deck and prices.
- Contest: most held Magenta resources, confirmed by Cory; implemented separately from the remaining action redesign.

## Runtime boundary

Current source is `src/engine/v4/content/thieves.js`. These newer theft/color/inherent-resource rules are not yet implemented. Existing Poach already takes a rival member without replacement; old Shakedown remains until rebuilt. Do not present the new design as live. `thieves.md` contains obsolete historical prices/rules and is not the redesign spec.

Cory’s side request clarified separately: enlarge printed cost/follower text and icons, not game values. UI-only release work does not implement this Magenta redesign.
