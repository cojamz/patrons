# Magenta members: judge and pricing critique (rubric v3)

Claude, 2026-10-21, overnight panel. Seat: "would Cory like this" plus pricing. Reviewed only pitches/magenta-members.md. No sims, no games. Predictions are guesses.

## The magenta-income claim, checked against thieves.js

Direction holds; a few edges are overstated.
- Right: magenta comes only from the +1 on each Magenta action (copies included, thieves.js line 377). Spaces are 3/5/6 a round, so about 12 visits a game at 4 players. A specialist taking about 2 a round gets 6, plus copies, so **6–9 gained in a game** is fair. The contest scores held magenta, so every magenta spent on a member is taken off the contest.
- Missed: **the thief picks the color on every steal from a space** (`take:<rival>:<color>` options), and Crime Wave takes half of *one chosen pile*. So magenta moves between the players who visit Magenta, and a specialist can steal a rival thief's magenta. That doesn't add magenta to the table; it makes the contest more contested.
- Overstated: "nobody else can buy any of them". Snap Up and Half Price (Blue) and Freelancer pay colored parts in any colors, so a victim can reach Bodyguard when Blue or Freelancer is in the game. Still a real wall in most games.
- Conclusion: magenta parts of 1–2, with 3 on the identity cards, is the right rule. Deck A's total of 19 is sound.

## Per card (deck A unless noted)

| Card | Proposed | Predicted verdict | Conf. | Price/follower note |
|---|---|---|---|---|
| Crew, "Worth 2 followers." | 1+1 f2 | yes, nothing changes | 90% | Fine. Note: live Crew is f2 but **n1** (one member). Don't let it become two members by accident; that would change Kingpin's count. |
| Cutpurse, "now and at round start, take 1 from the richest rival" | 1+3 f1 | yes; round-start income he likes | 75% | 4 is right by the 2X rule (pays about 3 bought in round I, and it's theft). |
| Grifter, "take 1 per 2 members you have" | 2+2 f1 | yes ("kinda cool") | 70% | Slightly dear: at 4 members (round II) it's about 0.9. Better **3 (1+2)**, so buying it late is a real play and not a trap. |
| Desperado (live) | 2+2 f1 | yes | 70% | Price fine. The combo flag is real and it's worse than the pitch says (see Robin Hood). |
| Sticky Fingers, "+1 resource on your steals from spaces" | 2+3 f1 | maybe; "bigger number, no decision" | 50% | 5 is fair (about 1.5 bought in round I, 1.1 in round II). Fence beats it on feel; see below. |
| Shoplifter (new), "When you recruit a member, steal 1 resource" | 1+4 f1 | **yes, it's his own #26** | 80% | Price 5 is fine. Change the split to **2+3**: his note says "essential to magenta", and with 1 magenta every builder buys it as a neutral. Say whether Poach and Double Agent count as recruiting (the pitch implies yes); simplest is "when you buy a member". |
| Robin Hood, "+1 follower per resource taken" from the leader | 2+4 f1 | **no as written**; likes that it scales, will hate the blowup | 35% | **Broken with Crime Wave**: half of a leader's 10-pile is 5 resources *and* 5 followers. Add Desperado (both are catch-up, so the same trailing player wants both) and it's 10 and 10, from **two** cards, not three. Fix: **"When you steal from a space and take from the player with the most followers: +1 follower × round."** One payout per action, it grows by round, and Cutpurse/Shoplifter can't trigger it. Price 2+4 then holds (about 5 a game). |
| Bodyguard, "Rivals can't steal from you." | 1+5 f2 | **yes**; reaching his "good" card is the point | 80% | Right. One trip to Magenta buys the defense. |
| Double Agent, "When recruited: swap it for any rival's member." | 3+3 f1 | yes; live card, price held | 70% | Fine. Remember rubric 10: losing a member early is allowed only because this card is live and he kept it. |
| Kingpin A, "Worth 3. Game end: +1 per magenta member" | 3+5 f3 | maybe; "that's Mob" | 40% | **Underpriced; the pitch's math leaves out its own 3 bodies.** It counts members printed on the card (countMembersOfColor), so Kingpin counts 3 for itself. Kingpin + Bodyguard (2) + two singles = 7, plus 3 printed = 10 for 8. And it's the third copy of a template (Mob, Chronicler). Cut the A version. |
| Kingpin B, "Game end: +1 per magenta member you have" | 1+4 f1 | **yes, his own #69 words** | 65% | Right by the scorer rule: a committed thief with 4–5 magenta members (about 5–6 counted) gets about 6–7 for 5. The risk is Chronicler's twin, but it's his idea. Use this one in either deck. |
| Fence (B), "When you steal from a space, +1 magenta" | 2+3 f1 | maybe-yes; it answers his "magenta doesn't gain enough" | 55% | 5 is fine. Say it more simply: **"Your Magenta actions give +1 more magenta."** Every Magenta action steals or takes anyway, so the effect is the same and the card reads in one breath. It fixes the scarcity at the source; offer it as the swap for Sticky Fingers. |
| Black Market (B), "buy rivals' members; the payment goes to the owner" | 3+7 f1 | maybe-no: "interesting, not now" or "too harsh before round III" | 35% | 10 is right for a rule-bender. But it's Poach/Shake Down again on every buy, losing a member before round III is his named limit, and it needs a new way to buy on screen. Park it; raise it once, in one line. |

## What should reach Cory (4–6, plainly)

1. Make Magenta's members cheaper in magenta: most ask 1–2 magenta and the rest in any color, because a thief only ends a game with about 6–9 magenta and needs it for the contest. [yes]
2. Bodyguard, "Rivals can't steal from you": 6 with only 1 magenta, worth 2, so the people being robbed can actually buy it. [yes]
3. Your own "steal when you buy a member" (Shoplifter) takes Extortionist's slot, at 5 with 2 magenta. [yes]
4. Kingpin becomes "Game end: +1 follower per magenta member you have", at 5. [yes]
5. Robin Hood scales: "+1 follower × round when you steal from the leader from a space" (not per resource taken, which pays 5–10 off one Crime Wave). [yes]
6. Optional: Fence, "Your Magenta actions give +1 more magenta", in place of Sticky Fingers. [try it]

Must not let through: Robin Hood "per resource taken" (Crime Wave plus Desperado), and Kingpin A's worth-3 version at 8.

Foreman check: the 'data catch' above is wrong. core.js printedMembers = max(f, n), so Crew (worth 2) already counts as 2 members.
