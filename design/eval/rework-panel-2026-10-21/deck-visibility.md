# Deck visibility: how much of a color does a game show?

Deck analyst, rework panel, 2026-10-21. Counted from the live rules; no sims, no games. Every estimate is labeled as one.

## 1. The rules that move cards (live code)

- **Deck per table** (`content/index.js` CLASSIC, `defaultQuadrants`, cull on, guests on by default in `DEFAULT_RULES`):
  - 2 players: Gold 10 + Red 12 + 5 guests = **27**
  - 3 players: + Blue (market) 10 = **37**
  - 4 players: + Green (echo) 12 = **49**
  - Red and Green deal 12 (their reworks added cards; the cull list in `content/cull.js` predates them); every other color deals 10. With all colors at 10 the decks would be 25 / 35 / 45. Guests (Squatter, Freelancer, Extra Hand, Front-runner, Straggler) are always in, whatever colors sit at the table.
- **Shop**: `SHOP_SIZE = 7`. `refill` tops the row up from the pile the moment a card leaves.
- **Round start** (`startRound`, rounds II and III): the whole row goes to the **bottom** of the pile, then 7 fresh come off the top. So the pile is a queue: a card that was shown and not bought only comes back after every unseen card has been dealt.
- **Turns**: minions 3 / 4 / 5, so 12 turns a player; each turn is one action, then **one buy** (a member or one follower pack of 1, 5 or 10).
- **Cards through the row**:
  - Every recruit (buy, Red's Open Door "Recruit the cheapest shop member", Recruit a Member, Mentor & Protégé "recruit the cheapest shop member", Spree / Buy twice extra buys) deals one new card.
  - Promote / Demote / Even Swap: your member goes into the row in the shop card's place (`swapMembers`). Nothing is dealt; the row's makeup changes by one card.
  - Blue (live) New Faces sweeps the row: +7 dealt. Blue (planned): churn 3 (+3 dealt), flip out a color (+1 to 3 dealt, see section 3), peek top 4 and reorder (no deal, private look, controls what comes next).
  - Magenta's Poach and Shake Down move members between cults only; Release is off. Swapped-out, churned, flipped and refreshed cards all go to the pile bottom (no discard pile, Cory Oct 20).

## 2. The count

**Cards dealt face up across a game** = 21 (three rows of 7) + R (every recruit at the table) + churn.

Member recruits per player (estimate): the economy gives about 12 buys; some are follower packs. Cory's target was 6 to 7 members each (Oct 14); bots ran 3.4 to 5.2 under the older, pricier frame; the Oct 20 frame makes members the follower source and brings costs down, so it pushes up. I use **low 3, typical 5, high 7** per player, split roughly 1 / 2 / 2 by round (round I has 3 minions and the least money).

| table | deck | low (3 each) | typical (5 each) | high (7 each) |
|---|---|---|---|---|
| 2p | 27 | 21+6 = 27 (100%) | 21+10 = 31 (cycles 4) | 21+14 = 35 (cycles 8) |
| 3p | 37 | 21+9 = 30 (81%) | 21+15 = 36 (97%) | 21+21 = 42 (cycles 5) |
| 4p | 49 | 21+12 = 33 (67%) | 21+20 = 41 (84%) | 21+28 = 49 (100%) |

Blue sits at the 3p and 4p tables, so add its churn on top: two churns in a game is +6, a New Faces is +7. At 3p that tips every estimate into cycling; at 4p it lifts typical from 84% to about 96%.

**By round, typical (deals per round = 7 + that round's recruits):**
- 2p: I 9, II 11, III 11. After round II, 20 of 27 have shown; round III's opening row is the last 7 unseen cards, and its refills are round I's leftovers coming back around. **The 2p deck cycles in round III.**
- 4p: I 11, II 15, III 15 = 41. No cycling; about 8 cards never show.

**The row barely moves inside a round.** New arrivals per lap (between two of your turns) = rival recruits in that lap. At about 0.4 recruits per turn (5 of 12): 2p 0.4 new cards a lap, 3p 0.8, 4p 1.25. So each round is mostly one menu of 7 that the table picks through, plus a trickle. The round's opening row matters more than the deck size.

**One color in the row** (10-card color; hypergeometric on a 7-card row):
- 2p (27): 2.6 on average; none showing 2% of the time; two or more 84%. (Red's 12: 3.1 average.)
- 3p (37): 1.9; none 9%; two or more 63%.
- 4p (49): 1.4; none 18%; two or more 44%.

**One color across a game** = 10 x share seen: 2p about all 10 (some twice); 3p about 9 to 10; 4p about 8.4 typical, 6.7 low. A given card is in the opening row of round I with chance 7/N: 26% (2p), 19% (3p), 14% (4p).

**How many of one color a committed player can buy** (estimate). The ceiling is buys and money, not sight:
- Of 12 buys, a member-heavy player spends perhaps 5 to 7 on members; the rest are follower packs, and every resource spent is one not held for the round-end contest.
- The colored part of each cost wants that color, which comes mainly from that color's spaces (+1 each), so a player's colored income is a handful per round.
- Supply on your turns: 4p, each round opens with about 1.4 of your color and about 1.25 new cards a lap arrive, 20% of them yours, so about 0.25 a lap. Over 12 turns that is about 4.3 from the openers plus about 3 arrivals, or **about 7 chances**. 2p: about 2.6 per opener and 0.4 x 37% = 0.15 a lap, about 8 + 2 = **about 10**.
- So a committed player realistically buys **4 to 6 of their 10 at 2p, 3 to 5 at 4p uncontested, 2 to 3 if a rival shares the color.** Never most of it at 4p without Blue's extra buys.
- The whole table: typical 4p takes 20 of 49 cards (41%) into cults, so about 4 of any 10-card color end up owned by someone.

## 3. What it means for design

- **Seeing is not the constraint; getting is.** 2p sees the whole deck and cycles; 3p sees nearly all of it; 4p sees about 85%. What limits a color is one buy a turn, the money, and what is in the row on your turn.
- **No single card is reliable.** A given card shows at some point 67 to 100% of the time, but often late (round III, little time left) or on a turn you've already spent. Owning it is far less likely: a committed player gets about 40% of their color.
- **Two specific members together is a bonus, not a plan.** Both show in a 4p game about 0.84 x 0.84 = 70% of the time; one player owning both is perhaps 15 to 25% (estimate), lower if a rival shares the color. A color can have pairs that sing, but each half must be worth its price alone.
- **Count cards should be priced for 3 to 5 of the color, not 10.** Mob ("+1 per red member"), Snob ("+1 per blue member"), Chronicler ("+1 per green member"), Patron Saint: a committed owner finishes with about 3 to 5 of the color. These also scale with table size: at 2p a color is 37% of the deck and 2.6 in every row; at 4p it is 20% and 1.4. "Per member of your color" cards are about twice as easy to feed at 2p.
- **Ten color cards vs five guests.** Guests are 19% of the 2p deck and 10% of the 4p deck (1.3 vs 0.7 in a row; none showing in a 4p row 45% of the time). At 2p all five show every game; at 4p about 4 of 5 show. Guests are the only cards present at every table, so they are the most "known" cards in the game; that is a reason to keep them few and clear, and to watch their power hardest at 2p, where everyone sees all of them.
- **The 12-card decks.** Red and Green deal 12 against everyone else's 10, so they show about 20% more often. Not ours to touch tonight; flagged because HANDOFF already lists "target equal".
- **Blue's actions against these numbers:**
  - Churn 3: +3 cards seen. At 2p and 3p, where the deck is already exhausted, it mostly speeds cycling (churned cards come back in round III at 2p). At 4p it is real new sight (+6% of the deck a use).
  - Flip out a color: dumps every shop member of one color, so its size is that color's count: about 2.6 at 2p, 1.9 at 3p, 1.4 at 4p (none 18% of the time). It's strongest at 2p and weakest at 4p, the reverse of churn. That suits "deny a rival's color" more than "find my own".
  - Peek top 4 and reorder: the strongest planning tool on this board. The row moves 0.4 to 1.25 cards a lap, so the top 4 is the next several laps of arrivals; used late in a round, it sets 4 of the next round's opening 7. That is the one way to make a specific card show when you want it.
  - Buy twice / Spree: the only lever that lifts the ceiling on owning your color. The row holds 1.4 to 2.6 of a color, so two or three buys in one turn is how a player takes a pair before rivals do. Members that reward owning several of a color get much stronger in a Blue player's hands; price with that in mind.

## 4. The choice

**(a) Assume you won't see or buy all of a color (keep 10 per color, 7 in the row).** Every member stands alone; pairs and "per member of your color" cards are bonuses priced for 3 to 5. Variety between games comes from which cards show up and when (Dominion-style, though at 2p the variety is only in order). Consequences: a color's identity has to be readable from any 3 or 4 of its 10; tight two-card combos are off the table; Blue's dig-and-buy-twice tools become valuable to everyone.

**(b) Design so a committed player can see and buy most of their color.** Two routes:
- Smaller color decks (8 a color, Claude's fill-in): 4p deck 37, typical deals 41, so the whole deck shows and cycles; a committed player could take 4 to 5 of 8. Consequences: combos become plannable, contests by member count tighten, each card weighs more, but less difference between games and every weak card shows every game.
- A growing row (Cory's "maybe the number of members in the shop should grow each round? maybe not"), e.g. 6 / 7 / 8 or 5 / 7 / 9 (Claude's fill-ins). Total sight barely changes (+0 to +3 cards a game) but the menu per turn grows when money is highest, which fits "round III is the burst". Consequences: Promote, Demote and Blue's flip get stronger later (more targets); churn gets relatively weaker; the screen gets busier (8 felt overwhelming on Oct 20).

**(c) Middle: (a) as the rule, with seeing and owning more as something a color earns.** Keep 10 and 7; members stand alone; each color may have one or two cards that pay off owning several of the color, priced for 3 to 5; Blue is the color that digs (peek, churn, buy twice), so "get most of my color" is a strategy you pay minions for, not a given.

**Recommendation: (c).** The count says the game already shows nearly everything (all of it at 2p), so shrinking decks buys little and costs variety and room for weak cards to hide; the real limit is buys and money, and that is a good limit because it is where the hold-vs-spend tension lives. Designing members to stand alone also passes "interesting but not complicated" more easily: a player reads one card in the row and knows what it does for them. The growing row is worth a later look only if round III feels starved; it is a screen-space question first. One rule for the panel: price every "per member of your color" card for 3 to 5 copies, and check it at 2p, where it is easiest to feed.
