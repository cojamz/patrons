# Member costs: first informed pass (2026-10-14)

Cory asked for an informed pass, using win rates. Method: in identical bot games, hand one member to one seat at the start of round II, then compare against the same games without it (160 games per member). "+followers" is the average gain for the seat that got it. Bots are crude, so this is one input; judgment did the rest. Cory's own numbers were kept: Mentor & Protégé 3+2, Twins 2.

Cost range target (Cory): cheapest 1–2, most 2–3, top 5–6. Red mostly cheap.

| Member | old | new (color + any) | measured +followers | note |
|---|---|---|---|---|
| Tycoon | 4 | 6 (4 gold + 2) | 7.5 | win condition on its own |
| Jackpot | 6 | 5 (3+2) | 5.0 | |
| Speculator | 5 | 4 (2+2) | 4.1 | |
| Midas | 5 | 4 (2+2) | n/a | bots can't use a switch well; judgment |
| Merchant | 2 | 3 (2+1) | 3.9 | |
| Investor | 4 | 3 (2+1) | 1.3 | bots invest half |
| Banker | 3 | 2 (1+1) | 1.8 | |
| Prospector | 3 | 2 (1+1) | 2.5 | |
| Tax Collector | 2 | 2 (1+1) | 3.2 | |
| Thrift | 2 | 2 (2) | 2.3 | |
| Coin Purse | 2 | 2 (1+1) | 2.2 | |
| Seed Money | 2 | 2 (2) | 1.5 | |
| Underdog | 2 | 1 (1) | 1.4 | |
| Tinker | 2 | 1 (1) | 1.3 | |
| Hustler | 3 | 1 (1) | 0.2 | weak as built |
| Proselytizer | 6 | 6 (3 red + 3) | 9.0 | |
| Recruiter | 2 | 4 (2+2) | 9.6 | was the most underpriced card |
| Sponsor | 3 | 5 (3+2) | 7.8 | |
| Patriarch | 4 | 5 (3+2) | 6.8 | |
| Mob | 3 | 4 (2+2) | 5.5 | |
| Big Family | 4 | 4 (2+2) | 5.5 | |
| Host | 2 | 3 (2+1) | 5.8 | |
| Mentor & Protégé | 5 | 5 (3+2) | 2.2 | Cory's number |
| Twins | 2 | 2 (1+1) | 3.3 | Cory's number |
| Doppelganger | 4 | 3 (2+1) | 1.8 | bots copy poorly |
| Recruiting Drive | 2 | 2 (1+1) | 2.2 | |
| Crowd-Pleaser | 1 | 1 (1) | 1.9 | |
| Intern | 1 | 1 (1) | 2.0 | |
| Reserve | 1 | 1 (1) | 2.3 | placeholder, no effect yet |
| Volunteer | 0 | 0 | 1.4 | |

Rerun: `node scripts/v4-member-value.mjs 160`.
