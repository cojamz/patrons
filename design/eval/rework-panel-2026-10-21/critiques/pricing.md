# Pricing critique (rework panel, phase 3)

Seat: costs and follower counts of every member, and the walk-away gain of every action against the round bands (round I about 2–4 including the +1, round II measured against Promote ~3.5 and Shake Down ~5, round III about 8–12). Ruler: pricing.md. Calibration: the approved Red and Green decks in live-cards.txt. No sims, no games; every number below is a guess from the rules and is labelled so where it matters. Live contest rule checked in core.js: a tie halves the prize (`prize / 2`), so every "you win ties" card is worth half a prize per tie, not more.

## 0. Four findings that cut across every file

**0.1 Uncapped "match / tie / double / raise to" gains blow the band, because Gold sits on every table.** Under +1-per-action most piles are small, but Gold's own concepts keep big gold piles (10–25 in round III, gold-anchor A). Any relative gain that reads "the rival with the most" or "your largest" without a cap inherits that pile. Offenders, with the walk-away against a 10–12 gold hoard (guess):
- Round II: Gold Standard (gold-anchor B, "raise one of your colors to match your gold") 8–10; Keep Up (silver-outsider B) and Keep Pace (white-outsider B) "raise it to tie the rival who holds the most" 10–12; Branch Out (yellow-anchor B, "half your largest in other colors") 6–7. That is Cory's "+10 blue in round 2" exactly.
- Round III: Dead Heat (two colors) 18–24; Even Out (yellow-anchor B) 12–20; Photo Finish (white-outsider B card, every color) 12–20 for 10.
- Fix rule for the foreman: every relative gain prints a cap, about 5 in round II and 10 in round III. Silver-outsider's Upstage ("up to 4") and white-anchor's Take the lead ("at most 5") already do this; they are the model.

**0.2 Compounding loops.** Three are real and none is priced:
- Clockmaker + re-fires (purple-anchor A). Clockmaker is "+1 purple per 2 purple you have", so each fire multiplies the pile by 1.5. Round start, Fast Forward, Wake Up, Alarm Clock and a Green copy of Fast Forward can fire it 3–4 times in one round: 8 → 12 → 18 → 27. Geometric. Blocking.
- Midas + Double Down + Speculator (gold-anchor A). Midas sends every action's gain into gold, then two separate doublings stack: 12 gold → 24 → 48. Even one doubling on a Midas pile is ~+16–20 in round III, over band.
- Nest Egg + Windfall (white-outsider A). Nest Egg makes white count double on a follower buy; Windfall doubles the buy. 5 white → a 10-pack → +10 more: 20 followers for 5.

**0.3 Member-count cards count bodies.** The engine counts a member worth N as N members. Several cards were priced as if they counted cards:
- Hostess and Patron Saint (silver-anchor A, "per silver member in play, anyone's") with Retinue worth 4, Gossips 2, Regifter 2, Chaperone 2, Debutante 2: the deck holds 17 silver bodies on 10 cards. At 4 players about 7 bodies end up in play, not "4–6". Hostess bought in round I pays about 1 + 5 + 7 = 13 for 5; Patron Saint 7 at 4 players, 10–12 at 2.
- Heir (silver-outsider B, "+1 silver per member you have, now and at the start of round III") with Retinue: about 6 + 8 = 14 for 5.
- Melting Pot (yellow-outsider A, "per non-yellow member", 2+3): a Red splasher with Mob (5), Panel (3), Twins (2), Loyalists (2) scores 12+ for 5.
- Bumper Crop (yellow-anchor A, "each member brings 2") at a body-heavy table: 20+.
- Fix: price for bodies (deck-visibility's 3–5 owned, times about 1.5 bodies each), or move the colored part up so splashers can't take it.

**0.4 The contest pool must stay fixed.** At 4 players contests hand out about 48 followers a game (pricing.md). Mechanics that pay a contest twice or double it raise the value of every held unit, which makes every colored part dearer and pushes play back toward holding and buying followers at the end, against "members are where followers come from":
- The Count (purple-outsider 1) "pays out now; it still pays at round end": up to +18 followers to the table per use at 4 players, plus Early Count ×2, Snap Poll and Election Night. Pool goes from about 48 to 80+ (guess).
- Spotlight / Headliner / Barker (yellow-outsider B) double a prize: +4 / +6 / +12 per use.
- Chameleon (yellow-outsider A) and Arbiter (white-anchor A) let one pile count in two contests: a second prize every round from the same units.
- The take-it-now versions (silver-outsider A, white-anchor A: "it won't score at round end") keep the pool fixed. **If contest timing goes to Cory at all, only that version, and in one color.**

## 1. Own-color arithmetic (what a specialist earns of its color per game, 4 players, guess)

The brief's worry: Magenta and Blue earn only ~6–9 of their own color a game. Checked per concept, against the colored parts a specialist would pay for 4–5 members.

| Concept | Own color a game | Colored parts in deck (sum) | Read |
|---|---|---|---|
| gold-anchor A | 25–35 (Tithe, Half Again, Double Down) | 29 | Rich. Room for heavier gold parts; the risk is the reverse (0.1, 0.2) |
| gold-outsider A | ~20 (three 2/3/4 spaces, Dividend, Jackpot) | 31 | Fine |
| purple-anchor A | 15–18 | 34 | Night Owl 8 + Double Shift 6 = 14 purple for two cards: one or the other |
| purple-outsider 1 | ~13 (only round I pays purple; calls pay followers) | 37 | Broken. Night Owl (8 purple) + Election Night (7) = 15 > a game's purple; Lamplighter's 6 can't be paid in round I, so it's a round II card at ~1.0 |
| silver-anchor A | ~25 | 28 | Fine |
| silver-outsider A | 8–10 (only Good Deed scales silver) | 24 | Magenta/Blue-poor. Master of Ceremonies' 6 silver is 60%+ of a game's silver; Debutante "double your silver" doubles 3–5 |
| yellow-anchor A | 12–16 (Harvest, Trade Seeds, yellow members on Potluck) | 31 | Tight but Trade Seeds converts. OK |
| yellow-outsider A | 12–15 (+ Trade Seeds 3/6/9 swaps) | 25 | Fine |
| white-anchor A | 12–15 | 28 | Fine |
| white-outsider A | 12–15, less after Nest Egg spends it | 26 | Fine |
| blue A / B | 7–8 (designer's count is right) | 17 / 19 | Honest: colored 1–3. Shopaholic 3 + Snob 3 already eat 80% of a game's blue |

## 2. Per concept

### gold-anchor A ("money for buying members") — 3/5
Bands: round I fine (Golden Years 2/3/4, Kickback 3, Half Again 1–3). Round II Splurge ~+5–6 sits at Shake Down; Tithe 4–6 fine. Round III Double Down 7–12 for an honest pile, 16–24 with Midas (0.2).
Fixes:
1. Make "Double your gold (at most +10)" the default, not the fallback. Gold is half the 2-player board.
2. Cut Midas or Speculator. Two doublings plus a "everything becomes gold" card in one deck is the runaway; Speculator alone with a cap is enough capstone.
3. Prospector 2+2 is +1 gold per gold placement: 6–8 for 4, and every placement with Midas. Price 3+2.
Cards: Tellers 2+1 "Worth 3 followers" is White's live Shareholder (2+1, worth 3), card for card. Miser "Ties for the most gold go to you" is one of seven tie cards tonight (section 3). Socialite: say whether a Splurge payment of 5 that counts as 10 triggers "pay 5 or more".

### gold-anchor B ("multiplies whatever you hold") — 2/5
Gold Standard in round II is 8–10 (0.1). Goldsmith 3+2 does Gold Standard on arrival: up to +10 for 5 in round III, ratio over 2. Nest Egg (round I) "+1 gold per 3 resources" is 7–8 in round III, a round III payout on a round I space. Everything here pays holding, which feeds buy-followers-only; the designer says so. Cut.

### gold-outsider A (Jackpot) — 4/5
Best-controlled bands of the night: the pot counts Gold placements, not players or colors, so it's about 3 / 7 / 8–11 at every table, and Gold is on every table. Round I 2 each, Dividend 4–7, Jackpot 8–11.
Fixes:
1. Underdog doubles the Jackpot, and the combo isn't rare: the trailer holds less gold (Underdog on), picks first in round III, and takes the pot. 16–22. Drop Underdog from this deck or keep Underdog's live price and accept it only if the pot is "take" not "gain" (cleaner: drop it).
2. Dividend in round III before the Jackpot goes is 9–11 from a ring II space, a second anchor. "Half the Jackpot" fixes it, as the designer says.
3. Heirs 1+0 worth 2 is the best body in the game (beats Twins 2 for 2 and Crew 1+1 for 2), and Red's Open Door takes it every time. Price 2.
Cards: Launderer 3+5 (8) does what yellow-outsider's Dyer does for 3. One price for one effect (section 3). Stake / Skim / Kickback are all "+1 gold × round" plus a side gold: a template risk, not a pricing one.

### gold-outsider B (Compound) — 2/5
Interest "+1 gold per 2 resources you hold" is 4–6 in round II and 8–11 in round III, a ring II space at anchor size, and it pays the hoarder twice. Prospector up to 5 is right. Thin bodies (12). Keep only "Double one of your stacks" as the fallback the designer named.

### purple-anchor A (Skip ahead) — 3/5
Crunch Time: ~13 when taken first at 4 players (over band, but relative and live), 6–7 at 2 (under). Head Start ~4–5 in round II, fine. Fast Forward 3–5 typical, 10+ for a player who bought other colors' income members (Banker +3, Busker +2, Clockmaker), which is Cory's "+10 in round 2".
Fixes:
1. Cut Clockmaker from this deck (0.2). Blocking.
2. Keep one re-fire source on the board (Fast Forward) and one on a card. Wake Up + Fast Forward + Alarm Clock is three, and every re-fire makes every "income X costs 2X" card in every deck about 1.5–2× underpriced for the purple player: Busker bought in round I fires 6–7 times, 12–14 for 4.
3. Sprinter 3+1 ("two turns in a row, +1 follower") depends on your seat: the snake's end seats double up 4–5 times a game, middle seats 0–1. A trap or a steal by seat. 2+2 and accept it, or cut.
Cards: Night Owl 8+2 bought in round III (when a purple player can first afford 8 purple) gives one extra turn plus 2 followers, ~7.6 for 10: a trap. Its colored part is the problem, not its text; 5+5.

### purple-anchor B (Own the order) — 3/5
Hold Up's own gain (3) is under Shake Down, but the denied pick counts twice; fair. Plan Ahead in round I 1–3 fine. No compounding. Pricing-wise cleaner than A; Night Watch 1+2 worth 2 is the Agents price and fine. Same Night Owl note.

### purple-outsider 1 (The Count) — 2/5
Inflates the contest pool (0.4). The Count at 4 players: 7–13 to a purple player leading 1–2, up to 19 leading 3, and rivals get paid too. At 2 players, 7 at best. Early Count is 5 in round II and 7 in round III from ring II. Own-color math is broken (section 1).
Cards: Graveyard Shift 2+1 worth 3 is Shareholder again. Tiebreaker 2+3 is the third tie card. Election Night (7+3) and Snap Poll (4+3) are the same call on two more cards: three copies of the verb, two of them over 9 cost. Lamplighter 6+2 can't be paid in round I.
If kept at all: "pays out now and not at round end" (the fixed-pool version), which is then white-anchor A's verb.

### purple-outsider 2 (Put It Off) — 2.5/5
Patience "+2 followers per minion you placed before this one" is 7 in round II and 9 in round III on your last minion, followers with no buy and no member: straight buy-followers-only fuel. Make it +1 (0–3 / 0–4, +1). Long Shot "+2 purple per rival with more followers" is 7 for a 4-player trailer in round II and is White's live Sob Story ("+1 white per rival with more followers") doubled. Go-Getter 6+2 is the pricing.md trap (~5 for 8).
Good: Latecomer 3+2 (1–5 followers by when you buy it, Treasurer's puzzle) and Rush Job 5+3 worth 3 (Crunch Time on arrival, ~10 for 8) are fairly priced and worth lifting into the anchor's deck.

### silver-anchor A (The Tide) — 3.5/5
High Tide 7–11 in band; Rising Tide 3–5; Regift capped at 6 is the right cap (net +4–6, Shake Down's level). Round I all 2/3/4.
Fixes:
1. Hostess and Patron Saint count bodies (0.3). Either print "silver member cards" (and the engine counts cards), or Hostess 4+3 and Patron Saint priced for 7 bodies.
2. Retinue 2+1 worth 4: four bodies for 3 is the best body on the board and the best Shake Down target (ransom 3 for 4 followers). Its gift (3 silver at 4 players) pays back ~1 relative, so it nets about +1.5 over par. Pricing.md's ceiling is f = C+1, so it's legal, but with the body-counting cards in this deck it's a combo piece at 3. 2+2 worth 4.
3. Caterer 3+2 "+1 follower whenever you give a rival something (once per space)": every Silver space gives, so it's +1 follower per silver placement, 6–8 a game for 5 (ratio ~1.6). Proselytizer is 6 for the same rate. 4+2.
Cards: Warm Welcome ("Gain 1 follower × round; a rival you choose gains 1 follower") is White's live Your Call ("+1 / +2 / +3 follower") with a gift, and it's a buy-followers space. Guest 1+4 at a Silver table fires 6–10 times on rivals' turns: fine price, wrong shape (rival-turn drip). Table injection is still large: one High Tide hands 9 silver to the table at 4 players; the "counterweight is the contest" argument holds only if rivals hold rather than spend it.

### silver-anchor B (The Pot) — 2/5
Same shape as gold-outsider A, less controlled: Last Call 8–11 early, 15 late; Toast and Bake Sale pour 2/4/6 each into the pot from the bank. Free Lunch 3+5 is a universal payment bender. Gold's pot is the one to keep (Gold is on every table, the pot doesn't scale with players). Cut.

### silver-outsider A (calls the contests early) — 3.5/5
Fixed prize pool (good: adds no followers). Crown 5 in round II, Upstage 3–5 capped, round I 2/3/4. Last Call: 11 leading one, 18–20 leading two (the freed stacks are the overage), self-flagged.
Fixes: if this mechanic goes to Cory it should be White's (white-anchor A, fuller deck, and Silver keeps Rising Tide, which he loves). If it stays Silver: Retinue 1+2 worth 4 is splashable by anyone in round I (auto-buy; 2+2); Master of Ceremonies' 6 silver is unaffordable for a color earning 8–10 (4+4); Debutante's doubling is Gold's verb and weak on a 3–5 pile; Herald 3+2 worth 2 at ~0.9 is under; 2+2.
Cards: Referee is the fourth tie card. Ringleader ("+1 silver per contest you lead") is white-anchor's Bailiff word for word.

### silver-outsider B (lift, then match) — 2/5
Keep Up uncapped (0.1). Heir with Retinue 14 for 5 (0.3). Grand Host 7+3 doubles High Tide to 14–22. Revelers 1+1 "counts as 3 members" is a pure body-count enabler for the two counting cards. Cut.

### yellow-anchor A (your cult is your harvest) — 3.5/5
Fixes the 2-player weakness at the root (counts members, not table colors). Round I 2/3/4, Potluck/Feast 4–5, Bumper Crop 11–13 typical.
Fixes:
1. Bumper Crop at a body-heavy table is 20+ (0.3). "+1 per member, +1 more per member of another color" or a cap at 12.
2. Rainmaker 5+3 "raise each of your colors to match your yellow" is +12–18 at 4 players for 8: the auto-buy of the deck. Cory said "should cost more"; 6+4, or B's one-color text.
3. Granary 4+3 "per resource in your second-largest color" pays only what you couldn't convert with buys: ~4–6 for 7, a trap. 2+3 or cut.
Cards: Field Hands 3+0 worth 3 is the fourth "worth 3 for 3" body tonight. Fieldworker 3+2 "+1 follower when you take a Yellow space" is the same card as Toastmaster and Caterer. Diplomat is a tie card. Sprouts 1+1 worth 2 + 1 resource on arrival is a fine Open Door pick.

### yellow-anchor B (Even Out) — 2.5/5
Even Out and Branch Out uncapped (0.1). Explorer 2+2 "+1 yellow whenever you take a space outside Yellow" fires 6–10 times for anyone not yellow: 1.5–2.5 ratio, the auto-buy of the deck; live is 8 for a reason. 3+3. Late Bloomers and Scarecrow are fairly priced.

### yellow-outsider A (Dye) — 4/5
Every gain reads your own pile, so it's the same at 2 and 4 players. Pour is bounded by half your pile (6–7 + a contest), Fade 4, Potluck 5 / 7–8, round I 2/3/4. Cleanest bands of the five action colors.
Fixes:
1. Dyer 2+1 worth 2, "turn any of your resources into one color" on arrival, is a round III contest snipe (up to 6) for 3. Gold-outsider prices the same effect (Launderer) at 8. One effect, one price: about 3+3.
2. Melting Pot counts bodies (0.3): a Red splasher takes it at 2+3 for 10+. 4+2, or "member cards".
3. Chameleon 5+3 worth 3 counts one pile in two contests every round (0.4): ~13 for 8 bought in round II, and at a 2-color table it is both contests. Cut, or "once per game".
Cards: Tiebreaker is the fifth tie card. Colorfast is narrow but cheap and fine.

### yellow-outsider B (Spotlight) — 2/5
Spotlight's walk-away is 1 (pays at round end, Dig's trap); doubled prizes inflate the pool (0.4). Stagehands 0+3 worth 2 is a filler. Cut; nothing here is needed by A.

### white-anchor A (take the prize early) — 4/5
Fixed prize pool. Round I 2/3/4 (Sit tight 4–6 in round III), Cash a lead 5, Take the lead 5–6 capped at 5. Round III 8–13 at 4 players leading 1–2.
Fixes:
1. Round III leading two contests with fat stacks is 16–20 (two 6-prizes plus two freed stacks). "Take now the prize of up to two contests you lead" doesn't help at 4 players; the honest trim is to price the freed stack: the anchor pays "every contest you lead" but each cashed contest's color can't be spent this turn. Simpler: accept it at 4 players, where leads spread thin (1.3 a player), and flag it at 2.
2. Arbiter 5+3 ("add your white to one other contest") is Chameleon's double count (0.4). Cut; Clerks takes the slot, as the designer offered.
3. Herald 3+2 (+2 of the color per early prize) at 2–4 uses is 4–8 for 5, fine; but the name collides with silver-outsider's Herald.
Cards: Bailiff = Ringleader (silver-outsider). Even odds is a tie card in space form. Crown 6+4 worth 2 at 10 is a fair capstone and a fine free Recruit a Member pick.

### white-anchor B (followers on members) — 2.5/5
Prices the members fine (Saint ~11 for 10, Bishop ~1.4 in round III), but it breaks the theft prices: Shake Down reads printed cost, so a 2-cost card carrying 6 followers ransoms for 2, and Poach in round III takes 10+. Every follower placed is a theft target with no price on it. Cut unless Shake Down reads cost plus followers on it.

### white-outsider A (White catches up) — 2.5/5
The most buy-followers-only concept on the panel: Last Laugh, Nest Egg, Windfall and Grinder all multiply follower packs, and a sandbagger (hold resources, stay "behind", which also wins contests) is its specialist. Last Laugh alone is well bounded (the 10-pack caps it at +10, 11 total), and that's its best feature.
Fixes:
1. Cut Nest Egg (the designer's weakest; it's a follower-price cut and Penny Pincher for packs) or cut Windfall: together, 5 white → 20 followers (0.2).
2. Lean Years "+1 follower per member you have fewer than the rival with the most" is 2–6 in round II and 10+ in round III at a body-heavy table, from ring II. "Up to 2 × round."
3. Recluse: blue-members keeps it too. One home; pricing has no preference, but its 2+2 is Cory's and stays.
Cards: Hermit 2+1 worth 3 "counts as no members" is Shareholder with a twist, fine. Tall Poppy 2+2 (leader −2, you +2) ~1.0, fine. Grinder 4+2 at 5–7 for 6 is fine. Tiebreaker is the sixth tie card. Shopkeeper 2+2 +2 a round is the strong end (pricing.md lists it as an auto-buy): 2+3.

### white-outsider B (ties the leader) — 2/5
Keep Pace, Dead Heat, Photo Finish all uncapped (0.1). Tiebreaker at 4+3 with tie-making spaces turns two round III contests into wins. Odd Lots is a guest at best. Cut.

### blue-members A ("every extra buy pays") — 4/5
Honest own-color math (7–8 blue, colored parts 1–3, 17 total), every card stands alone, nothing pays on which colors show up. Plus-One 1+1 worth 2 at par; Shopaholic 3+6 at 9 matches his "too cheap" direction on universals; Allowance 1/2/3 a round for 5 at ~1.2.
Fixes:
1. Bulk Buyer: rename (White's live Bulk Buyer is "whenever you buy 3 or more followers, +1 more"). Price note: each extra buy with 1 resource becomes 2 followers, a follower discount. With Shopaholic it's +1 follower every turn (~+8), and both together feed buy-followers-only through 1-packs. 2+3, or "per member bought after your first".
2. Insider ("the top card of the pile... only you may buy it") is Claim as a standing rule; Claim was ❌. Pricing is fine at 3; the shape is the risk.
3. Doorbuster buys outside your turn; priced fine (~1.3 bought in round I), and the guest designer cut its cousin.
Cards: Entourage 1+2 worth 3 is the sixth "worth 3 for 3" body across tonight's pitches. Snob 3+3 at 6: the deck carries 14 bodies on 10 cards, so a committed owner reaches 6–7: par, right.

### blue-members B ("you set the row") — 3/5
Tastemaker 2+3 at 5 is hard to price and probably right; Curator 3+3 (6–9 blue bought in round I) fine; Talent Scout 3 fine. But 11 followers on 10 cards is the thinnest deck of the night (Cory pushes bodies up), and Snob + Curator both pay on blue cards showing up. Gatekeeper and Window Dresser are Blue's two round I spaces at 2 and 3: a variation pair.

## 3. Near-copies across pitches (one home each, or they read as a template at a 4-player table)

- **"Worth 3 followers" at 3**: Shareholder (live White 2+1), Tellers (gold-anchor), Graveyard Shift (purple-outsider), Field Hands (yellow-anchor 3+0), Hermit (white-outsider), Entourage (blue A). Six. Each color's cheap body should differ in size (Red: Volunteer 0 worth 1, Twins 2 worth 2; Magenta Crew 1+1 worth 2).
- **"You win ties"**: Miser (gold ×2), Notary, Tiebreaker (purple-outsider, yellow-outsider, white-outsider ×2), Diplomat, Referee, Even odds. The guest Tiebreaker already went to Cory; delete the rest.
- **"+1 follower when you take a [color] space"**: Toastmaster (silver-outsider), Caterer (silver-anchor), Fieldworker (yellow-anchor).
- **"+1 per contest you lead"**: Ringleader (silver-outsider), Bailiff (white-anchor), Head Count (purple-outsider space).
- **"Your pile counts in another contest"**: Chameleon (yellow-outsider), Arbiter (white-anchor).
- **Recolor on arrival**: Launderer 8 (gold-outsider) vs Dyer 3 (yellow-outsider). Same job, 5 apart.
- **Contest timing**: silver-outsider A, white-anchor A, purple-outsider 1, plus Herald, Magistrate, Snap Poll, Master of Ceremonies, Crown, Election Night on cards. Keep white-anchor A's fixed-pool version only.
- **Pot**: gold-outsider A and silver-anchor B. Keep Gold's.
- **Recluse**: blue-members and white-outsider both claim it.

## 4. Theft targets (cost ≤5 and worth clearly more than its ransom)

Shake Down is meant to bite; these bite too hard or are free money: Retinue worth 4 at 3 (both Silver seats); Heirs worth 2 at 1 (gold-outsider); Hostess at 5 with body-counted silver (+5–7 a round); Heir at 5 (silver-outsider B, ~8 a payout); Clockmaker at 4–5 in purple-anchor A (compounding); Explorer at 4 (yellow-anchor B). One-shots (Dyer, Sprouts, Plus-One) are fine: their value is spent on arrival.

## 5. Top concept per scope (pricing seat)

- Gold: **gold-outsider A, 4** (bands hold at every table size; drop Underdog, Dividend to half, Heirs to 2).
- Purple: **purple-anchor A, 3**, only with Clockmaker cut and one re-fire space; otherwise purple-anchor B, 3.
- Silver: **silver-anchor A, 3.5** (fix body counting on Hostess/Patron Saint, Retinue to 4 cost, Caterer to 6).
- Yellow: **yellow-outsider A, 4** (Dyer to 6, Melting Pot heavier, Chameleon cut).
- White: **white-anchor A, 4** (cut Arbiter; it also owns contest timing for the whole panel).
- Blue members: **deck A, 4** (rename and reprice Bulk Buyer).
- Magenta members, guests: already with Cory; not scored here.

## 6. The one thing the foreman must not let through

**An uncapped relative gain in round II or III** ("match", "tie", "raise to", "double", "half your largest", or an income card that re-fires). Gold's piles are on every table, so each one becomes "+10 in round 2" or "+20 in round III" the first time a gold hoarder or a body-heavy cult sits next to it. Every such text prints a cap (about 5 in round II, 10 in round III), and nothing that re-fires income goes in a deck with Clockmaker. Second, close behind: calls and doubles must never add to the contest pool; the prize is taken early or not at all.
