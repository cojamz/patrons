# Purple, final (rework panel, 2026-10-21)

Re-priced under Pricing v2.

Gate fixes applied (see gate.md).

## Re-priced (Pricing v2, Oct 21)
- Latecomer: 3+2 = 5 → 2+1 = 3, followers 1 → 1. The deck needed a second cheap card; it's a late-in-the-round buy in any round (4.3 for 3 on your last round I minion, 6.3 for 3 in round III).
- Alarm Clock: 3+3 = 6 → 3+2 = 5, followers 2 → 2. Its job is a round II space, priced a step cheaper; with no income members it's two bodies, so it shouldn't be dear.
- Closing Time: 3+3 = 6 → 3+2 = 5, followers 1 → 1. A scorer at what it pays a committed player (about 6), one step cheaper.
- Lamplighter: 5+2 = 7 → 4+2 = 6, followers 1 → 1. Live at 8 and only ever "too dear"; a round II card for most, round I for the purple player, a hair above Banker (+3 at 5) since it grows 3/4/5.
- Kept: Shift Crew 2 (live, f = C), Night Owl 10 (live total, his followers; a rule-bend of Extra Hand's size, two rounds of it).
- Curve, old: 2, 5, 6, 6, 7, 10. New: 2, 3, 5, 5, 6, 10. Cheap 2, middle 3, dear 1.
- Weakest card: Latecomer. At 3 it's a follower pack that grows late in the round; any dearer and the plain pack beats it, so it only lives cheap.
- Board check: no Purple space reads member prices. Fast Forward's cap of 6 reads income amounts, not prices, so its numbers stand. Latecomer (3), Shift Crew (2), Alarm Clock (5) and Closing Time (5) are Shake Down targets. Purple parts now sum to 19 (was 21).

**Every card text and number below is Claude's fill-in, not approved. Exceptions marked (live) or (Cory's) keep his text or his numbers. Nothing ships until Cory says so.**

Reviser: built from purple-anchor concept A ("your future, now"), trimmed hard, with three pieces lifted from purple-outsider concept 2 (Latecomer, the Night Watch scorer, the round-end gain). Sources: the five critiques (pricing 3, feel 2.5, judge 3, skeptic 3 "fix heavy", architect: recommended), brief.md, member-shape.md, pricing.md, deck-visibility.md, cory-judge.md, live purple.js and core.js, Cory's Purple notes (Oct 15 16:54 and 17:53, #80, #92, #99, #101). No sims, no games, no code.

## Identity

Purple chooses **when**. It pulls later things into now (Crunch Time takes your next two turns now; Fast Forward pays your members' round-start income now), it pushes a gain past the shop so it can only score (Overnight pays at round end), and its round I spaces pay for picking early or late on your own clock (Plan Ahead and Cory's Catch Up). What changes at the table: one player taking several turns in a row happens once a round at most, from the center, so the dead air and the "why is it their turn?" of today's Purple mostly go away. Purple becomes a color that buys round-start income members of *any* color and fires them again, so a purple player shows up in other colors' shops and contests. Round I stops being "+4 purple" (Clock In today is the biggest flat gain in round I on the board) and becomes a small early-or-late puzzle that rivals can spoil.

**Contest: most purple held at round end, 2/4/6** (was "most purple members"; this follows the Oct 20 frame every reworked color moved to; asked once across colors, not as a Purple pick). Overnight and Lamplighter feed it, and every purple member's colored part comes out of it.

### What the trim cut, and why (critics agreed on all of these)
- **Head Start, Errand Runner, Double Shift, Rush Job, Go-Getter, Late Riser.** The rule from the brief: at most one turn source besides Crunch Time. The arithmetic decides which: a single "take your next turn right away" on a *space* is worth nothing for its turn move, because it only reorders your own picks (you get the space you wanted next either way, and Head Start takes the place of the pick you'd have made later). It's Overtime's "lose a minion for slight position gain". A move or extra turn only pays on a *member*, because a member costs no placement. Of the members, **Night Owl** stays (Cory set its followers; it fires after your last minion, so it never jumps anyone and chains at most two turns). Late Riser goes even though it's live: it fires for the player with the fewest followers, who already picks first, so in round III it chains with Crunch Time into four placements in a row, and it stacks a fourth catch-up on the snake.
- **Wake Up** (a round I "one member's round-start effect now"): pays 1 on a first pick, and three re-fire sources was one too many (pricing, skeptic, judge). The board keeps one (Fast Forward) and the deck one (Alarm Clock).
- **Clockmaker** (live, "+1 purple per 2 purple you have"): Fast Forward would fire it again, and it compounds (10 → 15 → 22). Brief rule 6.
- **Sprinter, Punch Clock, Timekeeper, Courier, Overseer, Bookkeeper, Taskmaster, Foreman, Apprentice, Corner-Cutter.** Sprinter pays by seat (snake ends double up 4 to 5 times a game, middle seats 0 to 1). Punch Clock is White's live Sob Story. Timekeeper is the hoard scorer every color has; Closing Time replaces it. The rest trigger on extra turns, which are almost gone, or were already cut by Cory.
- **Roll Call, Rush Hour, and today's Catch Up rule** ("+1 per rival who's placed more minions than you"). Catch Up takes Roll Call's rule, which is Cory's own 1/2/3.

## Actions

### Round III: Crunch Time (live, +1 added)
"Take your next 2 turns right away. +1 purple."
- Walk-away, 4 players: taken first with two other anchors open, about 13 (its two pulled picks become anchors instead of fillers), which is about +4 over just taking the best anchor, plus about 6 denied to each of two rivals. One anchor left: about 7. None left: 2 to 3.
- 2 players: about 6 to 7 (the other anchor plus a good ring II space), and the one rival gets no anchor.
- It's relative by nature, so no cap. The trailer picks first in round III, so it's also Purple's catch-up.
- Copy: **not flagged** (as live). A copy replays the taker's gain, which is the +1 purple, so Green never adds a second chain of turns.
- Risk to name (architect): at a 4-player table with no Recruit a Member or Spree, the trailer can take 3 of the 4 anchors. Play it before tuning it. The #99 display fix ("Crunch time took 2 Next turns… non-intuitive") still matters.

### Round II (×2)
**Fast Forward** "Your members' round-start income comes again now, up to 6. +1 purple."
- Rules line (glossary hover): income means resources a member gains. Steals (Cutpurse) and extra turns don't fire. That's the skeptic's "resources only" fix.
- Walk-away, round II: 1 with no income members; 5 with Lamplighter (4 + 1); 7 at the cap with Lamplighter plus any cheap income card (Busker +2, Shopkeeper +2, Banker +3). Round III: the same, as fuel for the last buys. Same at 2 and 4 players (it reads your own cult).
- Why it passes the round II bar: it changes how much you own, and it grows as you buy members. It's the one space on the board that pays you for owning *other colors'* income members, so it pushes members, not follower packs.
- Cap 6: rule 4 (about 5 in round II, 10 in round III); 6 keeps the text to one number. Without it, Banker plus Busker plus Lamplighter is the "+10 in round 2" Cory rejected.
- Copy: **flagged** (copyDoesIt): the copier fires their own members, up to 6. Brief rule 5 (re-fires members).

**Overnight** "+1 purple now. At round end, +4 purple in round II, +6 in round III."
- The round-end gain arrives after every buy and before the contests. It's the only gain in the game you can't spend in the round you earn it, so it is pure contest power this round and money next round. Your minion on the space is the reminder; nothing is remembered.
- Walk-away, round II: 1 now plus 4 at round end (the 4 counts toward the round II purple contest, then spends in round III), about 5, next to Shake Down. Round III: 1 now plus 6 at game end, which only scores the purple contest (6) and Closing Time does not read it. So in round III it's a late, visible contest swing: rivals see "+6 at round end" and must hold more purple or take the space first. Same at 2 and 4 players.
- Copy: **flagged**: the copier gets their own +1 now and the round-end gain (the copying minion is the reminder).
- Engine: spaces have no round-end hook today (members do, in endRound). A small content change, flagged.
- Judge's worry: "Gather with a delay". The delay is the whole point: it's the hold-or-spend tension on a space.

### Round I (×3)
**Catch Up** (Cory's, Oct 15 17:53, which is live Roll Call's rule) "+1 purple per minion you've placed this round, this one included."
- Round I: 1 / 2 / 3 on your first / second / third minion, his "take it early for less, or hold out and risk a rival taking it". Round II up to 4, round III up to 5. Same at 2 and 4 players (your own clock, so no seat bias, unlike Bandwagon).
- No separate "+1 purple": the first minion counting is the +1. If he wants the inherent +1 on top, it reads 2/3/4.
- Copy: replays the taker's gain. No flag.

**Plan Ahead** (live rule, moved down from round II) "+1 purple per minion you have left to place this round, this one included."
- Round I: 3 / 2 / 1, Catch Up's mirror. Round II 4 to 1, round III 5 to 1. The purple player takes Plan Ahead first and Catch Up last; a rival spoils whichever is ripe. The judge put this pair forward; it's his own Catch Up idea seen from both ends. Risk: #92 put "Catch up, plan ahead, rush hour" side by side as a question, so he may read them as variations (flagged in pick 3).
- Copy: replays the taker's gain. No flag.

**Clock In** (reworked, Cory's round I template) "+1 purple × round. +1 purple."
- 2 / 3 / 4. The reliable one, any minion. Today's "+4/+5/+6" goes.
- Copy: replays the taker's gain.

Round I for a purple specialist: Plan Ahead 3, Clock In 2, Catch Up 3 = 8 purple, about 2.7 a placement against the typical 2.3. A dabbler gets 1 to 3 from any of them. In round III all three still pay 4 to 5 at the right moment.

### How it touches other colors (generically)
- Crunch Time takes every color's best spaces in round III before their owners answer.
- Fast Forward and Alarm Clock make any color's round-start income member worth buying for the purple player, so they compete in other colors' shops, hold those colors, and turn up in those contests.
- Overnight's round-end gain is a contest swing rivals can see coming.
- Closing Time makes rivals want to sit on purple spaces in round III, just to deny.
- Rivals feel Purple as "it got there first" or "it outlasted me at round end", never as a loss of what they own.

## The deck (6 cards, 4 slots open for you)

A purple specialist earns about 20 to 25 purple a game (guess: about 8 in round I, 8 to 10 in round II with Fast Forward and Overnight, the rest in round III), and every purple spent is purple not held for the 2/4/6 contest.

| Card | Cost (colored+any) | Followers | Text | Why that price |
|---|---|---|---|---|
| Shift Crew (live) | 1+1 | 2 | Worth 2 followers. No effect. | Cheap body at f = C, Open Door's pick. Kept. |
| Latecomer (from purple-outsider 2) | 2+1 | 1 | When recruited: +1 follower per minion you've placed this round. | Treasurer's "buy it late" puzzle on Purple's clock: 1 on your first minion of round I (a bad buy), 5 on your last of round III, so about 4.3 for 3 late in round I and 6.3 for 3 late in round III. Pays followers, a different currency from its cost (not a Mime refund). Re-fires on a swap; bounded at 5. |
| Alarm Clock | 3+2 | 2 | When recruited: your members' round-start income comes again now, up to 6. | Fast Forward on a card (Panel is Promote on a card). 2 bodies (2.6) + 3 to 6 = 5.6 to 8.6 for 5: 1.1 to 1.7 with income members, two bodies without. The anchor's 3+2, priced a step under Panel's 6. |
| Closing Time (purple-outsider 2's Night Watch, renamed) | 3+2 | 1 | Game end: +2 followers per purple space you're on (at most 10). | The scorer only Purple could have. Capped because Crunch Time plus Night Owl can sit on 5 to 6 purple spaces (10 to 12). Minions stay on their round III spaces at game end (core.js clears the board only at round start), so it reads what the board shows. A specialist ends on about 3 of the 6 purple spaces: 6 + body for 5 (1.5); 4 or 5 is 8 to 10. Rivals deny it by taking purple spaces, and it pulls against Crunch Time's "go take other anchors". Mostly "any" is wrong here: it's for the purple player, so 3 colored. |
| Lamplighter (live text) | 4+2 | 1 | Now and at round start, +1 purple per minion you get this round (3 / 4 / 5). | Purple's own income, growing by round. Bought in round I: 3 + 4 + 5 = 12 for 6 (the purple player's round I buy); round II: 9 for 6 (about 1.5). Down from live 6+2: 6 colored is out of reach in round I, and Cory's notes on this card only ever said "too dear". Fast Forward fires it again, capped at 6. |
| Night Owl (live text) | 6+4 | 2 | Rounds II–III: after placing your last minion, take 1 extra turn if there's room. Once per round. | Capstone and the deck's one turn source. Bought in round II: two extra placements and buys (about 3.5 + 5) + 2 bodies = about 11 for 10. At 8+2 a purple player can't reach it until round III, where it's worth about 7.6 for 10 (pricing: a trap). 6+4 keeps it about 60% colored. Cory set the followers (#101). |

- Prices 2, 3, 5, 5, 6, 10; 9 followers on 6 cards.
- Shape: a cheap body, the color's action on arrival (Alarm Clock), growing income (Lamplighter), the clock on a card (Latecomer), a scorer that plays off rivals through the board (Closing Time), and the capstone and rule-bender (Night Owl). No defense card: Purple takes nothing, so there's nothing to defend.
- Every card stands alone. Pairs that help: Lamplighter with Alarm Clock or Fast Forward; Latecomer with a late Night Owl turn.
- Deck visibility: as a 6-card color at 4 players, about 0.9 purple shows in a row and about 5 of the 6 show in a game; a specialist owns 2 to 4. Nothing needs a partner.
- **The 4 open slots.** I tried a cheap flat income card ("+2 purple each round", White's Shopkeeper again), a worth-3 body (the herd's "worth 3 for 3"), a hoard scorer (Timekeeper), and a "pass, place later" bender (another turn source). None was better than an empty slot. Purple's members want more bodies (Cory's direction), so a big-body card is the obvious fill if he has one in mind.

## Alternative: Put It Off (purple-outsider 2)
- Purple pays for placing late on your own clock, and Crunch Time is the deadline. Patience "+2 followers per minion you placed before this one" is its round II, beside Long Shot and the round-end gain.
- It's the most readable Purple on the panel (feel's top pick), and three of its best pieces are already in the recommendation above.
- It ranked second: three of six spaces count minions (the #92 "these are the same thing" risk), and Patience pays up to 9 followers in round III with no buy and no member, which feeds buy-followers-only. Trimmed to +1 it's weak.
- Long Shot is White's live Sob Story doubled.
- Less for rivals to care about: they only feel it when their own late minion is up.

## Picks for Cory
1. Purple stays the color of when: Crunch Time kept, round II "Your members' round-start income comes again now, up to 6" and "+1 purple now, +4 at round end" [yes].
2. Only Crunch Time and Night Owl move turns; Late Riser ("at round start, if you have the fewest followers, take an extra turn") and the other turn cards go [yes].
3. Round I is your Catch Up ("+1 purple per minion you've placed this round"), its mirror Plan Ahead ("per minion you have left"), and Clock In 2/3/4 [yes, but tell us if the mirror feels like the same space].
4. New scorer "Game end: +2 followers per purple space you're on (at most 10)" replaces Timekeeper [yes].
5. Latecomer: "When recruited: +1 follower per minion you've placed this round" [yes].
