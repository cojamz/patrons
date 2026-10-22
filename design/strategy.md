# How Cults is won — a strategy read

Durable. Written 2026-10-20 (Claude) against live v0.8.9 and decisions.md up to the Oct 20 economy entry. Update it when a color's rework changes what wins; a new thread should read this before pitching any design. Facts marked (code) were read from `src/engine/v4/`; everything else is reasoning, marked as Claude's read. Nothing here is a design call; those live in decisions.md.

## The fixed frame (code)

- Score is followers: 1 to start, each member's printed followers, follower buys, contest prizes, member abilities.
- Follower buys are 1-for-1 in any resources, in packs of 1, 5 or 10, unlimited (`TIERS`). They are three fixed follower cards in the shop; no space changes their sizes (Cory, Oct 22). So **a resource is a follower at par**, any time, as long as you have a buy to spend.
- **One buy per turn**: a member or one follower pack. Minions 3/4/5, so about 12 buys a game per player, plus extra turns and Spree. A pack tops out at 10.
- Contests pay 2/4/6 to the leader, halved on a tie, zero holdings never win (`RING_VALUE`). That's 12 followers per color per game, about 48 on a four-color table.
- Resources carry over between rounds and are worth nothing at game end unless a member says so.
- Spaces: 3/2/1 per color, rings stay open. At 4 players round I fills exactly (12 spaces, 12 minions); rounds II and III have 4 spare spaces each (20 for 16, 24 for 20). At 2–3 players the same holds per color.
- Shop: 5 face up in round I, 6 in round II, 7 in round III (Cory, Oct 21), refills from the pile, whole row refreshes between rounds. Release is off by default. The 10-per-color cull is on.
- Turn order: random in round I, then fewest followers first; snake, so the ends double up.

## The three economies inside one turn (Claude's read)

Every turn spends three things, and the game is about which one is scarce right now.

1. **The space.** Shared, blocking, snake-drafted. This is the soul: "will my spot still be open?" Ring I spaces stay live all game, so a round III turn chooses among 6 per color.
2. **The buy.** One per turn, and it can't be banked. Early, resources are scarce and the buy is cheap; late, resources pile up and the buy is the bottleneck (a Double Down for 20 gold needs two top packs, i.e. two turns). Anything that grants an extra buy is worth more the later it lands.
3. **The pile.** What you hold at round end wins contests, what you spend becomes members or followers. Holding costs nothing between rounds I and II except tempo; in round III, holding X to win a prize of 6 is right only when X is small and you'll actually lead.

## What has been winning, and why the economy is moving (evidence named)

- Testers and bench said the same thing through v0.6: **recruiting doesn't pay; conversion and rim snipes do.** AI tester (boardgame-enthusiast-w3): a 16-member engine came last; one player won three round III contests holding 2, 2 and 9 after everyone else cashed out. Normal-bot bench: 21–24% of round III prizes go uncontested, and removing them flips the winner in 37–39% of games.
- Why, in the math: a member costing C and worth f is a loss of C−f followers unless its ability earns that back, and it eats the buy that could have turned up to 10 resources into 10 followers. Big flat resource gains (Kickback +3, Golden Years 2/4/6, Toast 3/6/9) make the follower pack the best "member".
- Cory's Oct 20 economy call answers exactly this: actions give 1 of their color and only sometimes more, members get cheaper, members are where followers come from, and held resources score contests so **holding versus spending on members** is the core tension. Green, Red and Magenta already follow it; the other six don't yet.
- What Cory says feels right in members: steady income (Banker, Busker, Host), scorers, rule-benders like Straggler. What feels weak: small "+1 when…" triggers, switches, conditionals.
- Big Money (buy followers only) is the baseline at about 25%. Under the new economy it should drift down as members get cheaper; that's the instrument to watch, not a goal to chase.

## Where the tension lives (Claude's read)

- **Blocking.** The draft is the heart. Snake double turns at the ends, Ring I spaces staying open, and catch-up turn order (fewest followers first) are the only comeback engine the base game has.
- **Contest reading.** Prizes are visible state: you can see who leads each rim. Round I and II contests are cheap for whoever isn't buying; round III is a cliff (spend everything or sit on a small pile).
- **Piles as targets.** Magenta's half-a-stack theft and Gold's Collect Debts are the only checks on a hoard. A big pile is both a contest lead and a theft target, which is good tension.
- **Members as targets.** Since Red and Magenta, members move: equal-cost swaps, promote/demote through the shop, Shake Down, Poach. Bodyguard and Loyalists are the defense. A member is no longer safe once bought, so cheap bodies and protection matter.
- **The shop as a shared board.** 5 to 7 face up, bought out before your turn comes back (Cory, Oct 14: "a member you like is usually bought before your turn comes back"). Today nothing lets you claim or plan around it except speed and Red's free recruits.

## What each color brings today

Reworked (new economy):
- **Red, members on the move.** Free recruits (Open Door, Recruit a Member), swaps with the shop and across cults (Even Swap, Promote, Demote). Quantity and turnover. Contest: held red.
- **Green, copying.** Echo/Encore/Reprise/Greatest Hits read where minions sit, so you care what rivals took. Chains pay +1 green per step. Contest: held green.
- **Magenta, theft.** Resources and members, aimed by choice; the check on hoards. Lie Low and Bodyguard defend. R3 Poach takes a member outright. Contest: held magenta. Members still the old deck.

Not reworked:
- **Gold, the hoard.** Most gold held, gold counts as any color in follower buys, Double Down in R3. Cory's own design and the reference for spend-or-sit. Out of step with the new economy: large flat gains, +1 gold per member, and Intro Offer is a cost reduction (all of which Cory dropped for rework). Flat spot: Double Down is a no-brainer for the gold leader and dead for everyone else.
- **Blue, the shop** (`market.js`). Snap Up, New Faces, Name Drop, Half Price, Show Off, Spree (buy 3 times). Contest: most blue members, so a shopping color is paid for buying its own color's cards. Cory: "needs a complete rework", "a lot of the blue quadrant was pretty bad". Many members hinge on blue cards happening to show up in the row; several are price cuts.
- **Purple, timing.** Extra turns and Crunch Time (take your next 2 turns right away, Cory: keep as is). At 4 players round I has no spare space, so its extra-turn members do nothing there; round I is three ways to gain purple. Cory: no board action should charge you. Contest: most purple members.
- **Silver, giving.** Toast/Goody Bags/Good Deed hand rivals a little; Rising Tide is the one that bites and swings hard. Cory asked for new Hold Court, Sweet Talk, Goody Bags. Contest: held silver, and gifts of silver feed rivals' contest, a tension nobody plays on purpose yet.
- **Yellow, variety.** Spaces top up colors; contest is full sets, which nobody chases and nobody can read at a glance.
- **White, follower trading.** Sell and buy followers; it competes with the core follower buy instead of bending it. Contest: most white members.

## What the reworks changed for the colors still waiting (Claude's read)

- With fewer resources per action, **every resource is louder**: theft, gifts, color conversion and doubling all hit harder per unit. Big-gain colors (Gold, Silver's Toast, Purple's Clock In) now read as outliers.
- With cheaper members and followers coming from members, **the shop is the main stage** and the buy is the scarce thing late. Whoever controls access to the row and the number of buys holds the biggest lever left unclaimed.
- Three of three reworked colors interact *at* rivals' stuff (take, swap, copy). The table has no color yet that rewards helping, and none that bends **when** you place beyond the snake.
- Stolen resources keep their colors, and five contests are on held color. So **which colors you hold** matters more than it did; color conversion (Yellow) quietly gained value.

## Checks for any pitch (from Cory's principles)

Placement accounting first (Claude, after Cory's Oct 22 "do you understand this game at all?"): every space costs a minion and a turn. A space that only hands back a turn or a minion (an extra minion, take a minion back, one turn after this one, Overtime, Linger, Rally) is net zero placements, so it must pay for itself some other way: move two or more turns (Crunch Time), pay resources for giving up position (the skip space), or change what you or a rival own or get. Write the net out before pitching. Before pitching a color: does every action feel good and distinct to take; does the R3 action feel like the burst the engine builds toward; does Round I stay worth taking in round III; is the harm mild except in R3; is it playable on a real table (nothing remembers last round); does it avoid naming another color; does it give members that make radically different cults. Pitch themes and play, never cards or numbers.

## Cory's taste, with evidence

**Accepts**
- Relative, scaling effects over small fixed numbers: double, half, per member, per round (2026-10-09: "everything should feel vaguely powerful").
- Round-III power: Double Down, Recruit a Member, Poach ("Aggression is intentional"), Greatest Hits.
- Interaction through the board: copying (Green), shared spaces, the shop, contests. Gifts and spills (Kickback, Rising Tide).
- Elemental, simple verbs. Echo is his bar for round I: "simple, strategic, scales because it copies better actions later" (2026-10-18).
- Weak twins next to strong spaces (Open Door beside Open House, 2026-10-13).
- Spaces that grow during a round (Bandwagon, Catch Up as 1/2/3), with the risk of losing them.
- Rule-bending members (Squatter, Straggler, Extra Hand, Front-runner: "good set!", 2026-10-14).
- Multi-body members and member counting (Twins, Mob 5, Panel 3, Retinue 3); "a member worth several followers counts as that many members" (2026-10-18).
- Steady income and scorers: "they all kind of feel weak… except for scoring ones or passive income" (2026-10-15).
- Harm when he picks it: Collect Debts on any player, the bribe "to the bank", Poach.

**Rejects**
- A color whose identity is holding its own resource (Gold as the hoard, gold as any color, members paying gold), 2026-10-21: "the core gold idea doesn't work as well now that almost all colors will give resource based points at round end". A pile of one color is no longer special.
- Agent-forged quadrants and a homemade sphere (Bookie) (2026-10-09: "mostly sucked").
- Tempo, Territory and Patronage spheres (2026-10-14: "bad ideas").
- Claude's 8 neutral rule-benders, especially out-of-turn minion placement (2026-10-14: "I don't like your neutrals").
- Rescue clauses ("if you can't…, +2"): "taking a space you can't use is on you" (2026-10-14).
- Win-more (Rank, 2026-10-14) and member counts or variety as a scoring rule (2026-10-09).
- Magenta extras: an extra follower purchase ("poor in Round I") and an optional color exchange (redundant), 2026-10-19.
- Cost reductions: dropped for now (2026-10-18); Intro Offer, Planner etc. await new abilities.
- Release: "needs to go entirely" (2026-10-17).
- Spaces that charge you: "no board action should require spending" (2026-10-15).
- Members that are slight variations of each other; fiddly timing for small gains; hooks on mechanics that don't exist; anything players couldn't track on a real table (Lender's debt, Sleepwalker's memory of last round).
- Things hard to show in the UI (Big Spender, 2026-10-15).
- Cute visual shorthand and reinventions of approved looks (doorways, "just variations on what exists", 2026-10-15).
- Overpriced members: 4 resources for a 2-follower member is "too expensive" (2026-10-12); his gut beats the value model.
- Green round-I pitches that all doubled down on copying: "not thinking broadly enough… think about how the quadrant plays with the others" (2026-10-18).
- Losing a member before round III as a crazy-bad sting (2026-10-15); a mild sting is fine.

**Patterns**
- Mechanic first, theme light. "Don't over-index on cult."
- He changes rules by feel after playing, not from bot numbers. Bot stats are not design flaws.
- He accepts Claude's fill-ins only when they're labeled, and overturns them freely.
- He wants deep ideas "grounded in the game and its principles" (2026-10-18), not lists.

## How Cory designs a color

- He picks the round-III action first and works backward to find the core (Red 2026-10-18: "III: Recruit a Member… work backward"; Magenta 2026-10-19: "Lock Round III: Take any rival's member… work backward from that anchor"). Cory, 2026-10-21: "I've been working from… the round three action… and kind of working backwards… But there's other ways we could go about it. We don't have to be married to what the colors do right now."
- Identity comes from the mechanic (moving members, copying, stealing), not the theme or resource.
- Then round II as the bridge (Promote/Demote, Shake Down plus half-stack theft), then round I as two or three options of equal total gain with different side benefits (Magenta's 2/3/4 totals).
- Each action gets the inherent +1 of its color; a simple scaling gain (Gather, Build Up) usually anchors round I.
- He tests shapes in chat with examples, asks for the arithmetic per round, then locks one slot at a time.
- Members come after the actions, as a separate pass, and he keeps or cuts each one by name.

## How to pitch to Cory

1. Quote the live card text in a few words; he doesn't memorize cards.
2. Start from what the round-III action does, and say how the color's core plays out from round I.
3. Say the identity in one mechanic, distinct from every other color.
4. Show the arithmetic per round against the anchors (round I about 2–4 resources total including the +1, round II more, round III a burst) and against the 1-for-1 follower rate and the one-buy limit.
5. Say how it touches the other colors through the board, generically, never naming a specific sphere.
6. Check against his rejects: no rescue clauses, no spending to use a space, no out-of-turn placement, no win-more, no cost reductions, no Release, no hidden tracking, no member loss before round III unless he asked.
7. Don't pitch economy changes; that's his decision.
8. Offer one or two ideas, calibrated, not a list of eight. Label fill-ins as yours.
9. Use his words: members, followers, minions, buy followers, the wheel, contest. No coined names.
10. Keep it short: numbered, answerable by number, default in brackets.
11. Log the pitch and his answer in design/pitch-ledger.md the same turn.

## Color by color, card level (live code, Oct 20)

### Red — moves and recruits members (reworked, v0.8.0 actions, v0.8.2 deck)
- Identity: members are the currency; get them free and move them around.
- I: Even Swap ("Swap any two members of equal cost"), Gather (+2 / +3 / +4 red total by round), Open Door ("Recruit the cheapest shop member"). II: Promote ("Swap a member with a shop member costing up to 2 more"), Demote ("…costing at least 2 less"). III: Recruit a Member (any shop member, free). Every action +1 red except Gather, whose total includes it.
- Contest: most red held (since v0.8.1, Cory 2026-10-18: so member commitment doesn't also win the arc automatically).
- Deck (12): Volunteer 0, Twins 2+0 (worth 2), Recruiter 3+1, Recruit Bonus 2+2, Patriarch 3+2, Movement Penalty 3+2, Loyalists 2+3 (worth 2, your members can't be swapped), Host 4+2, Proselytizer 4+2, Panel 4+2 (worth 3, promote or demote another member), Mentor & Protégé 5+3, Mob 6+4 (worth 5, +1 per red member at game end). Recruit Bonus and Movement Penalty are stand-in names.
- How it wins: free members dodge the one-buy limit; Mob + Patriarch + Proselytizer turn bodies into followers.
- Touches others: swaps and Promote/Demote can target any cult, rivals included. Demoting a rival's best member is a sting, Promoting one is a gift. Movement Penalty costs the victim a follower. Loyalists and Bodyguard are the defenses.
- Reading, unverified: Recruit a Member taking Mob free in round III is the biggest single swing on the board. Open Door is close to free value in round I.

### Green — copies actions (reworked, v0.7.0)
- Identity: copy what the table is doing; chains pay +1 green at every link.
- I: Chorus (+1 green per other Green action with a minion), Build Up (+1 green × round), Echo ("Copy the previous action", the bar Cory set for round-I actions: "absolutely perfect"). II: Encore (copy an action with a rival minion), Reprise (copy an action with your minion). III: Greatest Hits (copy every action with your minion). All +1 green. Copying a copy lets you choose again; never an action already in that chain. A copy gives the space's printed gain, not the taker's member bonuses.
- Contest: most green held.
- Deck (12): Busker 1+3, Muse 2+2, Impressionist 2+2, Stunt Double 2+2, Tribute Band 8+2, Ensemble 3+3, Doppelganger 3+2, Impostor 4+2, Connector 4+2 (placeholder), Agents 1+2 (worth 2, your actions can't be copied), Bait 3+2 (placeholder), Chronicler 2+3 (rename pending).
- How it wins: ride the best spaces of the round twice; Greatest Hits as the burst.
- Touches others: implicit, through the board (Cory's model of good interaction). Agents, Bait and Muse are the counterplay.

### Magenta — thieves (actions reworked v0.8.8; members old)
- Identity: take from rivals; stolen resources keep their colors.
- I: Help Yourself (steal 1 × round, gain 1 follower × round), Redistribute (steal 1 per Magenta action that already has a minion), Lie Low (steal 1 × round; your members and resources can't be stolen this round). II: Crime Wave (steal half of one rival's stack of one color, rounded down), Shake Down (pick a rival's member costing 5 or less: they pay its cost to keep it, or you take it). III: Poach ("Take any rival's member", no replacement). All +1 magenta.
- Contest: most magenta held (v0.8.7). Magenta only comes from the +1s and stealing magenta, so the contest is a small-number fight (reading, unverified).
- Deck (old 10, not reworked): Cutpurse, Grifter, Sticky Fingers, Desperado, Robin Hood, Extortionist 8+2, Bodyguard ("Rivals can't steal from you"), Crew (worth 2), Double Agent (when recruited, swap it for any rival's member), Kingpin (game end +1 per 2 magenta). Cory dislikes the color; the new name, color and deck are open. Cory, 2026-10-21: "Magenta members are next. We'll do a light rework there."
- Touches others: directly, by design. Cory's rule: stings are fine, "not CRAZY bad, like straight up losing a member (unless it's a round-III action)" (2026-10-15). Shake Down and Double Agent are pre-round-III member losses he allowed.

### Gold — money and hoarding (old rules)
- Identity: the hoarder; spend or sit is real here (flat-spots.md calls Gold "the ruler").
- I: Kickback (+3 gold, +1 gold to a rival you choose), Golden Years (+2 / +4 / +6), Intro Offer (your next member costs 4 less). II: Collect Debts (take up to 3 gold from rivals, split as you like), Tithe (+1 gold per member). III: Double Down (double your gold).
- Contest: most gold held. No +1 per action.
- Deck (10): Banker 4+4, Prospector 2+2, Tax Collector 4+4 (rival buys followers: +1 gold), Merchant 4+2, Penny Pincher 4+0, Underdog 5+3, Alchemist 4+2, Speculator 4+4, Tycoon 4+2 (game end +1 per 2 gold), Treasurer 4+0.
- Reading, unverified: the gold leader wins the contest, then Double Down doubles the lead; Collect Debts and Underdog are the only brakes. Golden Years at +6 in round III is far above the new 1-per-action economy. *Docs vs code:* Cory dropped every cost reduction (2026-10-18), but Intro Offer is still live.

### Blue — the shop (old rules; Cory: "needs a complete rework", 2026-10-15)
- I: Snap Up (+2 blue, then pay for a shop member in any colors on top of your normal buy), New Faces (+2 blue, sweep the face-up row), Name Drop (+1 blue, +1 per blue member in the shop). II: Half Price (as your buy: a face-up member for half its cost, any colors), Show Off (blue equal to half your priciest member's cost). III: Spree (buy 3 times this turn).
- Contest: most blue members.
- Deck (10): Stylist, Connoisseur, Planner, Underbidder, Minimalist, Social Climber, Sommelier, Patroness, Snob, Recluse (Cory: "I love this one a lot").
- Reading, unverified: Spree is strong under 1:1 follower buys (three buys of up to 10). *Docs vs code:* Social Climber pays only on Release, which is off, so it's dead (Cory said cut it, 2026-10-18); Planner, Underbidder and Sommelier are cost reductions he dropped, still live. His leads for the rework: "Blue is going to translate to member synergy" and "rearrange the shop and then buy a bunch" (2026-10-17 batch #2, #35).

### Purple — timing (old rules; Cory: "Purple kernel is there, but needs rework", #80)
- I: Clock In (+4 / +5 / +6 purple), Catch Up (+1, +1 per rival who's placed more minions than you this round), Roll Call (+1 per minion you have on the board). II: Plan Ahead (+1 per minion left to place), Rush Hour (+1 per 2 minions on the board, everyone's; Claude's fill-in, never confirmed). III: Crunch Time ("Take your next 2 turns right away", your own minions; Cory kept it in the center to judge in play).
- Contest: most purple members, so purple the resource is just spending money (reading).
- Deck (10): Go-Getter, Late Riser, Courier, Overseer, Bookkeeper, Clockmaker, Lamplighter, Night Owl (worth 2), Timekeeper, Shift Crew (worth 2). Purple-leaning guests: Extra Hand, Front-runner, Straggler.
- Reading, unverified: Clock In is the biggest plain gain in round I on the board. *Docs vs code:* Cory said cut Overseer (2026-10-18) and called Bookkeeper bad; both still dealt. No board action should charge you (2026-10-15).

### Silver — giving (old rules)
- I: Toast (+3 / +6 / +9 silver; everyone else +1 / +2 / +3), Goody Bags (+2 silver and +2 of another color; everyone else 1 of that color), Good Deed (+4 silver; a rival you choose gets 2 of a color you choose). II: Sweet Talk (+4 silver, swap half or all your silver for one other color; everyone else +1), Rising Tide (everyone else +2 silver, then gain half the richest rival's silver, rounded up; Cory: "I like this one a lot"). III: Hold Court (1 follower per 2 silver held, keep the silver; everyone else +2 silver).
- Contest: most silver held.
- Deck (10): Guest, Benefactor, Majordomo, Retinue 1+1 (worth 3), Revelers (counts as 3 members), Heir, Upstart, Debutante, Grand Host 8+4, Patron Saint.
- Cory's reactions (2026-10-17): "Silver puts the game on steroids, needs some counterweight", "Silver is pretty close", "Silver round 2 actions need work". Sweet Talk, Hold Court and Goody Bags need better pitches (2026-10-18). Reading: Toast at +9 and Hold Court's buy-free followers are the steroids.

### Yellow — variety and sets (old rules)
- I: Harvest (+1 yellow, +1 per other color you hold), Top Up (+1 of each color you hold the fewest of), Trade Seeds (+2 yellow, then swap up to 3 resources). II: Branch Out (+1 of each other color per 3 yellow), Potluck (each member brings 1 of its color). III: Bumper Crop (+1 of each other color per full set).
- Contest: most full sets (opaque at a glance; flat-spots.md).
- Deck (10): Peddler 4+4, Admirer, Go-Between, Dyer, Late Bloomers (worth 2), Rainmaker, Pilgrim, Weaver, Explorer, Feastmaker. Freelancer guest leans yellow.
- Cory: "Yellow gets weak during lower person game", "Yellow basically doesn't want members", "Top Up is too bad in Round 3, and even Round 2" (2026-10-17). *Docs vs code:* Top Up was to scale by round and Feastmaker to become Chefs (2026-10-18); neither is built.

### White — follower trading (old rules)
- I: Sob Story (+2 white, +1 per rival with more followers), Cheap Seats (+1 follower per 3 white held, keep the white), Your Call (+1 / +2 / +3 followers, or 2 white for each you turn down). II: Sell High (sell up to 2 followers you bought or won, 3 white each; Cory: "what's a loose follower?"), Dividend (+1 white per follower you bought or won). III: All In (trade all your resources for followers, 1 for 1, may keep white).
- Contest: most white members. *Docs vs code:* "Fewest followers" (2026-10-15) was replaced by member contests (2026-10-17).
- Deck (10): Shopkeeper, Rich Uncle, Magnate, Shareholder (worth 3), Heiress, Bulk Buyer, Broker, Exporter, Reinvestor (a cost reduction, still live), Raider (once per game take up to 3 followers from the leader, paying 1 white each).
- Reading, unverified: All In converts any pile without a buy or the 10 cap, which makes it the hoarder's round-III dream.

### Guests (neutral rule-benders)
Squatter 5+2 (once per round place on a rival's taken space; Cory: "really great… maybe TOO strong in round III"), Freelancer 3+3, Extra Hand 6+3 (+1 minion in round III; "SUPER strong"), Front-runner 4+0, Straggler 4+1. Big Spender and Insider are cut. *Docs vs code:* Cory said neutral cards stay neutral (2026-10-18), but code still gives each a lean color that counts for that color (Squatter as magenta, three as purple). Cory designs the neutrals himself (2026-10-15).

## Keeping this true
After every rework ships or Cory answers a pitch, update the section it touches (the /brainstorm and /rework-color skills say when). Open design questions live in design/todo.md, not here.

## Cory's bar for round II (2026-10-20)
Round II spaces are measured against Promote (a free upgrade of a member) and Shake Down (take a member or get paid its cost). A round II space that only gives access or information (claim a card, pull a card into the shop) is far below that bar; he called dig "so weak". Round II must change what you own or how much you buy, not just what you can see.
