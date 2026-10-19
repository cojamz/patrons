# Magenta redesign — October 19

## Confirmed design (actions not yet deployed)

- Stolen resources retain their original colors. Stop converting theft into Magenta.
- Every action grants1 Magenta in addition to its printed effect. Color/name replacement remains open; Cory dislikes Magenta.
- RoundI, protection: steal resources and make yourself safe from resource/member theft this round. Working scaling is steal1×round; exact quantity was explored alongside equal2/3/4 total payouts. The earlier plain scaling-steal duplicate is superseded.
- RoundI, occupied actions: **Steal1 resource per Magenta action that already has a minion.** Exclude the minion just placed; count occupied actions once, not minions. Cory adopted this for now. Theoretical theft ceilings2/4/5 across rounds, plus inherent1 Magenta. Not an extra protection/purchase effect.
- RoundI, followers: **Steal1 resource × round. Gain1 follower × round.** Cory chose this third slot. Plus inherent1 Magenta. Extra follower purchases were rejected as weak in RoundI; optional color exchange was rejected because players can already choose which resources to steal.
- RoundII, stack theft: **Steal half of one rival’s resource pile, rounded down.** Pile means ONE COLOR’S STACK, not all resources combined; not restricted to their largest stack. Plus inherent1 Magenta.
- RoundII, Shakedown: choose a rival’s member; they pay to keep it, or you take it. Total-cost5-or-less remains provisional; payment formula not newly settled. Current runtime still uses ceiling4 and payment equal to total cost.
- RoundIII: **Take any rival’s member.** Existing theft protections apply; no replacement; active acquisition triggers Recruit, gifts do not.

## Live separately — v0.8.7

Contest: **Most magenta resources held at round end.** Engine, rim and round summary agree. Tied leaders get half prizes; zero holdings do not score. Published source c387ebd, Pages main d090f0c; actual public desktop/phone verified.

## Remaining decisions and runtime boundary

Confirm protection theft amount, Shakedown ceiling/payment, replacement color/name, member deck and prices. The action/theft redesign above is not implemented yet. Current source is src/engine/v4/content/thieves.js: theft still converts to Magenta, old actions remain, and there is no new universal+1 grant. Existing Poach already takes without replacement. Do not confuse the shipped contest with the unbuilt action redesign. thieves.md is historical, not this redesign’s authority.

Side request: larger PRINTED shop costs/follower text and icons shipped in v0.8.6 and retained in v0.8.7; values unchanged.
