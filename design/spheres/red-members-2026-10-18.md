# Red members — October 18 discussion

Cory requested readback and recommendations, not implementation of this member batch. Red action release continues independently.

## Cory’s keepers / changes

- Keep Host, Mentor & Protégé, Recruiter, Patriarch and Proselytizer.
- Mob: counts as 5 members/followers, retains game-end +1 follower per red member, and should be expensive. Cory explicitly confirmed both the printed 5 and existing bonus. Cost not locked.
- Volunteer: cost 0, no effect.
- Twins: cost 2 red, counts as 2 members/followers.
- Family (5 followers, cost 2 red + 2 wild) and Big Family (7 followers, cost 3 red + 3 wild) were proposed, then Cory said “actually maybe we drop family and big family.” Treat both as dropped for now; do not implement the earlier numbers.

## Proposed effects, unnamed and unpriced

- Confirmed: gain one resource of the member’s color per Recruit ability triggered, not per acquisition. Name/cost remain open.
- Confirmed: “When you move a rival’s member out of their cult, they lose 1 follower.” This replaces the original any-player wording; no same-container reordering trigger. Name/cost remain open.
- On Recruit: Promote or Demote a member.

Eight keepers plus three proposed effects = eleven slots. No twelfth member invented or approved.

## Exploratory / not locked

- Activate: swap this with any member — Cory immediately called this too strong.
- +3 members; any member can be promoted/demoted to this member — Cory noticed current Promote/Demote only exchange with shop. Requires a rules exception if the card in a cult becomes an alternate destination; parked.

## Assistant recommendations (not Cory’s decisions)

- Keep all three proposed additions: recruit economy, disruption payoff, and a combo starter.
- Resource reward per Recruit ability triggered is now confirmed above. Copied abilities and multicolor definitions still need precise implementation.
- Rival movement wording is now confirmed above.
- Keep Host and Recruiter initially, despite overlap; one rewards existing quantity, the other repeated acquisition.
- Latest last-slot recommendation (not approved): **Loyalists** (placeholder): “Your members can’t be swapped.” Applies to your own swaps too, blocks Promote/Demote and Even Swap involving your cult, not theft. This protects accumulated membership while sacrificing your own promotion/recruit recycling. No extra tracking.
- Promote/Demote: recommend retaining shop-only replacements. Targeting a rival’s member remains implemented. Expanding replacement sources to rival cults is a separate unresolved design call.
- Mob’s own 5 red members give its existing bonus +5: it scores 10 alone before other red members, and adds 5 to red competitions and other membership counts. Explicit balance implication, not a price recommendation.
- Cory says the quantity and turnover paths may reinforce each other too much; seek symmetric restrictions with real opportunity cost, not a free defensive passive.

## Recruiter implementation check — v0.8.0

Current core routes purchases, free recruitment, theft and the initiating actor’s incoming swap through memberAcquired/onAnyRecruit. Recruiter therefore already pays for active acquisition from shop, pile or rival cult, not merely paid shop buys. Passive gifts remain excluded under Cory’s earlier distinction (given versus taken). Its own acquisition is excluded by its existing hook. No code change made during this discussion.
