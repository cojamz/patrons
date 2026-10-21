> Member principles (from the Oct 21 rework panel). Durable: read before pitching any member. Source evidence and quotes below; Cory can change any line.

# Member shape: what Cory likes, and the principles for new members

Panel role: member-shape analyst, 2026-10-21 overnight. Read-only work: no sims, no code. Sources: decisions.md (Oct 9 to Oct 21), pitch-ledger.md, strategy.md, eval/member-feel.md (Claude's own Oct 15 audit, used only for card texts and as a record of where Claude misread him, never as his taste), spheres/red-members-2026-10-18.md (and its first draft in git, 2e93db31, which keeps Cory's own proposals), spheres/green-redesign-2026-10-18.md, eval/neutral-members.md, live-cards.txt. Live costs are colored+any, "fN" is printed followers, "nN" bodies when it differs from 1. Anything marked "Claude's read" is inference, not his call.

## 1. His verdicts, sorted

### Liked (strongest first)
- **Recluse** (2+2, "Game end: +2 followers per rival with more members than you"): "I love this one a lot" (Oct 15 18:09). Note: Claude's Oct 15 feel audit listed it as a flaw ("pays you for being small"). He loved it anyway.
- **Squatter** (5+2, "Once per round: place a minion on a space a rival already took"): "yes; very strong, make it expensive" (Oct 14), "really great… maybe TOO strong in round III" (Oct 15 18:09), then "a little cheaper" (Oct 17, 8 to 7).
- **Extra Hand** (6+3, "+1 minion in round III"): "yes, but SUPER strong; price very carefully" (Oct 14), "make it cost 9" (Oct 15), "Probably fine" (Oct 17 #24).
- **Straggler** (4+1, his own design, Oct 14): "really likes" it. He cut the question it asked ("it's always last", Oct 15) and on Oct 18 said it "stays as it is".
- **Front-runner** (4+0, "You always pick first in a round") and **Freelancer** (3+3, "pay any member's colored part in any colors"): in the "good set!" (Oct 14). Later: Front-runner "too cheap", Freelancer "maybe more expensive" (Oct 17).
- **Doppelganger** (3+2, "Recruit: becomes a copy of one of your members"): "really good, almost any build takes it" (Oct 15), "great, too cheap" (Oct 18).
- **Stunt Double** (2+2, "Recruit: copy the action you just took"): "one-time activate. Elegant." (Oct 18).
- **Impressionist** (2+2, "When you copy an action: +1 resource of its color"): "great" (Oct 18).
- **Treasurer** (4+0, "When recruited: gain gold equal to your member count"): "really good" (Oct 15 18:37).
- **Penny Pincher** (4+0, "Gold you spend on members counts double"): "good, could get a little crazy" (Oct 15 18:37).
- **Underdog** (5+3, "While anyone has more gold than you, your gold gains are doubled"): "likes it, interactive; stops mattering once you have a lot of gold" (Oct 15 18:09).
- **Rainmaker** (3+1, "Once per game: raise each of your colors to match your yellow"): "likes it, should cost more" (Oct 15 18:09).
- **Banker, Busker, Host** (round-start income): "they all kind of feel weak… except for scoring ones or passive income" (Oct 15). He wanted Busker cheaper, 1+3, "to play a little catch-up on green" (Oct 18).
- **Red keepers** (Oct 18): Host, Mentor & Protégé, Recruiter, Patriarch, Proselytizer, Mob. Volunteer "free, no effect", Twins "2 red", worth 2.
- **His own Red additions** (Oct 18, first draft of red-members): "When you trigger a member's On Recruit, gain one resource of that member's color" (Recruit Bonus), "When you move a player's member, they lose a follower" (Movement Penalty), "On Recruit: Promote or Demote a member" (Panel, which he then said "should do more" and gave 3 bodies). He confirmed Loyalists ("Your members can't be swapped", worth 2) and Mob at 5 bodies plus "+1 per red member", "should be expensive".
- **His own Green specs** (Oct 18): Chronicler rewritten to "+1 follower per green member" ("decenter currency collecting"); Muse as "a counter to a chaining player"; Agents ("Your actions can't be copied", worth 2); Bait (copiers lose 1 follower; a rival copier pays you 1).
- **Tax Collector**: kept, and he made it simpler: "from any rival buying followers, period" (Oct 15 18:37).
- **Retinue** (1+1, worth 3): "needs to be more members. More followers." (Oct 18). Night Owl "should be 2 followers" (Oct 17 #101). Feastmaker should become Chefs and "count as at least 2 members" (Oct 18).
- **Ideas of his own**: Launderer, "On recruit he lets you rearrange your money as you please" (Oct 18). Tonight: "you can always buy twice".

### Disliked or cut
- **Big Spender** (once a round, buy twice): "no, hard to make obvious in the UI" (Oct 15 18:09). Tonight he liked "you can always buy twice". Claude's read: the "once a round" part, a use you have to time and track, was what killed it, not the power.
- **Sleepwalker** (copies from last round): "too hard to track" (Oct 15).
- **Lender** (a debt): "a little too complicated to track" (Oct 15).
- **Mime** (green equal to the rival with the most): "doesn't love members that pay for themselves at once" (Oct 15), then cut (Oct 18).
- **Lottery Winner** (once: gold equal to the richest rival's): "doesn't like it" (Oct 15 18:37).
- **Hustler** (pick a color; actions there +1 gold per round): "bad, nothing players have to remember" (Oct 15 18:37). It can be read two ways. Claude's read: a pick you have to keep in your head is a strike against a card.
- **Banker at 4+4**: "too dear: barely pays for itself across a game" (Oct 15 18:37).
- **Tinker**: "way too strong" (Oct 15). He rewrote it as Alchemist.
- **Bookkeeper** ("at the end of your last turn each round…"): "bad; so many members need reworks" (Oct 18).
- **Overseer** (a rival takes an extra turn: gain half your purple, at most 4): "a little weird, doesn't fit" (Oct 17 #87), cut (Oct 18).
- **Ensemble** (copy a rival's space: +1 follower): scrapped. "too few spaces copy a rival's" (Oct 18), though he likes "a follower per copy".
- **Understudy**: cut as redundant: "we have Tribute Band and Stunt Double" (Oct 18).
- **Early Bird** (take the next ring's space): "too strong" (Oct 14). **"Activate: swap this with any member"**: "too strong" (Oct 18).
- **Claude's 8 neutrals**: "I don't like your neutrals. Esp ones where players interject out of order to play minions" (Oct 14).
- **Family** (worth 5, 2+2) and **Big Family** (worth 7, 3+3), his own: "actually maybe we drop family and big family" (Oct 18).
- **Too expensive**: 4 resources for a 2-follower member (Oct 12), Shift Crew and Clockmaker (Oct 14), Heir (Oct 16 and 17), Revelers (#21), Lamplighter (#100), Alchemist "8 is a lot".
- **Mechanics he dropped**: cost reductions (Planner, Underbidder, Sommelier, Reinvestor, Intro Offer; Oct 18), Release (Social Climber cut, Oct 17/18), the activated Gold members Broker and Climber (Oct 10), and Patron, Steward and Gambler, which went in without his okay (Oct 10).

### No strong verdict
Speculator, Merchant, Prospector, Tycoon ("maybe 1 follower per 2 gold"), Reseller ("yes, but Yellow-related and renamed"), Mentor & Protégé (kept, never praised; Claude's audit called it weak), Impostor, Connector (a Codex fill-in), and the remaining Silver, Purple, Yellow, White, Magenta and Blue cards.

## 2. What the liked ones share, and what the disliked ones share

**Length.** The liked cards are short. Extra Hand is 5 words, "you can always buy twice" 5, Loyalists 5, Panel 6, Chronicler 6, Front-runner 7, Stunt Double 7, Penny Pincher 8, Doppelganger 9, Freelancer 10, Recluse 11, Underdog 11, Treasurer 12, Squatter 13. Straggler, at about 20 words, is the longest he loves, and he cut a step out of it. The disliked ones run long, or have more than one step: Bookkeeper 19 words with an odd timing, Overseer a trigger plus a half plus a cap, Lender a debt, Night Owl's first wording "extremely confusing".

**When it pays.** Each liked card pays at one of five clear moments:
- on arrival: Doppelganger, Stunt Double, Treasurer, Panel, Mentor, Launderer;
- on your own turn, when you do the color's verb: Impressionist, Proselytizer, Recruiter, Penny Pincher;
- at round start: Banker, Busker, Host;
- at game end: Recluse, Mob, Chronicler, Patriarch;
- or always, as a standing rule: Front-runner, Freelancer, Extra Hand, Loyalists, Agents, buy twice.

The disliked ones pay on someone else's turn (Merchant, Stylist and Overseer, a +1 you only see in the log), at a moment players won't notice (Bookkeeper's "end of your last turn"), or across rounds (Sleepwalker, Lender). Every rival-turn trigger he kept is one he wrote himself as a counter or sting tied to an interaction verb: Muse, Bait, Movement Penalty, Tax Collector. A passive drip on rivals' turns never got a yes.

**Relative or fixed.** Scaling is not what makes a member land. Hustler (+1 gold per round number) and Lottery Winner (a rival's whole pile) both scale, and he disliked both. Recluse, which Claude's audit ranked 9th worst, and Underdog, a catch-up card the audit treated as weak, are the ones he loves: each opens a different way to win. Scaling is a secondary trait. Most liked payoffs do grow or scale, though:
- per rival: Recluse;
- per member: Treasurer, Host, Mob, Chronicler, Patriarch;
- doubling: Underdog, Penny Pincher;
- matching your own pile: Rainmaker.

A fixed payoff is liked only when it is steady and on your own turn (Banker, Busker, Impressionist's +1 on each copy). The two "equal to a rival's pile" one-shots, Mime and Lottery Winner, were both disliked. Claude's read: matching yourself is fine, copying a rival's lead is a swing that feels bad for the table.

**Bending a rule.** His warmest words go to members that bend exactly one base rule, in one direction:
- blocking: Squatter, Straggler;
- minion count: Extra Hand;
- turn order: Front-runner;
- payment: Freelancer, Penny Pincher, Launderer;
- the one-buy limit: "always buy twice";
- protection: Loyalists, Agents, Bodyguard.

None of them acts out of turn. Each one changes your own turn, or a standing rule about you.

**Nothing to remember.** A liked card has nothing to remember. "Once per round" is fine when the use happens on your turn, at a visible moment (Squatter, Straggler). A choice made on arrival and kept is fine (Doppelganger). Hidden state is not: last round (Sleepwalker), debts (Lender), a color you picked (Hustler).

**A plan, and different plans.** The liked cards tell you what to do next:
- stay lean and buy followers: Recluse;
- go wide in one color: Mob, Chronicler, Patriarch;
- turn gold into members: Penny Pincher;
- spend down on purpose: Underdog;
- buy it late: Treasurer.

Some of these plans pull against each other (Recluse against Mob), which is the "radically different cults" he asked for.

**Reading the table.** Recluse, Underdog, Impostor and Tax Collector read what rivals have. He accepts "interaction… even if it fades as you grow" (Underdog).

**Many builds.** The universal cards are the ones he calls strongest: Doppelganger ("almost any build"), Freelancer, Extra Hand, Front-runner, Launderer, buy twice. They are also the ones he says are underpriced.

**More bodies.** Cory pushes followers on members up, never down: Retinue "more members, more followers", Night Owl 2, Panel 3, Mob 5, Chefs at least 2, Twins 2 for 2, and his own Family and Big Family (worth 5 and 7 for 4 and 6, dropped "maybe"). The rule is his: "a member worth several followers counts as that many members" (Oct 18).

**One-shot or ongoing.** Both work. A one-shot he likes does something when it arrives (Stunt Double "elegant", Panel, Doppelganger, Launderer) or grows with when you buy it (Treasurer). A one-shot that refunds about its own price, flat (Mime), is "allowed, not loved". A once-per-game card that you trigger yourself is fine when it is the burst of its color (Tribute Band, Rainmaker), and disliked when it copies a rival's pile (Lottery Winner).

## 3. Principles for every new member

Each principle comes with its evidence.

0. **Feels good and fun to own, and different combinations play radically differently.** This is his principle zero (Oct 15 18:15). Evidence: Recluse against Mob, Penny Pincher against Underdog.
1. **Interesting but not complicated**, his rule tonight. As a test:
   - one trigger and one effect;
   - 12 words or fewer (a rule-bender up to about 20, if it's one moment);
   - no state carried between rounds, no counters, no debts, no pick to remember;
   - a player can say what it does this round without rereading it.

   "Interesting" means it changes a decision: what you buy, where you place, or whether you hold or spend. A bigger number is not interesting. Evidence: the word counts in section 2; Lender, Sleepwalker, Bookkeeper and Hustler against Extra Hand, Front-runner and Stunt Double.
2. **Works on a real table, and is easy to show, or it's out.** Players track everything themselves, "nothing remembers last round, no debts owed later". A choice is made on arrival and kept, and the card says what happens if it's stolen. Evidence: his Oct 15 18:12 principles; Big Spender ("hard to make obvious in the UI").
3. **Pays at one clear moment of your own**: on arrival, on your turn, at round start, at game end, or always. A rival-turn trigger only as a deliberate counter or a mild sting tied to an interaction verb, never as a +1 drip. Evidence: Muse, Bait, Movement Penalty and Tax Collector against Merchant, Stylist and Overseer.
4. **Opens a different way to win, and this ranks above every other trait except principle 1.** A member should make a cult that plays radically differently, including against the grain: stay lean, spend down, go wide in one color. Evidence: Recluse ("I love this one a lot"; Claude's audit ranked it 9th worst), Underdog ("likes it, interactive"; the audit treated catch-up as weak), Penny Pincher, Mob against Recluse, his principle zero.
5. **Relative or growing beats small and fixed, as a secondary trait.** Count members, rivals, rounds, or double something; a fixed amount is fine when it's steady and on your own turn. Scaling alone doesn't make a member good: Hustler and Lottery Winner both scale, and he disliked both. Evidence: "Everything should feel vaguely powerful… relative amounts beat small fixed numbers" (Oct 9); "they all kind of feel weak… except scoring ones or passive income".
6. **Rule-benders bend one base rule, on your own turn or as a standing rule, and are priced for their round-III power.** Never out of turn. Evidence: the "good set!"; Squatter, Extra Hand, Straggler, "always buy twice"; against the neutral batch (rejected for out-of-turn placement) and Early Bird (too strong).
7. **Members are where followers come from, so bodies are generous.** A plain body costs about one resource per follower or a little less, and each color has two or three members worth 2 or more. Evidence: Twins 2 for 2, Volunteer 0, Retinue "more followers", Panel 3, Mob 5, the Oct 20 economy call.
8. **A member lives where its idea lives, and the best ones are the color's own verb on a card.** The arrival card that performs the color's action once is a signature shape (Panel: Promote or Demote; Stunt Double: copy; Mentor & Protégé: Open Door). So is the own-turn trigger on the color's verb (Recruiter and Proselytizer on recruits, Impressionist on copies). Never name another color. Evidence: Oct 15 18:12; "one-time activate. Elegant."
9. **Pays for itself visibly in the build that wants it.** Price quiet cards low and universal benders high. Arrival payoffs are "allowed, not loved": an arrival that does something, or grows with when you buy it, beats a flat refund. Evidence for pricing: his price notes run one way for quiet cards ("too dear": Banker, Heir, Revelers, Lamplighter, Shift Crew, Clockmaker) and the other way for strong, universal cards ("too cheap": Doppelganger, Rainmaker, Front-runner, Freelancer, Extra Hand). Evidence for arrivals: Treasurer and Stunt Double against Mime.
10. **Distinct inside its deck, and built only on live rules.** No template at three prices, no cost reductions, no Release, no on/off switches, no rescue clauses, and no payoff that depends on a certain color showing up in the shop. Evidence: "slight variations" rejected (Oct 15 18:20); cost cuts and Release dropped (Oct 18); "taking a space you can't use is on you" (Oct 14).
11. **Stands alone.** A member must be good without any one other card, and combos are a bonus. The card you want is "usually bought before your turn comes back" (Oct 14), and a player buys perhaps six to eight members a game (Claude's read from about 12 buys), so no plan can depend on seeing a particular card. Evidence: "fitting many builds is a plus"; Doppelganger.
12. **Harm stays mild.** A sting costs about a follower or a few resources. Member loss before round III only in the shapes he chose himself (Shake Down, Double Agent). Evidence: "not CRAZY bad, like straight up losing a member" (Oct 15 17:52); Movement Penalty and Bait at 1 follower.

## 4. What a good 10-card color deck looks like

His Oct 15 set: "one or two quiet members feeding the theme, a rule-bender, one that plays off rivals, an end-game scorer". His additions: "varying costs (maybe 1–10 in each sphere)", "some give extra followers, some extra scoring conditions, some are activatable, some combine these", and no explicit types; the mix is judged across the deck, not card by card.

What the two decks he approved actually contain (12 each; the cull deals 10):

| Kind | Red | Green |
|---|---|---|
| Plain bodies | Volunteer 0 (f1), Twins 2 (f2) | none |
| Defense rule-bender, 2 bodies | Loyalists 2+3 | Agents 1+2 |
| Income on your turn or at round start | Recruiter 3+1, Recruit Bonus 2+2, Host 4+2 | Busker 1+3, Impressionist 2+2, Connector 4+2 |
| Followers from the verb | Proselytizer 4+2 | Ensemble 3+3 |
| The color's action on arrival | Panel 4+2 (f3), Mentor & Protégé 5+3 | Stunt Double 2+2 |
| Copies a member (any build) | none | Doppelganger 3+2, Impostor 4+2 |
| Plays off rivals | Movement Penalty 3+2 | Bait 3+2, Muse 2+2 |
| Game-end scorer | Patriarch 3+2 | Chronicler 2+3 |
| Top card | Mob 6+4 (f5, scorer) | Tribute Band 8+2 (once-a-game burst) |

Prices: Red runs 0, 2, 4, 4, 5, 5, 5, 6, 6, 6, 8, 10; Green 3, 4, 4, 4, 4, 5, 5, 5, 6, 6, 6, 10. Both centre on 5. Printed followers: Red 20 across 12 cards (4 multi-body), Green 13 (1 multi-body). Green came before the Oct 20 "members are where followers come from" call; Red is the better model for bodies.

**The shape to aim for** (Claude's read from both decks):
- 1 cheap body, 0–2, worth 1–2;
- 1 defense or rule-bender worth 2, about 3–5, paid mostly in "any";
- 2 own-turn or round-start income cards on the color's verb, 3–6, at least one of them growing (per member, per round);
- 1 card that does the color's action on arrival, 4–6, ideally with extra bodies (Panel);
- 1 card that plays off rivals: a counter or a 1-follower sting, 4–5;
- 1 game-end scorer, 4–5, paid mostly in "any" so other builds can splash it;
- 1 card that fits any build (a Doppelganger-like or a base-rule bender), priced high for its color;
- 1 top card at 8–10 that is the color's capstone, worth at least its cost in followers inside its build (Mob: 10 for 5 + 5 or more);
- 1 open slot.

On the price split: the color's engine cards lean colored (Mob 6+4, Host 4+2). Catch-up, defense and scorer cards lean "any" (Busker 1+3, Chronicler 2+3, Loyalists 2+3, Agents 1+2), so other builds can buy them.

**Neutral members** follow the same principles. On top of that, a neutral card's cost has no colored part, since "neutral cards stay neutral" (Oct 18). The live guests still print lean colored parts (Front-runner 4+0, Extra Hand 6+3), a docs-versus-code gap to flag, not fix. Neutrals are the natural home for single-rule benders that fit any build.

**Pricing rules of thumb** (Claude's fill-in, checked against his notes):
- plain body: about 1 resource per follower or a little under;
- ability card worth 1: cost 3–6, earning a clear +1 to +3 net in its build over a game bought in round I–II;
- rule-bender: 4–9, scaled to what it does in round III (Front-runner 4, Straggler 5, Freelancer 6, Squatter 7, Extra Hand 9);
- capstone: 8–10, under the ceiling of 10.

When unsure, err cheaper for quiet cards and dearer for universal ones. That is the direction every one of his price notes went.

## 5. Claude's recurring mistakes in member pitches

1. **Small "+1 when…" drips and one template at several prices.** Merchant, Stylist, Groupie, Middleman, Recruiter, Reseller, Choir, Overseer. Payoffs too small to see, often on rivals' turns, and cards that vary each other. Cory: members "all kind of feel weak", "slight variations" are out, Overseer "weird, doesn't fit".
2. **Complexity and tracking.** Sleepwalker (memory), Lender (debt), Bookkeeper (an odd moment), Big Spender (a once-a-round use that's hard to show), Night Owl's first wording, rescue clauses ("if you can't…"), and out-of-turn interjections (Line Cutter, Doorman). Each failed "works on a real table" or "easy to show".
3. **Building on mechanics he dropped, or on luck in the shop.** Cost reductions (Planner, Underbidder, Sommelier, Reinvestor), Release (Social Climber), on/off switches, and Blue cards that pay only if blue members happen to show up. Also narrow sets: every card in a deck chasing one verb ("not thinking broadly enough", Oct 18), and a neutral batch that was eight versions of one mold.
4. **Miscalibrated power and price.** Two failures:
   - Pricing quiet cards from bot fair-value so they land too dear (Banker 8, Heir, Revelers, Lamplighter), while underpricing the universal ones (Doppelganger, Front-runner, Freelancer).
   - Pitching at the wrong level: access or information with no power ("dig… so weak"), or a flat gain far above its round ("cash in… like +10 blue", Tinker "way too strong", Early Bird).

   A related trap: trusting Claude's own audits over his words. member-feel.md ranked Recluse 9th worst and treated Underdog-style catch-up as weak; he loves both. It praised scaling, yet he disliked Hustler and Lottery Winner, which both scale. Cite only his quotes as taste, and judge a card first by the different way to win it opens.

## Added 2026-10-21 (Cory on the neutral prices)
- Spread prices wide. "Everything is roughly the same cost" is a flaw on its own: a row should hold a cheap pickup and a big buy. Guests run 3 to 9, and only a truly big effect (an extra minion) sits at the top.
- Our prices run a little high. Start a notch cheaper than the sum-of-parts math says, except where a card can swing contests on the last buy (Launderer).
