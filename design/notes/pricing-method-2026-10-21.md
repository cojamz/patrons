# Pricing members from play data (Oct 21, recommendation)

Cory's ask: "Price A in X games, price B in Y games, compare win rate in the groups", plus a next step he couldn't name yet. He also wants concepts that run from strong to weak, which pricing every card to "even" flattens.

## How others do it
- **17lands (Magic drafts):** "win rate when in hand" against "not drawn", and the gap between them (improvement when drawn). It's cheap, and every card is measured from the same games. The weakness is selection: cards that get played in already-winning games look good. They live with it because they have millions of games.
- **Dominion simulators (Geronimoo, Dominiate):** bot strategies play each other thousands of times, and a card's rating is the win rate of the best strategy that uses it. It keeps strong cards strong, because the rating is a tier ("this card is worth building around"), not a price.
- **Regression over random decks (Hearthstone and MTG data work, and ours already: `v4-fair-price.mjs screen`):** every game jitters every card's price at random. One regression then gives each card's value and the value of a resource, all from the same games. Randomizing prices is what removes the selection problem 17lands has.
- **Paired games (ours, `sweep`):** the same game played with and without the card at a set price. It's the most precise, but it's one card at a time, so it's slow.

## Recommendation
1. **Screen everything at once.** One run of about 3,000 Normal-bot games with every member's price jittered. The output is each card's value in wins per resource spent, for all colors from the same games, so colors are comparable. About an hour on this box.
2. **Price to a target edge by tier, not to even.** Cory places each card in a tier (strong, middle, weak). The price is set so the owner's win rate lands on that tier's target (for example +4 points for strong, +2 for middle, +1 for weak at 4 players). Strong cards stay strong *and* pricey, weak ones stay cheap but still worth a buy. Cory picks the targets once.
3. **Confirm only the outliers** with paired games (`sweep`): cards the screen can't pin down (rarely recruited), cards where 2 and 4 players disagree, and judgment cards (Double Agent, Bodyguard) with Hard bots (`--level=hard --budget=20`, about 13 times slower).
4. **Check the table:** buy-followers-only wins about 25% against Normal and Hard bots.

What it fixes: today's method prices every card to "even" (no card makes you more likely to win at its price), takes about 6 hours per color, and measures colors in different runs.
Time per color with it: the one-hour screen covers every color together; then about 1 to 2 hours of sweeps for 2 or 3 outliers per color.
