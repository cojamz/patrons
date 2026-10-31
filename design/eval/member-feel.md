# Member feel audit (2026-10-15)

Cory, after playing: "A lot of the blue quadrant was pretty bad. A lot of the members need some work/tuning. They all should feel better."

This audit judges how each member feels to own, not only whether it is priced right. It covers the Classic table first (Gold, Red, Blue, Green), then gives the other spheres a lighter pass. No game code was changed and no sims were run. Every number below comes from a run that already exists, and each one names its instrument.

**Instruments**
- **Bench.** The balance bench (claude/cults-bench, trend.md) hands one seat a private copy of a card and compares the result with the same game without it. "Fair price" is the cost at which recruiting the card nets zero followers. Its exchange rate is about 0.76 followers per cost point (Normal).
  - Normal bots, two runs: written "6.0 / 9.5".
  - Normal and Hard-20 pooled: written "pooled 6.7 / 10.3". Hard-20 only reads the cards Normal flags.
  - Both runs measured the prices from before balance passes 1 and 2. Where a price has moved since, the line says so.
  - **Blue's numbers measure the old "badged" texts.** Nothing has measured today's Blue.
- **Audit.** The dead-window audit (cory-notes-2026-10-14.md §4) used mixed Normal and Easy bots. It records what a member returned, split by the round it was recruited in (I / II / III). Its units are resources, plus 1.5 per follower, plus 0.8 per point of discount.
- **RC1.** Two blind AI testers played the Classic table: a newcomer against Normal bots and a strategist against Hard bots (panel-rc1-*.md).
- **Enthusiast.** A blind AI tester on an older build (boardgame-enthusiast-round2.md). Classic then used the plain Blue and Green.
- **Trigger counts.** From decisions.md (Normal bots, 40 games of Blue plus 3 random spheres):
  - 2.3 blue members sit face up on average.
  - From round II on, rivals recruit about 3.9 blue members a game and you recruit about 1.8.
  - A player holds about 1.7 blue members at game end.
- **Bot misplays, not the cards:** Midas (bots never switch it off) and Investor (bots always set aside half).

**Missing:** no instrument has read today's Blue texts, today's Tax Collector, or any human game beyond Cory's notes.

Prices are total cost (colored part plus any).

## What separates good feel from bad (the short version)
1. **The exchange rate makes +1 invisible.** The unlimited 10-for-10 buy means a late resource is worth about one follower, and winners finish at 45 to 90 followers.
   - A card that pays "+1" four to six times a game adds four to six followers. That is under 10% of a score, spread over turns you weren't watching.
   - Both RC1 testers said members felt like a detour unless they made resources. The newcomer: "P3 had twelve members and still lost? Then what are members even for?"
2. **Many payoffs land on someone else's turn.** Merchant, Stylist, Groupie, Onlooker, Auctioneer and Tax Collector all pay when a rival does something. In RC1 the log sat behind ☰. RC2's "since your last turn" strip shows these payouts, but a +1 there reads as noise.
3. **"Game end: +1 follower per N" cards lose to the 10-for-10 buy.** That buy pays one follower per resource. Tycoon pays one per 3 gold and Chronicler one per 2 green, so they only pay on what you couldn't spend. Their payoff is first seen at the final tally, which RC1 hid below the fold.
4. **One template, three prices.**
   - "+1 when you recruit": Middleman 4, Recruiter 8, Reseller 12.
   - "+1 when anyone recruits my color": Stylist 4, Merchant 6, Groupie 8.
   - Copy for +1: Impressionist 4, Choir 6.
   - The dearest version of each feels like being cheated.
5. **Two switches change a color and add nothing:** Midas (gold) and Translator (green). You must remember to flip them, and RC1 showed Midas's switch in the wrong state.
6. **Some cards pay you for being small.** Recluse, Minimalist, Underbidder and Wallflower pay you for having fewer members or followers, in a game about recruiting lots.

The members that feel great do the opposite:
- Their payoff is relative or grows (double, half, per round, per member).
- It lands on your own turn or at round start.
- They hand you a plan.

## 1. Feel lens, Classic table

### Gold (Cory's design)
| Member (cost): text | Visible | Size | Plan | Fiddly | Dead window | Table | Evidence |
|---|---|---|---|---|---|---|---|
| Midas (8): "gains from actions come as gold; switch it when you buy" | every gain turns gold; RC1's switch read "Off" while on | adds nothing; it moves amounts between colors | an enabler for Underdog and Prospector | a switch to manage; it kills Tinker | none, but it can cost you other contests and red parts | none | bench pooled 2.0 / 4.7 at 8 (bot misplay) |
| Banker (8): "now and at round start, +3 gold" | yes, every round start | flat +3, doesn't grow | steady income | none | weak bought in round III (+3 once) | none | pooled 6.7 / 10.3 at the old 4, now 8; RC1 newcomer: "a money printer" with Doppelganger |
| Prospector (4): "an action gains you gold: +1 more" | in "you'd get" | +1 trickle, about 5 a game | the gold spaces you'd take anyway | none | none | none | bench 4.1 / 4.3, fair; Enthusiast: "too small to matter" |
| Tax Collector (4): "the follower leader buys followers: +1 gold" | rivals' turns only | +1 trickle | none | ties and "before the buy" are hard to read | none | watches the leader (a good instinct) | new text unmeasured; old text pooled 9.2 / 8.1 |
| Merchant (6): "anyone recruits a gold member: +1 gold" | mostly rivals' turns | +1 trickle | none | none | late (1.4 if bought in round III) | passive | bench 4.0 / 3.7 at 6 (dear); audit 4.5 / 3.7 / 1.4 |
| Penny Pincher (4): "gold spent on members counts double" | pay dialog (RC1 didn't say; fixed) | relative: halves gold prices | yes: gold into members | none now | none | none | bench 4.9 / 5.7, fair; the strategist's engine |
| Middleman (4): "you recruit a non-gold member: +1 gold" | your turn | +1 trickle | weak | none | late (0.7 if bought in round III) | none | bench 4.4 / 2.7; audit 4.9 / 3.1 / 0.7 |
| Underdog (6): "gold gains doubled while anyone has more gold" | the preview now shows ×2 and why | relative, big | yes: spend down on purpose | trigger order (Hustler's gold lands first) | while you lead gold | reads rivals' piles | bench 7.9 / 7.0; strategist: "that's the cool part" |
| Tinker (6): "another color from an action: half as much gold" | preview | relative, grows with big gains | mix colors | rounding | none | none | bench 7.2 / 9.2 (cheap) |
| Investor (6): "round start set gold aside; round end it returns doubled" | a lump at round end | relative, big in round II | a time-shift | a five-way choice each round; the gold is locked all round | blank if bought in round III; its round-III return lands after your last buy (contest only) | none | pooled 2.1 / 2.4 (bot misplay) |
| Lottery Winner (10): "once: gold equal to the richest rival's" | a big moment | relative, big late | wait for a rich rival | a real timing call | early | keyed to a rival | bench 13.7 / 12.1 (cheap) |
| Speculator (8): "once: double your gold" | a moment | relative | hoard, then double | none | early | none | bench 5.5 / 8.2; Enthusiast: "trap, buys are the bottleneck" |
| Tycoon (6): "game end: +1 follower per 3 gold" | only at the final tally | a third of the follower buy's rate | none: a mop-up | none | all game | none | pooled 6.4 / 7.9 at the old 12, now 6 |
| Treasurer (4): "when recruited: gold equal to your member count" | instant | grows with members | buy it late | none | early (1.5 in round I) | none | bench 6.5 / 4.3; audit 1.5 / 4.4 / 7.5 |
| Hustler (2): "pick a color; actions there +1 gold per round number" | preview | grows by round | yes: commit to a color | "actions there" is vague; it switches Underdog off | none | none | pooled 8.9 / 5.9; Enthusiast: "scales nicely" |

### Red (Cory's design)
| Member (cost): text | Visible | Size | Plan | Fiddly | Dead window | Table | Evidence |
|---|---|---|---|---|---|---|---|
| Twins (2): "worth 2" | a 2 on your seat | flat | bodies for Red's count | none | none | none | bench 3.9 / 3.4 |
| Big Family (4): "worth 3" | same | flat | same | none | none | none | bench 3.8 / 2.9 |
| Volunteer (0): "free, no effect" | none | a body | fodder for the count | none | none | none | bench 4.3 / 0.6 |
| Intern (1): "no effect" | none | a body | fodder | none | none | none | bench 1.3 / 2.9 |
| Mentor & Protégé (10): "also take the cheapest face-up member free" | a moment | the cheapest card, often a Volunteer | count padding | none | none | none | bench 6.9 / 7.0 at 10 (dear) |
| Proselytizer (6): "you recruit: +1 follower" | instant, your turn | +1 follower, grows with recruits | yes: recruit lots | none | late | none | pooled 8.1 / 4.7 at the old 12, now 6; Enthusiast: "exciting" |
| Mob (8): "game end: +1 follower per red member" | only at the end | 3–5 | yes: collect red | none | none | none | bench 6.1 / 8.2, fair |
| Recruiter (8): "you recruit: +1 red" | your turn | +1 trickle at 8 | recruit (you would anyway) | none | late (2.0 in round III) | none | bench 4.7 / 7.7; audit 6.8 / 4.8 / 2.0; Middleman's template at twice the price |
| Pied Piper (4): "2+ recruits in one turn: +2 red" | when it fires | +2 | a combo to chase | count recruits per turn | 0 in 33–64% of holdings | none | bench 6.3 / 4.1; audit 0.9–1.9 |
| Host (6): "now and at round start, +1 red per 2 members" | round start | grows with members | Red's own plan | none | none | none | bench 5.2 / 4.7, fair |
| Sponsor (10): "your members cost 2 less" | every buy | 2 off every recruit | yes: an engine | none | late | none | bench 9.5 / 8.0, fair |
| Crowd-Pleaser (2): "you buy followers: +1 red" | your turn | +1 trickle | none | none | ~40% of round-III red lands after the last buy | none | bench 2.2 / 3.6 |
| Doppelganger (6): "when recruited: copy one of your members" | instant | as big as your best card | yes | one pick | early (0 in 53–68%) | none | bench 4.6 / 4.0; RC1 newcomer's favorite (copying Banker) |
| Patriarch (10): "game end: +1 follower per 2 members" | only at the end | 3–6 | yes: recruit lots | none | none | none | bench 8.5 / 8.1, fair |
| Benchwarmer (1): "no effect" | none | a body | none | none | none | none | a placeholder: the same card as Intern (waiting on Cory's hold rule) |

### Blue (Claude's draft; Cory: "needs a complete rework")
| Member (cost): text | Visible | Size | Plan | Fiddly | Dead window | Table | Evidence |
|---|---|---|---|---|---|---|---|
| Stylist (4): "anyone recruits a blue member: +1 blue" | rivals' turns | +1 trickle | depends on what the row shows | none | late (1.5 in round III) | passive | bench 4.6 / 4.5 (old text); audit 6.3 / 3.8 / 1.5 |
| Onlooker (10): "a rival recruits a blue member: +2 blue" | rivals' turns only | about 8 blue a game from round II | none | none | late | passive | old text 5.4 / 8.8 at 10; estimate 7.8 blue (decisions.md) |
| Connoisseur (4): "you recruit a blue member: +2 blue" | your turn | +2, about 2 times a game | the row's luck | none | none | none | bench 3.0 / 4.2 (old) |
| Reseller (12): "you recruit: +1 of its color" | your turn | +1 trickle at Blue's top price | none | none | late (2.0 in round III) | none | bench 6.0 / 9.5 at 12; audit 6.0 / 3.9 / 2.0 |
| Curator (4): "now and at round start, +1 blue per other blue member" | round start | small; grows only if blue shows up | collect blue (luck) | none | none | none | bench 2.2 / 3.7 (old) |
| Planner (4): "now and at round start, next member 2 less per round number" | round start and your buy | grows: 2 / 4 / 6 off | yes | a waiting discount to remember | none | none | bench 7.8 / 9.8 (cheap); Enthusiast: "surprised and delighted me" |
| Underbidder (2): "now and at round start, next member 2 less per rival with more members" | round start | 0–6 off | pays for staying small (against the game) | a waiting discount | while you lead in members | catch-up | bench 3.6 / 5.4 |
| Minimalist (2): "now and at round start, +1 blue per rival with more members" | round start | +0–3 | against the game | none | while you lead in members | catch-up | bench 3.9 / 1.6 |
| Social Climber (2): "you release another member: +2 of any color" | your turn | +2 | none: people rarely release | a color pick | until you release | none | bench 2.7 / 2.6; neither RC1 tester released anything |
| Auctioneer (6): "a rival recruits a non-blue member: +1 blue" | rivals' turns | many small drips (~18 triggers if held all game) | none | none | none | passive | bench 7.4 / 4.5 (old) |
| Sommelier (4): "you recruit a blue member: next member 2 less" | your turn | 2 off, when blue shows up | luck | a waiting discount | none | none | bench 3.6 / 2.8 (old) |
| Patroness (8): "you recruit a blue member: +1 follower" | your turn | about 2 followers a game | luck | none | late | none | bench 7.9 / 5.6 (old); you recruit ~1.8 blue from round II |
| Talent Scout (4): "once: look at the top 5 of the pile, recruit one at its cost" | a moment | an extra recruit at full price | weak | peeking at 5 hidden cards | early (no money) | none | pooled 0.6 Normal / 4.7 Hard-20 |
| Snob (10): "game end: +1 follower per blue member" | only at the final tally | about 3 followers | collect blue (luck) | none | all game | none | bench 6.1 / 6.7 (old); ~1.7 blue held at game end |
| Recluse (4): "game end: +2 followers per rival with more members" | only at the end | 0–6 | pays you for losing the member race | none | if you recruit well | catch-up | bench 3.4 / 7.9 |

### Green (Claude's draft; Cory: "Green needs tweaking as a whole")
| Member (cost): text | Visible | Size | Plan | Fiddly | Dead window | Table | Evidence |
|---|---|---|---|---|---|---|---|
| Busker (8): "now and at round start, +3 green" | round start | flat +3 | steady income | none | weak in round III | none | pooled 8.0 / 7.4 at the old 4, now 8 |
| Choir (6): "you copy a space: +1 green" | your turn | +1 trickle | copying (Green's own) | none | none | none | pooled 2.5 / 3.2 at 6 (dear); Impressionist does more for 4 |
| Muse (4): "a rival copies your space: +2 green" | rivals' turns | +2, rare | none | none | when nobody copies | a nice idea, rarely felt | bench 4.3 / 5.9 |
| Understudy (6): "when recruited: copy a rival's space taken since your last turn" | instant | a whole space | yes | one pick | none | reads the table | bench 9.2 / 7.7 (cheap) |
| Ensemble (6): "you copy a rival's space: +1 follower" | your turn | +1, a few times a game | Echo and Encore | none | none | reads the table | pooled 2.7 / 3.5 at 6 (dear) |
| Groupie (8): "anyone recruits a green member: +1 green" | rivals' turns | +1 trickle | luck | none | late (1.1 in round III) | passive | bench 5.1 / 4.4 at 8; audit 4.8 / 2.4 / 1.1 |
| Translator (6): "copies come as green; a switch" | your turn | adds nothing: it changes the color | the green contest | a switch to manage | none | none | bench 2.6 / 5.6 |
| Impressionist (4): "you copy a space: +1 of that space's color" | your turn | +1 trickle | copying | none | none | none | bench 3.9 / 2.6 |
| Wallflower (4): "copies doubled while no one has fewer followers than you" | your turn | relative, big | none: it pays for being last | who's last right now? | it switches off as soon as it works | catch-up | bench 3.7 / 4.2 |
| Mime (6): "when recruited: as much green as the rival with the most" | instant | relative, huge late | buy it late to tie the green contest | none | early (2.3 in round I) | takes the green contest from whoever built it (Upstart was halved for this) | bench 8.3 / 8.9 (cheap) |
| Sleepwalker (6): "now and at round start, copy one of your spaces from last round" | round start | a whole space | yes | remembering last round's spaces | its "now" copies nothing in round I | none | pooled 12.1 Normal / 5.3 Hard-20 |
| Stunt Double (10): "once per round, copy the space you just took" | your turn | a whole space | yes | when to use it | none | none | bench 7.9 / 10.6 |
| Tribute Band (12): "once: copy every space you took this round" | the round-III burst | huge | yes | timing | until late | none | bench 10.6 / 13.2 |
| Chronicler (8): "game end: +1 follower per 2 green" | only at the final tally | half the follower buy's rate, on leftovers | none | none | 0 in 33–42% of games | none | bench 4.8 / 3.4 (dear) |

Guests (on by default, so they're in the Classic deck too):
- **Front-runner** (2, "you always pick first in a round"): the RC1 strategist called it "a cheat code for 2 coins", and the Enthusiast said "nerf". The bench reads it fair (2.4 / 0.7), so it's one AI tester's call; watch it in human play.
- **Insider** (6, "you may also recruit from the top 3 of the pile") counts as a blue member. It is the most market-like card in the deck, and it isn't Blue's.

## 2. Ranking: the 20 worst-feeling members on the Classic table
Worst first. 8 are Blue, 5 Green, 5 Gold, 2 Red.

1. **Reseller** (Blue, 12): "Whenever you recruit, +1 of that member's color."
   - The priciest card in Blue does Middleman's job, and Middleman costs 4. You save for it, then never notice it.
   - Evidence: bench 6.0 / 9.5 against 12; audit 2.0 when bought in round III.
2. **Snob** (Blue, 10): "Game end: +1 follower per blue member you have."
   - 10 for about 3 followers that appear only at the final tally. Which cards are blue is the row's luck.
3. **Onlooker** (Blue, 10): "Whenever a rival recruits a blue member, +2 blue."
   - A 10-cost drip that pays on other people's turns. You never see it work.
4. **Patroness** (Blue, 8): "Whenever you recruit a blue member, +1 follower."
   - Pays about twice a game, if blue shows up in the row.
5. **Groupie** (Green, 8): "Whenever anyone recruits a green member, +1 green."
   - Stylist at twice the price: a +1 trickle you never notice.
6. **Chronicler** (Green, 8): "Game end: +1 follower per 2 green."
   - Pays half what a follower buy pays, and only on green you couldn't spend. Zero in a third of games.
7. **Investor** (Gold, 6): "Round start: set aside gold. Round end: it comes back doubled."
   - It has one real use a game. It is blank if bought in round III, and its round-III return lands after your last buy.
   - Every round it asks the same five-way question.
8. **Social Climber** (Blue, 2): "Whenever you release another member, +2 of any color."
   - A reward for a move people almost never make.
9. **Recluse** (Blue, 4): "Game end: +2 followers per rival with more members than you."
   - Pays you for losing the member race in a game about recruiting, and shows nothing until the end.
10. **Translator** (Green, 6): "What you copy comes as green (a switch)."
    - A switch to manage that adds nothing.
11. **Choir** (Green, 6): "Whenever you copy a space, +1 green."
    - A +1 trickle priced above its twin, Impressionist (4).
12. **Tycoon** (Gold, 6): "Game end: +1 follower per 3 gold."
    - A third of the follower buy's rate. It only mops up gold you couldn't spend.
13. **Merchant** (Gold, 6): "Whenever anyone recruits a gold member, +1 gold."
    - +1 on other people's turns. Stylist does the same for 4.
14. **Minimalist** (Blue, 2): "Now and at round start, +1 blue per rival with more members than you."
    - Small, and it argues with the game.
15. **Midas** (Gold, 8): "Gains from actions come as gold instead (a switch)."
    - Changes the color and adds nothing, at 8. Half the bad feel in RC1 was the switch showing the wrong state.
16. **Wallflower** (Green, 4): "While no one has fewer followers than you, your copies are doubled."
    - It pays for being last, and turns itself off the moment it works.
17. **Mentor & Protégé** (Red, 10): "When recruited: also take the cheapest face-up member free."
    - The protégé is the worst card in the row, usually a Volunteer or Intern.
18. **Pied Piper** (Red, 4): "Recruit 2+ members in one turn: +2 red."
    - A combo you chase for +2. It pays nothing in a third to two thirds of holdings.
19. **Stylist** (Blue, 4): "Whenever anyone recruits a blue member, +1 blue."
    - +1 on other people's turns, depending on what the row shows.
20. **Tax Collector** (Gold, 4): "Whenever the rival with the most followers buys followers, +1 gold."
    - Today's text. A +1 you only see in the log.

Just outside the 20, and the same kinds of problem:
- Recruiter (Red, 8: "+1 red when you recruit"): Middleman's twin at twice the price.
- Sommelier (Blue, 4) and Connoisseur (Blue, 4): small payouts that depend on blue showing up.
- Ensemble (Green, 6: "+1 follower per rival copy").
- Crowd-Pleaser (Red, 2).
- Prospector (Gold, 4).
- Talent Scout (Blue, 4).
- Benchwarmer is not ranked: it is a known placeholder (the same card as Intern).

**Feels great to its owner, bad to the table.** Mime (Green, 6: "green equal to the rival with the most green"). Recruited in round III, it ties the green contest that someone built all round. Upstart, its Silver twin, was halved for the same reason.

### What feels great (the target)
- **Underdog** (Gold, 6: "your gold gains are doubled while anyone has more gold"). Relative, it reads the table, and it gives a plan: spend down on purpose. The strategist called it "the cool part".
- **Penny Pincher** (Gold, 4: "gold you spend on members counts double"). Relative, and it turns a pile into members.
- **Hustler** (Gold, 2: "+1 gold per round number in your color"). It grows every round. The Enthusiast said "scales nicely", and the bench reads it far above its price.
- **Planner** (Blue, 4: "your next member costs 2 less per round number"). It grows 2 / 4 / 6, lands on your own buy, and stacks. The Enthusiast was "surprised and delighted".
- **Banker** (Gold, 8) and **Busker** (Green, 8): "+3 at round start". Simple and seen every round. The newcomer, on Banker plus a Doppelganger copy: "a money printer".
- **Sponsor** (Red, 10: "your members cost 2 less") and **Proselytizer** (Red, 6: "+1 follower whenever you recruit"). They pay on every recruit, so they push the game's own plan, recruiting lots.
- **Doppelganger** (Red, 6): it becomes your best card.
- **Lottery Winner** (Gold, 10): one big moment, keyed to a rival.
- **Understudy, Sleepwalker, Stunt Double and Tribute Band** (Green). Each copies a whole space on your own turn, and Tribute Band is the round-III burst.

Pattern: the amount is relative or grows, it lands on your turn or at round start, and it tells you what to do next. Nothing on this list is a fixed +1 on someone else's turn.

## 3. Blue as a whole
Blue's identity is the shop: it should make recruiting cheaper, more frequent and yours. It doesn't deliver that.

Its spaces give access without money. Snap Up lets you recruit now, Half Price takes half off, and Spree gives three buys, but all of it is paid from resources you don't have. Meanwhile Red's spaces hand out members free. The bench (Normal bots) reads Blue's spaces under their ring bands:

| space | ring | bench | ring band |
|---|---|---|---|
| Snap Up | I | 0.4 / 1.7u | 2–3 |
| Half Price | II | 0.1 / 1.6u | 3–5 |
| Show Off | II | 1.3 / 1.2u | 3–5 |
| Spree (center) | III | 5.4 / 1.8u | 5–9 |
| Open Door (Red) | II | about 6u | 3–5 |
| Hand-pick (Red) | III | about 15u | 5–9 |

Its members are three small templates:
- **"You recruit a blue member"** (Connoisseur, Sommelier, Patroness).
- **"Someone else recruits"** (Stylist, Onlooker, Auctioneer).
- **"Rivals have more members than you"** (Underbidder, Minimalist, Recluse).

The first two hang on whether blue cards happen to show up (2.3 face up on average). The third pays you for not recruiting. Only Planner, Sommelier, Underbidder and Talent Scout actually bend the shop.

The "most blue" contest is Gold's hoarding contest in another color. Three of the four Classic contests are now "hold the most X", and this one tells a shopping sphere not to spend.

What makes it feel bad: you take a Blue space, still can't afford anything, and your Blue members drip +1 blue on other people's turns into a pile you're told not to spend.

**Direction: the core mechanic.**
- Blue gives the money and the bargain together. Its spaces pay blue and bend the price in relative terms (half, per round, per member).
- Round III becomes the big shopping day, when a Blue player recruits several members in one turn.
- Its members pay on your own recruits, in proportion to what you bought.

**Direction: the scoring shape.** Score what a shopper shows off, at a glance: your priciest member. There's no cutoff and no adding up. Red wins on many cheap members, Blue on one grand one.

## 4. Calibration (two rewrites, one card family)
Both rewrites turn "+1 on a recruit" into "half its cost". That family covers about 12 cards across the deck:
- Middleman, Recruiter, Reseller, Exporter, Go-Between.
- Merchant, Stylist, Groupie, Onlooker, Auctioneer, Connoisseur, Admirer.

If Cory likes the pattern, it scales. If not, nothing else moves.

Pricing uses the value model (design/eval/value-model.md): price ≈ 1.5u for the follower, plus 50–70% of the ability's EV, with EV counted from a round-II buy. Cross-check: the same formula gives Prospector about 4.5, and the bench reads it fair at 4.

1. **Reseller** (Blue): "Whenever you recruit, gain blue equal to half its cost (rounded down)."
   - **Price: 8 (4 blue + 4 any), down from 12.**
   - Arithmetic: about 4 more recruits × about 2.5 blue each = 10u. Then 1.5 + 5 to 7 gives 6.5–8.5, so 8. That's about 5 blue a round, paying back in 1.6 rounds. Today's text earns about 4 × 1 = 4u, which puts its fair price near 4 against a printed 12.
   - Why it feels better: it pays on your turn, in proportion to what you just bought (a 10-cost member hands back 5). It says "shop high", and it grows into round III. Flag: free recruits (Open Door, Hand-pick) pay too; the bench should read that combo.
2. **Groupie** (Green): "Whenever a rival recruits a green member, gain green equal to half its cost (rounded down)."
   - **Price: 8 (4 green + 4 any), unchanged.**
   - Arithmetic: about 3–4 rival green recruits from round II (Blue's own-color count measured 3.9, Normal bots) × about 3 green each (average green cost 6.7) = 9–12u. Then 1.5 + 4.5 to 8.4 gives 6–10, so it stays at 8. Today's text earns about 5u, fair near 4.5 against 8 (bench 5.1 / 4.4).
   - Why it feels better: it still watches the table, but each payout is big enough to notice (a rival's 8-cost green member hands you 4). It changes what rivals buy ("that green card feeds P2's Groupie"), so the interaction runs through the shop.

## 5. The other spheres (lighter pass)
Same classes, same fixes. Only the cards that stand out.

- **Silver**
  - Trickles: Silversmith (6, "a rival takes a Silver space: +1 silver") and Caterer (4, "you give: +1 silver").
  - Pays only on leftovers: Patron Saint (6, "game end: +1 follower per 2 silver members in play").
  - Feels great: Grand Host (12, "Silver spaces give you twice the silver"), Debutante (8, "once: double your silver, everyone else +2") and Heir (8, "+1 silver per member"). All relative.
- **Purple**
  - The extra-turn cards (Go-Getter, Night Owl, Taskmaster) are real moments.
  - Errand Runner (8, "when recruited: an extra turn"): the turn vanishes when no space is spare, which is always the case in round I at 4 players.
  - Pays for being last: Late Riser (6, "fewest followers: an extra turn first").
  - Leftovers only: Timekeeper (8, "game end: +1 follower per 3 purple").
- **Yellow**
  - Trickles at high prices: Gleaner (10, "+1 yellow when an action gives 2+ of another color"), Explorer (8, "+1 yellow per space outside Yellow") and Farmer (6, Prospector's text in yellow).
  - Fiddly: Sower (4, plant and harvest, a copy of Investor) and Dyer (6, pays at round end, after round III's last buy).
  - Feels great: Rainmaker (6, "once: raise each color to match your yellow") and Feastmaker (10, "once: +1 of each color per round number").
- **White**
  - Trickles: Tipster (6, Tax Collector's old text in white), Dealer and Broker.
  - Leftovers only: Magnate (4, "game end: +1 follower per 3 white").
  - Lender (2) still sheds its debt by Release (balance pass 2's proposal 2).
  - Feels great: Heiress (10, "once: +1 white per member") and Raider (2, "buy up to 3 followers from the leader for 1 white each").
- **Magenta**
  - Leftovers only, and loot gets spent: Kingpin (2, "game end: +1 follower per 2 magenta"), 0 in 64–77% of games.
  - Light Fingers (8, "a rival recruits a member costing 8 or more: take 1") still uses the cost cutoff Cory cut from Blue.
  - Feels great: Sticky Fingers, Desperado and Double Agent (6, "when recruited: swap it for any rival's member").

## Open
- Nothing has measured today's Blue texts. Every Blue number above is for the badged versions, and the bench should re-read Blue before any reprice.
- Missing numbers:
  - how often people (not bots) release;
  - how many rival copies a Green-free Classic table makes (it bears on Muse);
  - follower totals from Cory's own games.
