# Green — agreed implementation, October 18

This sheet supersedes earlier Green proposals in decisions.md. Working names remain provisional. No redesign outside Green is included.

## Copy rule

Copying a copy action lets its copier choose again. An action already in the current chain cannot be chosen again. Each Green action gives +1 green on every traversal, including copies. Independent branches of a copy-all have their own chain history; choices, remaining branches and recruit continuations must survive save/load.

Agents blocks everyone's copies of its owner's actions, including the owner's. Bait: anyone who copies one of your actions loses 1 follower; if they are a rival, you gain 1 follower. Self-copy loses 1 without a return. Neither card blocks ordinary placement.

## Actions

- I: Chorus (working name), +1 green per OTHER Green action with a minion; Build Up, +1 green × round; Echo, copy previous action.
- II: Encore, copy an action with a rival minion; Reprise, copy an action with your minion.
- III: Greatest Hits, copy every action with your minion.
- Add the inherent +1 green to each action above. Build Up totals 2 / 3 / 4 by round.

## Members

Costs are Green + any. All are one follower/member except Agents, which is two of each. A copied member adopts its target's effect and printed follower/member quantities.

| Member | Cost | Effect |
|---|---|---|
| Busker | 1+3 | Recruit and round start: +2 green. |
| Muse | 2+2 | When another player copies an action: +1 green. |
| Impressionist | 2+2 | When you copy an action: +1 resource of its color. |
| Stunt Double | 2+2 | Recruit: copy the action you just took. |
| Tribute Band | 8+2 | Once/game: copy every action you took this round. |
| Ensemble | 3+3 | When you copy your own action: +1 follower. |
| Doppelganger | 3+2 | Recruit: become a copy of one of your members. |
| Impostor | 4+2 | Recruit: become a copy of a rival's member. |
| Connector (working name) | 4+2, placeholder | Recruit and round start: +1 green per non-Green member. |
| Agents | 1+2 | Your actions cannot be copied. Two followers/members. |
| Bait | 3+2, placeholder | Anyone who copies your action loses 1 follower. If they are a rival, you gain 1 follower. |
| Chronicler (rename later) | 2+3 | Game end: +1 follower per Green member. |

Connector's cost is an implementation fill-in under Cory's go-with-your-gut instruction, not an approved balance decision. Bait's placeholder was requested by Cory. Equalizing other colors' deck counts remains separate backlog work; do not cut agreed Green members to satisfy the old ten-card cull.

## Implementation boundaries

Bait debits printed followers through a signed score adjustment; totals stop at zero. Its rival reward still applies at zero. Cards are never deleted to pay the loss. Results show the named loss and any zero-minimum adjustment. A Stunt Double recruit starts a fresh member-triggered chain, including when recruited during an action; ordinary copy-action descendants retain their branch ancestry.

Copy targets select with one phone tap; ordinary placements retain their existing confirmation. Current-member art reuses distinct retired Green silhouettes while names/art settle. The rest of the backlog remains open.

## v0.8.2 clarifications — October 19

Chorus excludes its own occupied space, including copies of Chorus; its inherent +1 still applies. Copy Previous selects the latest action regardless of who chose it, with no fallback past protected/blocked latest targets. Both Impostor and Doppelganger’s On Recruit ONLY creates the copy; it does not execute copied Recruit/immediate Now effects. Future Round Start/passives, member quantity and worker entitlements remain. No once-per-acquisition-chain rule was introduced; Red Panel’s self-movement is prohibited instead.
