# Magenta redesign — October 19

## Live actions — v0.8.8

- Stolen resources retain their original colors. Stop converting theft into Magenta.
- Every action grants1 Magenta in addition to its printed effect. Color/name replacement remains open; Cory dislikes Magenta.
- RoundI, Lie Low: steal1 resource×round; your members and resources cannot be stolen this round. Uses the working scaling selected for implementation. The earlier plain scaling-steal duplicate is superseded.
- RoundI, occupied actions: **Steal1 resource per Magenta action that already has a minion.** Exclude the minion just placed; count occupied actions once, not minions. Cory adopted this for now. Theoretical theft ceilings2/4/5 across rounds, plus inherent1 Magenta. Not an extra protection/purchase effect.
- RoundI, followers: **Steal1 resource × round. Gain1 follower × round.** Cory chose this third slot. Plus inherent1 Magenta. Extra follower purchases were rejected as weak in RoundI; optional color exchange was rejected because players can already choose which resources to steal.
- RoundII, stack theft: **Steal half of one rival’s resource pile, rounded down.** Pile means ONE COLOR’S STACK, not all resources combined; not restricted to their largest stack. Plus inherent1 Magenta.
- RoundII, Shakedown: choose a rival’s member; they pay to keep it, or you take it. Targets cost5 or less in total; the holder pays that total cost to keep the member. These are the working implementation numbers. Paid resources keep their colors; the prompt names the actual payment before the holder chooses.
- RoundIII: **Take any rival’s member.** Existing theft protections apply; no replacement; active acquisition triggers Recruit, gifts do not.

## Live separately — v0.8.7

Contest: **Most magenta resources held at round end.** Engine, rim and round summary agree. Tied leaders get half prizes; zero holdings do not score. Published source c387ebd, Pages main d090f0c; actual public desktop/phone verified.

## Other rules and remaining design

Bodyguard now says **Rivals can’t steal from you**, blocking both resources and members. General resource steals can split among multiple rivals in any colors. Doubling and+1 modifiers apply once to the overall theft total; individual picks remain one resource. Half-pile theft is specifically one chosen rival’s one-color stack. Copies perform actions afresh, including each inherent1 Magenta grant, without repeating on resume. Occupancy excludes only a newly added placement; older minions still count when copying or sharing a space. Help Yourself grants followers after theft, so that reward cannot alter Desperado’s eligibility before its theft is calculated.

The six actions and supporting rules are live from source68c9bf0, Pages mainf366272. Served stamp and all14 desktop/phone action scenes plus2 scoring scenes verified. Magenta resource contest shipped previously in v0.8.7. Existing member deck/prices retained, except Bodyguard’s expanded protection and removing obsolete conversion text. Replacement color/name and new Magenta member deck remain design work. thieves.md is historical; this file is authoritative.

Side request: larger PRINTED shop costs/follower text and icons shipped in v0.8.6 and retained in v0.8.7; values unchanged.
