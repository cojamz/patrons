# Red member deck — implemented for v0.8.2

Final implementation authorized October 19, 2026. Runtime source/evidence: ../eval/red-members-v082/verification.md. Earlier discussion and proposed prices remain in decisions.md; this is the current deck specification.

| Member | Red | Wild | Members / followers | Effect |
|---|---:|---:|---:|---|
| Volunteer | 0 | 0 | 1 | No effect. |
| Twins | 2 | 0 | 2 | No additional effect. |
| Recruiter | 3 | 1 | 1 | When you recruit, +1 red. |
| Recruit Bonus (temporary name) | 2 | 2 | 1 | When you trigger a member’s On Recruit, +1 resource of its color. |
| Patriarch | 3 | 2 | 1 | Game end: +1 follower per 2 members. |
| Movement Penalty (temporary name) | 3 | 2 | 1 | When you move a rival’s member out of their cult, they lose 1 follower. |
| Loyalists | 2 | 3 | 2 | Your members can’t be swapped. |
| Host | 4 | 2 | 1 | On Recruit & Round Start: +1 red per 2 members. |
| Proselytizer | 4 | 2 | 1 | When you recruit, +1 follower. |
| Panel | 4 | 2 | 3 | On Recruit: Promote or Demote another member. |
| Mentor & Protégé | 5 | 3 | 1 | On Recruit: recruit the cheapest shop member free. |
| Mob | 6 | 4 | 5 | Game end: +1 follower per red member. |

## Locked rules

- Printed follower groups count as that many members. Mob alone is 5 printed followers +5 from its own game-end bonus; it counts as 5 red members for other card effects. Red’s arc contest counts resources, not membership.
- Panel’s physical card cannot be either side of its own swap, including after saved choices or relocation. It may target any other cult’s member; replacements remain shop-only. The wheel’s Promote/Demote retain unrestricted member targeting. Compare printed colored +wild totals, not payment/discounts.
- Loyalists blocks all swaps involving its cult, by owner or rivals, including Loyalists itself. It does not block theft. Both its bodies count normally.
- Active acquisition from shop, pile or rivals (including theft and actor’s incoming swap) triggers Recruiter. Passive gifts do not. Existing Recruiter and Proselytizer self-arrival exclusions remain.
- Recruit Bonus rewards an actually invoked Recruit ability, not any arrival, passive payout or ordinary round start. The On Recruit portion of a Now/Round Start member qualifies. Physical member color governs its reward.
- Neither Impostor nor Doppelganger fires copied On Recruit/immediate Now effects. Becoming the copy IS its On Recruit. Future Round Start/passives/member weights and Extra Hand entitlements remain effective.
- Movement Penalty applies to each rival outgoing member, including both sides of a two-rival swap, never an own-member move or same-container reorder. Loss stops at zero; it cannot create hidden debt against future followers.
- No once-per-chain guard was added. A verified Panel/Stunt repeat was removed by Cory’s “another member” rule; identity-copy repeats terminate under the new copy semantics. The initial Impostor/Mentor loop explanation was incorrect and corrected, with a terminating regression retained.

## Scope / fill-ins

Cory confirmed upper prices, Volunteer/Twins, Loyalists and member bodies. Remaining suggested prices were used under his implementation-priority/go-with-your-gut instructions. Recruit Bonus and Movement Penalty are descriptive temporary names. Existing art is reused; this is not the higher-fidelity art pass.

Family/Big Family, Intern, Benchwarmer, Pied Piper, Sponsor and Crowd-Pleaser are absent from the ordinary deck. Legacy definitions remain for old records and full-deck tests. Normal Red now has twelve members. Default price ceiling 10; remain on release series 0.8.x until Cory says otherwise.
