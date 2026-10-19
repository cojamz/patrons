# Magenta redesign — October 19

## Locked by Cory

- Begin Magenta next, after Red and Green.
- Round II — **Shakedown:** Choose a rival’s member. They pay you to keep it, or you take it. Cory confirmed this shape; the cost limit remains open.
- Round III: **Take any rival’s member.** This is the aggressive anchor to work backward from.
- Existing theft protections apply, and the victim gets no replacement, under previously confirmed rules. Taking a member yourself is an active recruitment; a gift does not trigger recruit.

The Round III runtime already has this behavior (`thieves.heist`, shown as Poach). No Magenta rule change was needed merely to lock this anchor.

## Open design work

The second Round II action, Shakedown’s cost limit, Round I actions, member deck, prices and competition scoring remain open. Shakedown’s payment formula is not newly locked by the shape confirmation; current runtime uses the target’s total cost until redesigned.

Current implementation is `src/engine/v4/content/thieves.js`. `thieves.md` contains an older historical proposal and must not supply current costs or victim replacement behavior. Keep temporary color changes/backlog fixes separate from new Magenta balance decisions.
