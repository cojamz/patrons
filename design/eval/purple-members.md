# Purple members: Relay's replacement and a reprice (Claude, 2026-10-14; nothing approved)

Instrument for every number: member-value sim (scripts/v4-member-value.mjs), one member handed to one seat at the start of round II, compared with the same seeds where nobody gets it. 320 games each, 4 players, table gold/red/purple/green, Release on. Run once with Easy bots and once with Normal bots. Baseline win is 25%, and noise is about ±1 follower. Banker (cost 4) read 3.7 on Normal and 4.0 on Easy in the same runs.
Price uses the rule-benders scale: value × 1.5 − 1.5, rounded to an even cost. Normal bots are the main reading, and Easy is the cross-check.
Raw output and the scratch registration are in design/eval/runs/purple-members/. purple.js is untouched.

## Relay's slot (recommended order)
1. Night Owl (8+2): When you place your last worker of a round, take an extra turn right after this one. Measured value 6.9 followers, 53% win (Normal, n=320); 7.3, 53% (Easy, n=320). Price 10. Why it's clear: one trigger you can't miss (your last worker), one fixed outcome, and nothing to watch at the table. It pairs with Late Riser, who goes first while the Night Owl goes last. Round I fills every space, so it does nothing there and pays in rounds II and III, when yields climb.
2. Cheerleaders (2+2): Whenever you take an extra turn, +1 follower. Measured value 3.4, 43% win (Normal, n=320); 2.7, 38% (Easy, n=320). Price 4. Why it's clear: the most literal line possible, and it rewards the thing Purple's spaces already give you. It's the only cheap Purple member that turns time straight into followers. It's weak at a table that skips Purple's spaces, but the owner is the one choosing those spaces.
3. Sprinter (8+4): When you place your first worker of a round, take an extra turn right after this one. Measured value 9.3, 60% win (Normal, n=320); 11.7, 68% (Easy, n=320). Price 12 by the formula. Why it's clear: the same shape as Night Owl, the other end of the round. The risk is that it is the strongest member measured here, with a 60% win rate at Normal, so even at 12 it's hot. It's the same shape as Night Owl, so take one or the other, not both.

Also measured and cut: Relief Crew (Once per game: take 2 extra turns right after this one) measured 7.5, 57% (Normal) and 11.7, 74% (Easy), so its price is 10. It does exactly what Second Wind does, only twice, and would cost less than Second Wind's 12, which makes Second Wind a strictly worse card.

## Reprice at today's rules (cost is colored+any; Normal / Easy value and win%, n=320 each)
Caution: the hand-over skips "when recruited" and "now" effects, so Errand Runner, Lamplighter and Clockmaker read low. Keep those at their prices unless a play says otherwise.

| Member | Now | Normal | Easy | Proposed | Why |
|---|---|---|---|---|---|
| Apprentice | 4 (2+2) | 3.7, 43% | 4.4, 41% | 4 (2+2) | At Banker's level on Normal; the 4.4 was an Easy-bot reading. |
| Double Time | 8 (6+2) | 4.9, 50% | 4.0, 46% | 6 (4+2) | Formula 5.9 (Normal) / 4.5 (Easy). |
| Foreman | 6 (4+2) | 5.0, 47% | 2.8, 37% | 6 (4+2) | Normal says 6; Easy says 2–4. Kept, since Normal bots use extra turns better. |
| Courier | 6 (4+2) | 4.8, 46% | 3.8, 42% | 6 (4+2) | Formula 5.7 / 4.2. |
| Overseer | 6 (4+2) | 3.9, 44% | 2.1, 37% | 4 (2+2) | Formula 4.4 / 1.7. |
| Taskmaster | 8 (6+2) | 5.4, 48% | 2.6, 33% | 6 (4+2) | Formula 6.6 / 2.4. |
| Second Wind | 12 (8+4) | 6.5, 50% | 6.9, 52% | 8 (6+2) | Formula 8.3 / 8.9, both instruments agree. |
| Late Riser | 8 (6+2) | 4.8, 47% | 3.2, 42% | 6 (4+2) | Formula 5.7 / 3.3. |
| Bookkeeper | 6 (4+2) | 4.8, 48% | 4.6, 44% | 6 (4+2) | Fair on both. |
| Patience | 8 (6+2) | 5.8, 50% | 2.3, 40% | 8 (6+2) | Normal bots hold purple to the end; Easy bots spend it. |
| Errand Runner | 8 (4+4) | 2.1, 36% | 1.2, 32% | 8 (4+4) | Its effect is on recruit and the hand-over skips it; an extra turn in round II is about 5u, so 8 stands. |
| Lamplighter | 8 (6+2) | 4.9, 42% | 7.3, 57% | 8 (6+2) | The hand-over skips its "now" payment; fair even so. |
| Clockmaker | 4 (2+2) | 2.5, 41% | 2.9, 38% | 4 (2+2) | Formula 2, but the hand-over skips "now"; Cory already set 4. |
| Shift Crew | 2 (1+1) | 2.5, 36% | 2.2, 37% | 2 (1+1) | Fair. |
