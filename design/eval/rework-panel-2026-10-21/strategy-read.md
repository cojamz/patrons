# Strategy read for the rework panel (2026-10-21, strategist)

How the game plays and wins now: live code on the branch (shop 7, Green, Red and Magenta reworked, Blue's actions as settled tonight), decisions.md through Oct 20, the ledger. No sims. Facts read from code say (code). Everything else is my read, and any card text I made up is marked (Claude's fill-in). Cory's taste comes only from his quotes, not from Claude's audits (member-feel.md ranked Recluse low; he loves it).

---

## 1. The game now, on one page

**The frame (code).** Minions 3/4/5, so 12 turns and 12 buys a player. Each turn is one placement plus one buy (a member, or one follower pack of 1, 5 or 10, paid in any resources at par). Spaces per color are 3/2/1 by round, and every ring stays open, so a color shows 3, then 5, then 6 spaces. A table has as many colors as players, so **round I always fills exactly** (3N spaces for 3N minions), and rounds II and III each have N spare spaces. Contests pay 2/4/6 by round on held color, half each on a tie. Turn order is a snake: random in round I, then fewest followers first. The shop shows 7, refills at once, and the whole row goes under the pile at the start of rounds II and III.

**Two facts drive every price.**
- *Packs are lumpy.* One buy turns 1, 5 or 10 resources into followers. If you hold 4, your buy turns 1 of them into a follower, or buys a member costing up to 4. Under small incomes, members fill the gaps between packs. A cheap member is not junk: it's the efficient way to spend 2–4 or 6–9.
- *Colored parts gate members.* Since every action now gives +1 of its own color, you can only buy a color's members if you took that color's spaces (or stole it, or converted it). Spending that color on its members lowers your stake in that color's contest. That's the core tension Cory named, and it lives in the colored part.

**A strong turn, by round.**
- *Round I* (3 minions, no spare space, the last placer is forced onto whatever is left). Gains are 2–4 resources. Strong: a space that sets up a member, like Open Door ("Recruit the cheapest shop member") or Help Yourself (steal 1 and gain 1 follower), then a buy of a member that pays twice more (round-start income, or a body worth several followers). Contests are cheap here (2 each, and few hold much). A dead round-I space is a real cost, because someone is forced to take it.
- *Round II* (4 minions, N spare). The bridge spaces change what you own: Promote ("Swap a member with a shop member costing up to 2 more"), Shake Down ("they pay its cost to keep it, or you take it"), Crime Wave (half of one rival's stack), Encore/Reprise, Buy twice. Strong: upgrade or take a member, or buy two. Members bought now pay at round III start and at game end.
- *Round III* (5 minions, 1 anchor per color, so N anchors for N players, and the **trailer picks first**). The anchors are worth roughly 8–12 resources: a free member up to cost 10 (Recruit a Member), any rival's member (Poach), three buys (Spree), every one of your actions again (Greatest Hits). The anchors work as the game's catch-up, because the player who's behind takes the best one, and the snake's end seat gets two picks in a row. After the anchor comes the cash-in. The buy now binds (10 per buy at most), and you sit on a stack only if it's small and wins a contest worth 6. Leftovers under 5 end up in contests on their own.

**The three scarce things.**
- *The space.* Round I is full by rule. Round III anchors are one per color. Squatter ("place a minion on a space a rival already took") breaks the scarcity, which is why Cory called it "maybe TOO strong in round III".
- *The buy.* Early, resources are the limit and you can't fill every buy. In round III the buy is the limit. Blue sells extra buys, and Green can copy them.
- *The pile.* What you hold wins contests and pays colored parts. Magenta can steal it, and the stolen resources keep their colors.

**What the reworks made for everyone else.**
- *Red, members move.* Equal-cost swaps across any cults. Promote/Demote can hit rivals. Recruit a Member is free in round III. So: a member's cost is now its "address" (same-cost cards can be traded), a pricey member can be demoted, and **On Recruit effects fire again for whoever moves or takes the card** (Cory, Oct 18). Big On Recruit cards are Red's fuel and theft magnets. Loyalists ("Your members can't be swapped") is the defense.
- *Green, copies.* Any color's round II/III space can be copied, and the copy pays that space's printed gain plus its color's +1. Spaces with relative or scaling effects, extra buys and extra turns all copy well. So **every round II/III space is designed for two players**: the one who takes it and the Green player who copies it. Agents blocks copying.
- *Magenta, takes.* Piles are targets: a big single-color stack invites Crime Wave, so spreading your colors protects you and stacking one color wins its contest. Members costing 5 or less are ransom targets in round II, and any member is in round III. Magenta isn't on a Classic table, so on Classic the only pile check is Gold's Collect Debts.
- *Blue, the shop (actions settled).* The row churns (send 3 under, flip out one color), the pile can be read and set (peek at the top 4 and reorder), and buys multiply (Buy twice, Spree). What this does to everyone else: "save up for that card" is fragile. Red's Promote reach changes with the row. **A peek late in a round sets the fresh 7 for the next round**, because the round's new row comes off the top of the pile. More cards get seen per game.

## 2. The identity map

**Taken.** Red: getting and moving members. Green: copying actions. Magenta: taking from rivals. Blue: the row, the pile and the number of buys. Gold's old "gold counts as any color in follower buys" is gone in practice: every resource now buys followers 1-for-1 (code, `TIERS`). And "hold the most" is now the contest rule for every color. So **Gold's old identity has turned into the base game**, and only Double Down (doubling) and Collect Debts (taking, which overlaps Magenta) are left.

**Open territories, how each would touch the table, and whether it fits the economy.**

| Territory | How it touches other colors through the board | Fit with the economy |
|---|---|---|
| Turn order and tempo (placing back to back, going first) | Changes who reaches a contested space first, especially the round III anchors | Good. The gain is position, not resources. Out-of-turn placement is ❌, so it has to move your own turns |
| Giving and spillover | Rivals get resources (followers at par for them) and a stake in your color's contest | Good, with a built-in counterweight: giving your color feeds rivals in your own contest. "Everyone else" gifts cost N−1 times as much at 4 players and nearly nothing at 2 |
| Color conversion (reshaping your pile) | Opens any color's members (colored parts) and can swing any color's contest at round end | Strong now: colored parts and held-color contests make the color of a resource matter. It overlaps the Freelancer guest |
| Sets and variety | Counts colors held | Poor. It scales with how many colors are on the table (2 at a 2-player game), which is Cory's #84 "Yellow gets weak during lower person game". Variety as a scoring rule is ❌ (Oct 9) |
| Follower trading | Competes with the follower buy | Poor. Followers are the score, so trading them is the buy in another coat. Cory: "what's a loose follower?" |
| Hoarding and doubling | A doubled stack wins its contest and becomes a theft target | Good if the verb is doubling. Hoarding alone is now the base rule |
| Space control and blocking | Squatter and Straggler already bend spaces | Partial. No out-of-turn placement. Spaces that grow while empty are accepted (Bandwagon, Catch Up 1/2/3) |
| Information | Blue's peek has it | Weak. Leave it to Blue |
| Contests themselves (who wins a rim) | Touches every color's prize | Strong fit with "holding vs spending", but it's hard to show which pile counts where |
| Working your members (firing their round-start or ongoing effects again) | Pays off income members from any deck | Good fit with "members are where followers come from". It sits next to Green's member copies (Doppelganger, Impostor) |
| Catch-up (being behind) | Reads the follower track, and pairs with fewest-first turn order | Cory likes it (Recluse "I love this one a lot", Underdog "interactive"). The risk is sandbagging, since members' followers count toward "behind" |

## 3. The five colors

The goal: five distinct verbs, none of them Red's, Green's, Magenta's or Blue's. My proposed spread is **Gold multiplies, Yellow reshapes, Silver shares, Purple times, White works your members** (or White judges the contests). Each anchor below is a direction, with arithmetic against the round III band of about 8–12.

### Gold (on every Classic table; half of the 2-player game)
- **Now:** a hoarder with big flat gains and doubling.
- **Broken:** Kickback "+3 gold, and +1 gold to a rival" and Golden Years "+2 / +4 / +6" are flat gains far above +1 per action. Intro Offer "next member costs 4 less" is a cost reduction (dropped Oct 18; Cory #72: "Intro Offer either in trash or not in Gold"). Tithe "+1 gold per member" pays out big. Collect Debts is Magenta's job. Double Down "Double your gold" is dead for anyone not leading gold. In the deck: Banker "+3 gold now and at round start" (Cory: "too dear" at 8), Speculator repeats Double Down, Merchant and Tax Collector pay on rivals' turns, Tycoon is a game-end per-N, and Penny Pincher is a price cut in all but name (Cory: "good, could get a little crazy").
- **Cory:** his own original core was "Gold is the money for buying members" and effects that are "open or relative (double, half, match, per X)". He has opened the identity: "not married to the core identity".
- **Anchors:**
  1. *Grow a stack* [my lean]. Round III doubles one of your stacks of any color, +1 gold. With a stack of 5–10 that's +5–10, in band, and it works for anyone, which fixes the flat spot. It interacts with every contest (double the color you're tied in) and with theft (a doubled stack is a target). The color's spine is interest: round I pays per gold held, round II grows your biggest stack by half. Hold-to-grow is the opposite of Red's buy-members, so a 2-player Classic game becomes banker against recruiter.
  2. *Wild money.* Gold pays any member's colored part, which is Cory's original "money for buying members". Round III would be a shopping burst paid in gold, which overlaps Blue. It also makes the Freelancer guest redundant.
  3. *Double Down kept as is*, with only the economy fixed (+1 gold actions, cheaper deck). Under +1 per action, gold held in round III is about 5–8, so it lands in band. The flat spot stays.

### Purple (Cory: "Purple kernel is there, but needs rework", #80)
- **Now:** gains by counting minions, plus Crunch Time "Take your next 2 turns right away".
- **Broken:** Clock In "+4 / +5 / +6" is a big flat gain. Catch Up, Roll Call, Plan Ahead and Rush Hour are four counters of minions with no other function (slight variations). The contest is "most purple members". Round I has no spare space, so extra-turn members are dead there. Overseer is cut and "Bookkeeper is bad" (Cory).
- **Cory:** "Catch up should be better" (#78). "It's not extra turns, it's taking two immediate turns with existing minions". Crunch Time "led to non-intuitive turns in snake draft" (#99). "Overtime fucking SUCKS", and no board action should charge you.
- **Anchors:**
  1. *Crunch Time kept.* Three placements in a row in round III can grab two other colors' anchors before anyone answers: the biggest positional burst on the board. Fix the snake read with the UI, not the rule.
  2. *Recall* (Claude's fill-in): "Move up to 2 of your placed minions to open spaces and do those actions". That's two more actions (about 6–8), using the N spare spaces of round III. It has Straggler's shape, which Cory "really likes", so the guest would need to change.
  3. *Time as greed:* purple spaces grow the later in the round you take them (Catch Up as the model), and round III pays per minion already on the board. Purple becomes "wait for it". Blocking matters because waiting risks losing the space.
- **Note:** at 2 players the snake already gives back-to-back turns after the first (A B B A A B…), so turn-order effects matter little there.

### Silver ("Silver puts the game on steroids, needs some counterweight", #52; "Silver is pretty close", #36)
- **Now:** big gains for you plus small "everyone else" gifts.
- **Broken:** Toast "+3 / +6 / +9" is the steroids. Good Deed and Sweet Talk give +4 flat. Most gifts are token. Hold Court "1 follower per 2 silver you hold (keep the silver)" turns into followers without a buy.
- **Cory:** Rising Tide "I like this one a lot". "Silver round 2 actions need work" (#47). "Hold court a little out of whack" (#66). Sweet Talk, Hold Court and Goody Bags "need better pitches". Retinue "needs to be more members. More followers."
- **Anchors:**
  1. *The host profits from silver everywhere* [my lean]. Round III pays you per silver held across the table (yours and rivals'). All game you hand silver out. Rivals who hold it to beat you for the silver contest feed your finale, and rivals who spend it starve it. The counterweight is built in, the play is aimed, and Patron Saint's "silver members in play, anyone's" already has this shape.
  2. *Inflate, then harvest.* Rising Tide's shape as the finale: everyone else gains, then you take half of the richest. It's close to theft, so it needs care next to Magenta.
  3. *Spillover followers.* Everyone gains, you gain more per rival. The relative edge is zero at 2 players, so it only works at big tables. Don't.

### Yellow (Cory: "basically doesn't want members — maybe something there?", #96; "weak during lower person game", #84)
- **Now:** spaces top up colors, and the contest is "full sets".
- **Broken:** Harvest "+1 per other color you hold", Branch Out and Bumper Crop "per full set" all count table colors, so they shrink at 2–3 players. Top Up is "too bad in Round 3, and even Round 2" (#97). The full-set contest is opaque. The deck is mostly "+1 of each color" variants (Peddler, Pilgrim, Weaver, Late Bloomers, Feastmaker).
- **Cory:** Top Up scales by round. Feastmaker becomes Chefs and counts as at least 2 members. Rainmaker "likes it, should cost more".
- **Anchors:**
  1. *Your members bring their colors* [my lean]. Potluck's shape ("Each of your members brings you 1 of its color") as the burst, ×2 in round III: about 6 members gives +12. It doesn't depend on table size (it counts members, not colors), it answers "Yellow doesn't want members", and it rewards a mixed cult, a different cult from Red's single-color Mob.
  2. *Pour.* Move any resources into one color, then a bonus. It snipes contests and pays a big colored part. Round III makes it a late contest swing, the one thing a held-color game lacks.
  3. *Match the biggest.* Rainmaker as an action: raise each color to your largest. It's huge, and it varies a lot with table size. It's riskier.

### White (Cory: "White needs a pass"; contest moved to members, Oct 17)
- **Now:** follower trading.
- **Broken:** Cheap Seats and Your Call hand followers straight from spaces. Sell High and Dividend need "followers you bought or won" (Cory: "what's a loose follower?"). All In "Trade all your resources for followers" is the follower buy without the buy, and under small incomes it saves little. Reinvestor is a cost reduction. Barter was rejected ("no, I don't like that") and Lender is "a little too complicated".
- **Anchors:**
  1. *Your members work twice* [my lean]. Round III: every round-start effect of your members fires again, +1 white. Round I: fire one member's round-start effect. Round II: borrow a rival member's round-start effect. It pays off the "steady income" members Cory likes (Banker, Busker, Host) in any deck, grows on its own (so round I stays worth taking late), and makes "members are where followers come from" literal. Watch the overlap with Green's Doppelganger and Impostor.
  2. *The trailer* (Cory's liked shape: Recluse, Underdog). White pays you for having fewer followers than rivals. Round III closes part of the gap to the leader (relative, never win-more). It pairs with fewest-first turn order. The risk is that buying members raises your count and works against it.
  3. *The judge.* White counts toward contests, or decides ties. It fits the core tension directly, but it's hard to show which pile counts where. Flag it as complex.

**Contests:** move Purple, White and Yellow to held own-color (Cory, Oct 15: "Scoring defaults to most of your resource held").

## 4. What each member deck should do

- **Blue members** (around churn, peek, Buy twice, Spree). Make many buys pay: cheap bodies worth several followers so that Spree lands, and the rule-bender Cory liked tonight, "you can always buy twice" (expensive, near the ceiling). Reward setting the pile. One illustration (Claude's fill-in): "You may recruit the top card of the pile", with that card face up for everyone. It solves "awkward because they are in different phases" with a standing permission. Cut every price cut (Planner, Underbidder, Sommelier), Social Climber (Release), and "when you recruit a blue member" (luck of the row: Stylist, Connoisseur, Patroness). Keep Recluse. Contest: held blue (my recommendation, flagged). It gives a shopping color the shopper's dilemma, and it matches the other reworks.
- **Magenta members** (Cory's own light rework). Keep the shapes he has accepted: Cutpurse (steady income by theft), Bodyguard, Double Agent (an early member loss he allowed), Robin Hood (takes from the leader), Crew (cheap, worth 2). Replace Extortionist (pays on rivals' turns, 8+2) and Kingpin (game-end per 2). Under a held-magenta contest, the deck needs a reason to keep loot rather than spend it. A "steal into magenta" option is ❌ as redundant.
- **Guests (colorless).** One rule-bender per base rule: space (Squatter), payment (Freelancer), minions (Extra Hand), turn order (Front-runner, "too cheap" #11), last placement (Straggler). Missing base rules: the buy ("always buy twice" could live here rather than in Blue) and the pile, via Cory's Launderer ("rearrange your money as you please", which belongs to the payment rule). Once guests are colorless, their cost is all "any", so they get easier to buy. Price them up a little.

## 5. Seats at 2 and 3 players (Classic in code: 2 players Gold+Red, 3 players +Blue, 4 players +Green)

- **2 players:** only gold and red resources exist. Old Gold (Golden Years +6, Kickback +3, Tithe) outearns Red's +1s, so the player who leans gold is strong and Double Down is uncontested. Round III has 2 anchors: the trailer takes the better one, and Squatter can take both. The deck is 27 cards (10 gold, 12 red, 5 guests), so the pile cycles and everyone sees everything, and guests are 19% of it.
- **3 players:** Gold's flat gains are still the main money. Blue's churn and peek work on a 37-card pile. There's no copying, and the only theft is Collect Debts.
- **4 players:** 49 cards. Three fresh rows (21) plus about 20–30 recruits plus Blue's churn means nearly the whole deck shows. But a player owns only about 2–4 of any one color, and a card rarely survives the 3 rivals buying before your turn comes back. So **design each member to work on its own**, with light synergy in pairs and never a set of three.
- **What follows:** Gold's rework has the biggest reach of the five (every Classic table). No effect should scale with the number of colors on the table, and "everyone else" gifts need scrutiny, since both shrink at 2 players. Round III anchors must be wanted by more than the specialist, or the small table hands one player two picks.
