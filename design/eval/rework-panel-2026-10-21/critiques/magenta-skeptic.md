# Magenta members: skeptic (2026-10-21)

Scope: design/eval/rework-panel-2026-10-21/pitches/magenta-members.md only. Grounded in strategy-read.md and live code (thieves.js, red.js, core.js). No sims.

## Code facts that change the read
- `ctx.steal` with a member counts the member as 1 unit (`n += 1`), and a paid ransom counts as a steal of its full cost (thieves.js ransomAnswer). "Per resource taken" must say resources only, and it includes ransoms.
- A taken member goes through `memberAcquired`, which fires every `onAnyRecruit`. So a Recruiter-style "When you recruit a member" fires on Poach, Shake Down takes, Double Agent and Red swaps too. Shoplifter rides all of those.
- Double Agent hands its card over with `moveMember(..., recruit:false)`: no refire for the victim, so no swap-back chain. Good.
- Bodyguard's `guardSteal` blocks `canSteal` for resources and members, and `swapMembers` checks `canSteal(actor, owner, 'member')`, so it also blocks Red's swaps. It is a strict superset of Loyalists (2+3 f2, "Your members can't be swapped").
- Mob is 6+4, worth 5, counts as 5 (`n: 5`). "Worth N" alone (Crew `f:2`) counts as one member; Kingpin A needs `n:3` spelled out or its "3 + 3 own bodies" math is wrong.

## Per card
- **Crew 1+1 f2: keep.** Par body, ransom fodder.
- **Cutpurse 1+3 f1: keep.** Cutpurse's round-start take is a steal, so with Robin Hood it pays +1 follower a round whenever the richest rival also leads. Fine at 1.
- **Grifter 2+2 f1: keep.** Bought late it's 4-5 stolen for 4. A Red swap or a take refires it for the taker; theft magnet as intended. Dropping "from the richest" adds a pick prompt per resource; bots and UI need it.
- **Sticky Fingers 2+3 f1: keep.** Dull but honest.
- **Desperado 2+2 f1: keep**, but it is the multiplier in the one real blow-up (below).
- **Robin Hood 2+4, "+1 follower per resource taken": fix. CRAZY bad as written.** One Crime Wave on a leader holding 10 of a color: 5 stolen, 5 followers. Add Desperado (doubled to 10) and Sticky Fingers (11): an 11-follower and 11-resource swing off one round II space, against the player who was "only" leading. A paid Shake Down ransom of 5 from the leader is +5 followers too. The pitch's "4-7 a game" is one use. Fix: "When you steal from a space and the victim has the most followers, +1 follower × round." It scales (Cory #67), it's bounded at 1/2/3, it ignores Cutpurse and Shoplifter drips (the reason × round was cut), and it reads like Help Yourself's own wording. Or keep per-resource with "up to 3".
- **Shoplifter 1+4 f1: fix.** Same trigger and size as Red's Recruiter ("When you recruit, +1 red", 3+1): a near-copy where theft is the only difference, though the difference is real (zero-sum, any color). Fixes: say who it hits ("from the richest rival", automatic like Cutpurse, so no prompt every buy), and decide on purpose that it fires on members you take (code does). Stacks with Robin Hood into "+1 follower per recruit" while the richest leads: Red's Proselytizer by combo. Acceptable.
- **Bodyguard 1+5 f2: keep, flag 2 players.** Right buyer, right price. But at 2 players one 6-cost card switches off the whole magenta deck (Cutpurse, Shoplifter, Grifter, Robin Hood, Double Agent) and every magenta space but its +1. That is a dead deck for the thief, not a defense. It also makes Loyalists redundant for anyone who can find 1 magenta. Cory should hear the 2-player line before he takes the reprice.
- **Double Agent 3+3 f1: keep.** Dead in round I (rivals own a Crew; you trade 6 for 2). In round II it takes a rival's 10 (Mob) for 6, which is the live sting at a lower magenta part. Softener f2 as pitched.
- **Kingpin A, 3+5 f3, "Worth 3. Game end: +1 per magenta member": fix.** It is Mob at 8 instead of 10, the "Mob again" risk the pitch names. Take deck B's plain version (1+4 f1, Chronicler's shape) in both decks, and leave A's top slot to Cory's call rather than ship a smaller Mob.
- **Fence 2+3 f1 (deck B): keep as the swap.** A +1 template, but it is the only fix for magenta scarcity that leaves the locked actions alone. It also counts ransoms and copied magenta steals.
- **Black Market 3+7 f1 (deck B): cut.** Round III, last buys: you buy a rival's Mob for 10, they get 10 resources they can no longer turn into followers. They lose 5 printed plus the count: "straight up losing a member" outside a round III action, his "CRAZY bad" line. It also gets the On Recruit, Shoplifter fires on it, Sponsor's discount cuts the victim's payment, and it's new click-a-rival UI. Shake Down, Poach and Double Agent already take members; a fourth way isn't a light rework.

## Verdict
Deck A, with Robin Hood fixed (× round, steals from spaces) and Kingpin as B's plain scorer. Fence offered as the swap. Black Market cut. The one thing not to let through: Robin Hood per resource.
