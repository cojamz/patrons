# Guest members (the neutrals): two sets

Rework panel, 2026-10-21 overnight, guest-members seat. Members only. No sims, no games, no code.
**All card texts and numbers are Claude's fill-ins, not approved.** Live texts are quoted from src/engine/v4/content/benders.js; the live guest prices are Cory's calls.

## 0. What the guests are, and what going colorless changes

- **Their job.** The guests are the only members at every table (2p Gold+Red included), the only ones nobody needs a color to buy, and the base game's rule-benders: space (Squatter), placement (Straggler), minion count (Extra Hand), turn order (Front-runner), paying for members (Freelancer). Cory's words for the shape: "good set!", Squatter "really great", Straggler "really likes", Extra Hand "SUPER strong". Every one is short, bends one rule, and works on your own turn or as a standing rule. His one hard no for this group: out-of-turn placement ("I don't like your neutrals").
- **What colorless changes: almost nothing on Classic tables.** Each guest's colored part is in a lean color (Squatter magenta, Freelancer yellow, the other three purple). None of those colors sits at a Classic table (gold, red, blue market, green echo), and the engine already lets you pay a missing color's part in any colors (core.js `colorPartFree`). So on every Classic table the five guests were already all-any, and Cory set their prices on those tables. Colorless changes things only at tables with magenta, purple or yellow, where the gate was real (Extra Hand's 6 purple most of all) and where the guests also counted toward those colors' member contests.
- **Pricing rule I used.** Where Cory set a guest's number himself recently, keep it at the same total in "any". Raise only where he said the card was too cheap. All followers stay 1: rule-benders earn their keep from the rule, and going colorless is already a small buff at non-Classic tables.
- **"You can always buy twice": Blue, not a guest.** Three reasons. Cory's own rule (Oct 15): "buying more than once Red or Blue". As a guest it would sit at every 2p Gold+Red table, where nothing else sells extra buys, and wherever Blue is present it would turn Blue's round II space "This turn you buy twice" into a copy of a member. And the guest cousin, Big Spender ("once per round, buy twice"), already got a no. It belongs at the top of Blue's deck, near the ceiling.

## 1. The live guests: keep, reprice or rewrite

| Live card | Live text (short) | Call | Price, all any | Why |
|---|---|---|---|---|
| Squatter 5+2 | "Once per round: place a minion on a space a rival already took" | keep | 7 | His latest call was "a little cheaper" (8 to 7, Oct 17), made *after* "maybe TOO strong in round III" (Oct 15). Already all-any on Classic. If round III still feels too strong, the fix is the text, not the price (option in section 4), because the problem is joining the round III space (a free member up to 10, a rival's best member), not the card's cost. |
| Freelancer 3+3 | "pay any member's colored part in any colors" | reprice | 7 | Since Oct 20 the colored part is the gate on every member (+1 of a color per action), so dodging it is worth more than when it was priced at 6. Cory: "maybe more expensive". It loses its 3-yellow gate at non-Classic tables. |
| Extra Hand 6+3 | "+1 minion in round III" | keep | 9 | "make it cost 9", then "Probably fine". Its strength is the last buy of the game (it can turn up to 10 resources that would die into followers). Flag: at non-Classic tables it loses a 6-purple gate, the biggest in the group; if it ends up in every winner's cult, 10 (the ceiling) is the next step. |
| Front-runner 4+0 | "You always pick first in a round" | reprice | 6 | "too cheap" twice (#11, Oct 17). The follower leader normally picks last, so this card is worth most to the leader: first choice of the round III spaces (the best of N, a few resources better than the last) plus the double turn at the snake's turn. Round I order is random anyway. About 1 / 2 / 3 by round if bought early. At 6 it's a round II buy, not a round I steal. Flag: it leans win-more, and it cuts against the trailer-picks-first catch-up. |
| Straggler 4+1 | "after the last minion is placed: your last minion may move to an unused space and do that action" | keep | 5 | His own card; "stays as it is" (Oct 18). No space is free in round I at a full table, so it pays in rounds II and III (about 2.5 and 3.5). 5 is right. |

Big Spender, Insider and Early Bird stay cut (hard to show; the pile is Blue's now; too strong).

## 2. Seeds (went wide first; one line each)

| # | Seed | Rule it bends / angle | Fate |
|---|---|---|---|
| 1 | Launderer (Cory's): "When recruited: change the colors of your resources as you like" | your pile's colors (holding) | **kept, both sets** |
| 2 | Tiebreaker: "You win every contest you tie for" | the contest (holding, rivals) | **kept, set B** |
| 3 | Spendthrift: "Round end: if you hold no resources, +3 followers" | spending, a contrarian plan | **kept, set B** |
| 4 | Nest Egg: "Game end: +1 follower per 2 resources you hold" | leftovers die | cut: Tycoon ("+1 per 2 gold") and Kingpin in any color; a variation |
| 5 | Long Shot: "Round start: if you have fewer followers than every rival, +1 minion" | catch-up (tempo) | cut: Extra Hand with a condition (a sibling variation), and it rewards sitting on resources to stay last |
| 6 | Any-size packs: "Your follower buys can be any amount up to 10" | the 1/5/10 packs | cut: a convenience, not a decision; feeds buy-followers-only |
| 7 | Always buy twice | the one buy | moved to Blue (section 0) |
| 8 | "Counts as a member of every color" | a member's color | cut: breaks "neutral cards stay neutral" (Oct 18), the exact thing being fixed tonight |
| 9 | "You may buy before you place" | turn order inside a turn | cut: small, hard to see on screen |
| 10 | "Game end: +2 followers per rival with more followers than you" | catch-up, the follower race | cut: Recluse on another axis (a variation of a live card) |
| 11 | "Rivals can't join or move onto your spaces" | space, a counter | cut: counters only Squatter and Straggler, which won't always be dealt |
| 12 | "Recruit from the outgoing row at round start" | the shop | cut: a buy out of turn, and the shop and pile are Blue's |
| 13 | What would the table miss without guests? | — | The only tempo and space play beyond the snake at 2p Gold+Red; the only members a player whose colors miss the row can buy; the only game-to-game variety at 2p, where every colored card shows every game. This argues for keeping the space and minion benders and for a pool bigger than one game's draw (set B). |

## 3. The two sets

### Set A: a fixed cast, one rule each (6 guests, all dealt every game)

**Thesis.** The guests are the rulebook's exceptions and nothing else: a small, known cast at every table, each bending one base rule, so a player learns them once. Add only Cory's Launderer.

| Card | Text | Cost (any) | Followers | Why that price |
|---|---|---|---|---|
| Launderer (new, Cory's idea) | When recruited: change the colors of your resources as you like. | 4 | 1 | A one-shot you time. Its peak is your last buy of a round: pour what you hold into a contest you can win (up to 6 in round III, where leftovers would die anyway), dodge a half-a-stack theft, or line up a big colored part for next turn. Worth about a round II space plus the body, and it competes with a pack on the turn you buy it. Red re-fires it when it moves (Cory's Oct 18 rule), which is fine at 4. |
| Straggler | live text | 5 | 1 | see section 1 |
| Front-runner | live text | 6 | 1 | see section 1 |
| Squatter | live text | 7 | 1 | see section 1 |
| Freelancer | live text | 7 | 1 | see section 1 |
| Extra Hand | live text | 9 | 1 | see section 1 |

Prices run 4, 5, 6, 7, 7, 9: one round I buy, then rule-benders priced for their round III power. Deck share: 6 of 28 at 2p (21%), 6 of 50 at 4p (12%).

**Self-critique (A).**
- Specialist: there is no guest specialist. Anyone with 5–9 spare resources picks the bender that fits their plan. Launderer gives a hoarder a late contest snipe and a magenta table a theft dodge.
- Rival: Squatter and Front-runner are the ones you feel. Being joined on the round III space, or watching the leader keep the first pick, stings. That's mild, and it's the card's point.
- Newcomer: six cards, each one line. Launderer is the only "when recruited" card, and the screen can show the recolor as a pay-sheet-style picker.
- 2p: all six show every game (the deck cycles), so the same six cards make up a fifth of every 2p game. Front-runner and Squatter hit hardest there: with 2 round III spaces, first pick or a joined space decides the round.
- 4p: about 5 of 6 show, each about once.
- Cory, rubric v3: the live five pass (his own verdicts). Launderer is his idea and a timed one-shot (rule 19: lean yes). Expect "fine" on the two reprices and maybe his own number for Front-runner. Predicted: yes, about 70%.
- Weakest card: Front-runner. It leans win-more and he called it "not important". Kept because it's in his "good set", and he asked only for a price.
- Gap: nothing here touches the core tension of holding versus spending, except Launderer once.

### Set B: a rotating pool of rules and plans (8 guests, 5 dealt a game)

**Thesis.** Keep set A whole, and add two guests that pull Cory's core tension (holding versus spending, Oct 20) in opposite directions, so a guest can also be a plan any cult can take. Deal 5 of the 8 each game, the way the cull deals 10 of a color's cards, so the guests vary between games without growing their share of the deck.

Set A's six, at A's prices, plus:

| Card | Text | Cost (any) | Followers | Why that price |
|---|---|---|---|---|
| Tiebreaker | You win every contest you tie for. | 5 | 1 | Under +1-per-action incomes, color piles are small and ties are common, worst in round I and at 2p. Each tie you're in turns your half prize into the whole prize and takes the tied rival's half (+1 / +2 / +3 for you, the same off them, by round). Guess: 3–4 for you over a game, more if you hold to *match* the leader rather than beat them. That's the decision it changes. It's interaction through the board with a mild sting, and it isn't win-more (anyone tied can use it). Edge rule for the engine, not the card: if two tied players both have it (a copy), split as usual. |
| Spendthrift | Round end: if you hold no resources, +3 followers. | 6 | 1 | The opposite plan to hoarding: skip the contests and land exactly on zero each round. Packs come in 1/5/10, so hitting zero usually means buying a member at the right cost, which pushes toward members (the Oct 20 frame). Bought in round I it often pays at once, since you spent everything to buy it. Guess: about 2 of 3 rounds hit, so 6–9 followers on 6 if bought early, about 1.3. That's why it costs 6, not 4. Late it's weak, and that's fine: it's a plan you commit to. Round III asks a real question: hold a small pile for the 6 contest, or empty out for +3. Magenta finds nothing to steal from you. |

Deal 5 of 8: at 2p the share stays 19% (5 of 27), at 4p 10%. A given guest is in about 62% of games (5/8), and shows in roughly 62% (2p) or 52% (4p) of games. That answers Cory's "it's good not to assume a player will be able to see/buy all": at 2p, where every colored card shows every game (deck-visibility.md), the guest draw is the only thing that varies.

**Why 8, not 5 or 10** (the size call). Five dealt is the right *density*: guests are the most universal and most underpriced cards in the game (every "too cheap" note is on a universal card), and at 2p everyone sees all of them, so more than about 5 a game turns the 2p deck into a guest deck (8 dealt would be 27% of it, almost 2 in every row). The *pool* should be bigger than the draw, for variety. I stopped at 8 because that's how many base rules I could find worth bending without a variation, an out-of-turn move or another color's verb (section 2 shows the rest failing). Ten would mean filler, and each guest would be in only half the games, which makes them harder to learn. Cory floated "10 neutral" on Oct 15 and said he'd design them himself. This leaves him two open slots.

**Self-critique (B).**
- Specialist: still none, which is right for guests. But a player dealt Spendthrift or Tiebreaker now has a colorless plan to steer by (spend to zero, or hold just enough), not only a better turn.
- Rival: Tiebreaker stings at round end (you lose a half prize you thought you had), and you can see the card in their cult. Spendthrift is invisible to rivals except that Magenta can't steal from an empty pile.
- Newcomer: five guests a game, same as now. Both new cards are one condition at one moment, read at round end with the contests.
- 2p: Tiebreaker is strongest here (2-player ties are common), and 5 is about right. Spendthrift is the same at any size.
- 4p: Tiebreaker's ties spread over 4 contests, so it's a bit weaker. Spendthrift is unchanged.
- Cory, rubric v3: Tiebreaker is simple, visible and interactive (rules 8, 12): about 60%. Spendthrift opens a contrarian cult (rule 16, his Recluse love): about 50%. The risk is that it reads as a scorer that helps buy-followers-only. Dealing 5 of 8 is a deck rule (rule 15, "not now" risk): about 50%. Overall: yes with changes.
- Weakest card: Spendthrift. It nudges the buy-followers-only rate up (a packs-only player can still land on zero), and "+3" is a fixed number he may retune. Kept because it's the only card on the board that pays you for *not* holding, the mirror of every held-resource contest, and it shows in only about half of games.

## 4. Recommendation

**Set B.** It contains set A, so nothing is wasted if he says no to the dealing rule. Then A ships plus Tiebreaker, as 7 always in. B answers his deck-visibility question with a rule the game already uses for colors, keeps every guest he loves at his numbers, and adds two one-line cards that work on the hold-versus-spend tension he named on Oct 20.

Picks for Cory (default in brackets):
1. Guests as a pool of 8 with 5 dealt each game, like the color cull [yes; else all in].
2. Front-runner 6 and Freelancer 7; Squatter 7, Extra Hand 9 and Straggler 5 unchanged [yes].
3. Launderer, "When recruited: change the colors of your resources as you like", 4 [yes].
4. Tiebreaker, "You win every contest you tie for", 5 [yes].
5. Spendthrift, "Round end: if you hold no resources, +3 followers", 6 [yes, his number].
6. "You can always buy twice" goes to Blue's deck, not the guests [Blue].
7. Only if Squatter still feels too strong in round III after this: "…on a space a rival already took, not a round III space" [no for now].
