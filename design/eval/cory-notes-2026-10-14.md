# Cory's first play (2026-10-14): diagnoses and solves

Each note gets an agent that plays it, writes its own diagnosis, weighs options and ships a fix for Cory to judge by playing. One section per note; each agent appends to its own section only.
Format per section: what Cory saw · diagnosis (root cause, not symptom) · the agent's own feedback (agree/disagree, what else it found) · options considered · what shipped and how it was measured.

## 1. Purple: Linger is bad, Rally wastes a worker, "most workers" always ties, purple dead at end of round III (Purple agent)
*Purple agent. I played Purple myself, driving one seat from a script and reading the log, in four games: one on today's rules (gold/red/purple/magenta), one on my first proposal, and two on the shipped rework (gold/red/purple/magenta and gold/purple/green/yellow). On top of that I ran bot sims, and each number names its instrument.*

**What Cory saw.**
- Linger is "just bad".
- Rally "makes no sense, basically wasting a worker", and Overtime has the same problem.
- "Most workers on the board" almost always ties, so it's really "most purple".
- Clockmaker costs too much, and purple is worth nothing at the end of round III.

**Diagnosis (root causes).**
- **A turn-for-a-turn space is a wasted worker.** An extra turn here is one more placement plus one more buy. A space whose only effect is "take an extra turn" hands back exactly the placement it used, so the net gain is one buy, minus the purple paid. That's Rally, and it's Overtime. The old sims hid it because the players who could pay were the purple-rich ones, so taker win rates looked healthy (Overtime 30%, Easy bots, today's rules, 300 random tables). Rally's takers won 21%, the lowest on the board.
- **Linger is less than nothing.** Moving a worker to an open space and doing that action is the same as placing on that space. On top of that you've given up Linger itself and reopened your old space for a rival. It also does nothing when all your workers are on Purple, which happened to me in my first game ("Me has no worker to move").
- **"Most workers" can't break ties.** Every player gets the same 3/4/5 workers, and at 4 players every round-I space fills. The spare-space rule then makes extra turns impossible in round I. So the tiebreak (most purple) was the real rule. Easy bots, today's rules: round I never had a unique leader on workers. With "ties score nothing", Purple's ring paid nobody in 100% of round Is, 77% of round IIs and 60% of round IIIs.
- **Dead purple.** Round-end payouts land after the last buy. Clockmaker was already fixed; Bookkeeper had the same problem.
- **Bot blind spot (new).** The normal bot (the default opponent) scores a placement by trying it on a copy of the game whose turn queue is empty, so it can't see an extra turn. Probe, round III, a normal bot holding 10 purple: Rally scored −9.6 and Overtime −8.7, both below Hourly at −1.5. So bots never took a turn from a space; they used Rally and Overtime only for the fallback purple. That's what Cory played against. After my report, bots.js now counts the turns a move queues (committed 2026-10-14 as "bots value extra turns").

**My feedback.**
- I agree with all four notes, and the first two are one bug: a turn that costs a turn.
- I also disagree with my own earlier gut call. "Ties score nothing" doesn't fix the contest. It switches round I off at 4 players and pays only whoever bought turns, which snowballs.
- The design critic said the same, and I took its fix: name the rule for what it already measured, most purple. That's simple and visible. It turns Overtime and Rally into a spend-or-hold choice, and it gives purple left at the end of round III a use (+6).
- Also found:
  - Normal bots ignore Purple's tempo (above).
  - Overseer, Foreman, Courier and Apprentice fire once per extra turn, so multi-turn spaces fire them 2–3 times. Priced below.
  - Plan Ahead is a juicy chip for Echo. A copy gives the taker's printed gain, which is +6 or +8 when it's taken first in a round. One of my games saw it copied four times. If that feels off, look at Echo's copy rule.
  - A crash outside Purple: Straggler (benders.js:75) is handed a stale joined worker. It crashed the member-value sim, so I reported it.

**Options considered.**
1. Cheaper turns (Rally 3, Overtime 4). Rejected: it's still a worker for a worker, so the feel doesn't change.
2. A free extra turn plus a payout (e.g. "+3 purple and an extra turn"). Rejected: a free turn is worth a whole space plus a buy, it's too strong, and purple loses its sink.
3. Spaces that bend timing without adding workers: Sleep In ("+2 per worker left, your turns go last"; precedent: Lords of Waterdeep's Harbor) and Hurry ("+3, place your next worker now"). The foreman, reading as Cory, called Sleep In fiddly timing, and the critic cut Hurry. Plan Ahead keeps Sleep In's payout without the delay.
4. Shipped: two-for-one Overtime, all-in Rally, Plan Ahead, most purple, Bookkeeper on your last placement.
5. Bolder: purple as time itself. On a Purple table, anyone may pay 5 purple in a buy step for an extra turn, and every Purple space just gathers. It's cleanest for identity, but it needs a core hook for buy options, so it's parked for Cory. The critic's note for later: if turn chains still feel bad, the precedent is permanent workers (Agricola's family growth), but don't pair that with a most-workers ring.
6. Other scoring rules measured: ties go to fewer followers (a catch-up ring, not Purple's identity), and most workers on Purple's spaces.

**Shipped and measured** (code: content/purple.js; tests: spheres/purple.test.js, cards-purple.test.js and the Purple cases in interactions.test.js). Main instrument: easy bots, 300 games each at 4 players, on seeded random tables of Purple plus three other spheres. "Takers" means players who took that space at least once; 25% is par.
1. **Ring: "Most purple"** (ties all score).
   - Today it was most purple in all but name.
   - "Ties score nothing" on the new spaces paid nobody in 100% / 69% / 40% of rounds I / II / III.
   - "Most purple" paid nobody in 7% / 9% / 15% (no one held purple).
2. **Plan Ahead** replaces Linger: "+2 purple per worker you have left to place this round." Takers won 27% (Linger 30%, but Linger was taken every round as filler).
3. **Overtime:** "Pay 8 purple: take 2 extra turns right after this one. If you can't, +3 purple." Takers won 26% at 8 and 29% at 6. Kept at 8, which is 4 a turn, the same rate as Rally.
4. **Rally:** "Spend all your purple: 1 extra turn right after this one per 4 spent, plus 1 (up to 3). With less than 4, +4 purple."
   - Takers won 37%, against Strike 33%, Jubilee 37%, Boom 39% and Eternity 37%. Today's Rally was 21%.
   - The critic's version without the "plus 1" came out at 28%. But at 4–7 purple it buys one worker for one, which is Cory's complaint, so I kept the plus 1.
   - Double Time makes it 1 per 2.
5. **Bookkeeper:** "When you place your last worker of a round, +1 purple per 2 workers you have on the board."
   - It pays before that turn's buy, so round III's purple isn't dead.
   - The critic's "+1 per worker" version measured 8.4 followers and a 57% win rate. Purple landing just before round end decides the ring.
   - Halved, it measured 5.0 and 44%, and the cost stays 6. Instrument: the member-value sim, Easy bots, 160 games; Banker read 3.0 in the same run.
- Whole table: 3.2 extra turns a game (0.96 today). Wins by seat 28/25/26/21%. Followers 37.3 (37.1). The player who placed most on Purple won 31% (28%).
- Dead air: one player places 4+ times in a row in 57% of games (3% today). The longest run averages 3.6 (2.35). That's the burst; it's the thing to feel for when playing.
- Normal bots, after the extra-turn fix: 1.3 extra turns a game against 0.5 before, and Purple's share of placements 26% against 22% (30 games each, too few for win rates).
- Members (member-value sim, Easy bots, handed over at the start of round II, 160 games each, ±1.5; Banker, cost 4, reads 2.7):
  - The per-turn triggers now fire 2–3 times a turn: Apprentice (cost 4) 4.4, Taskmaster (8) 4.2, Overseer (6) 2.9, Foreman (6) 2.8, Courier (6) 2.2, Double Time (8) 2.1.
  - By Banker's yardstick, Apprentice looks cheap and Double Time looks dear. That's one noisy run, so I handed it to the fair-price screen (section 4) instead of repricing here.

## 2. White: Pawn can't sell in round I, Cash In vs Magnate redundant, Cash In too strong (White agent)
## 3. Green needs tweaking as a whole (Green agent)
## 4. Members miscosted: Feast Hall weak, Shift Crew and Clockmaker too expensive (fair-price screen + dead-window audit)
## 5. Too hard to tell what's going on; board overwhelming; paying is complicated and not tactile (UX solver, then UI agent)
*UX solver. I played two full 4-player games on `?table=gold,thieves,echo,silver`: the frozen build (5192) at 1270×700, then HEAD (5193, Cults, shop of 10, no contest strip) at 1270×700 and on an iPhone 13 by touch. I took frame bursts after every bot turn. I judged by sight and measured with the DOM. Shots are in `design/eval/ux-shots/`. The specs below are for the UI agent. Nothing here is built yet.*

Three calls for Cory:
1. (a) **One place tells each turn.** A rival's turn builds up line by line on a single turn card, then folds into a tappable chip. The caption, ticker and "last move" tags go.
2. (b) **Ship mock A, fixed and never spun.** Every open space prints what it does. Rings that aren't open yet shrink into the hub. Each quadrant's rule and leader sit on its rim. The side list, tabs and spinning go.
3. (c) **Pay with coins, not a form.** Tapping a buy drops the suggested coins into the cost slots. Tap a coin to swap it, then tap Pay. That's two taps (one if there's only one way to pay). The steppers, chips and modal go.

### (a) "Still too hard to tell what's going on." Recommendation: one turn card per rival turn, then a chip.
**What I saw.**
- A bot turn is 3–5 steps in about 2–3 s: place, effect, choice, pay, recruit. Each step reports in a different place: the caption over the wheel, the ring and rim arrow on the space, "last move" tags on the player cards, gift floaters, the header ticker, and the card flying to its new owner.
- In `a1-laptop-bot-turn-fragments.png`, P3 takes Gift, and every surface tells a different piece:
  - the caption says "+2 silver";
  - P3's card says "+2 green";
  - every other card, mine included, says "last move +1 green", which reads as if *I* moved;
  - the ticker says "everyone else gains 1 green (P3 took 2 green and)."
  - Nothing states the whole move.
- The ticker shows the latest log line, not the latest move. Within about 1 s, bookkeeping lines ("P2 passed.", "P2's Evergreen: +3 green.") overwrite the turn's headline (`a2-laptop-bot-turns-burst.png`).
- On the phone, opponents are a one-line score bar, so card flights and gift tags land on nothing. Only the caption and the ring survive (`a3-phone-bot-turns-burst.png`).
- Snake order is invisible. "Your turn again (snake order)" comes as a surprise (`a4-laptop-snake-surprise.png`).
- The log has broken copy: "(P2 took 2 green and)". "P1 stole 2 (2 from P4)" names no color (`a5-laptop-log-wording.png`).

**Root cause.** The UI has no unit called "a turn" and no single place to look. It reports log lines and state diffs wherever their data lives, so the player has to assemble a turn from five places while it is still moving.

**My take.** I agree with Cory, and the phone is worse. The pacing is fine (600 ms per step); where things appear is broken. The round-end card and the final results are clear: keep them.

**Options.**
1. **History strip** of one tile per play, tap for detail (Hearthstone). Great afterwards, but weak while the turn is happening.
2. **Turn card in a fixed spot** that builds line by line, then folds into a tile (Hearthstone's history plus Balatro's one-cause-at-a-time counting). It covers both during and after the turn.
3. **Step-through:** bots wait for a tap after each turn (BGA's "replay last moves"; Into the Breach's ordered preview). Clear, but slow at about 36 bot turns a game.
4. **The camera visits each action,** panning or zooming (Wingspan digital). It fights the fixed board in (b).

**Pick:** 2, plus 3 as a setting ("Pause after each rival turn", off by default).

**Spec.**
- **Player row.** It runs in turn order and shows the snake: `P2 P3 P4 you │ you P4 P3 P2`. The seat to act is lifted, and the next seat is marked "next".
- **Turn card position.** One card slot sits under the player row. On the laptop it is 320 px wide, over the board's top-left corner. On the phone it spans the full width under the row, at most 3 lines.
- **The card builds line by line,** each line held for 600 ms:
  - "P3 · Gift: +2 ● silver, +2 ● green", while the worker flies from P3's pill to the space;
  - "everyone else +1 ● green (you +1)";
  - "recruited Evergreen 1★", while the card flies into this line.
  - It holds 900 ms, then shrinks into a chip in "Since your turn".
- **Coins and counts.** Resource coins fly from the space to the actor's pill, and to yours for gifts and steals. The digits count up (the ≥3-value gate already exists).
- **Card lines come from a per-turn diff** of resources, followers and members before and after the actor's turn, not from log lines. A line that changed your holdings gets a green or red edge and the word "you".
- **Chips** read like "P3 Gift +2●+2● · Evergreen". A tap or long-press reopens the turn card. They clear when your next turn ends. After 6 chips, older ones collapse into "+N more".
- **Your own turn** uses the same card (rubric check C2), e.g. "Rush: +2 ● gold".
- **Log copy:** no dangling "and)". Steals name their colors: "took 1 ● silver, 1 ● green from P4".
- **e2e assertions:**
  - After every rival turn at Normal pace, `.turn-card[data-pid]` is visible for ≥1.5 s, and its text has the space name and every non-zero resource delta of that turn.
  - There is one `.since-chip` per rival turn since your last, and chips with your deltas carry `data-you`.
  - At 390×664, the turn card's box is inside the viewport throughout bot turns.
  - `.caption`, `.ticker` and the "last move" tags are absent.
  - No log line matches `/ and\)\.$/`.

### (b) "The board is so overwhelming: the number of spaces and having to hover over them all." Recommendation: ship mock A, fixed, with B's rule-and-leader moved onto the rim.
**What I saw.**
- **Round I.** The board draws 24 spaces, and 12 of them are locked, dashed and meaningless. Each open space carries one 12 px word on a curve ("Joint", "Silver"), and what it does is only in a hover card (`b3-laptop-hover-to-read.png`). The side list shows one quadrant at a time and hides half its rows behind "More below" (`b1-laptop-r1-board-and-list.png`). Reading the 12 open spaces takes 12 hovers, or 4 tabs plus scrolling.
- **Later rounds.** By round III there are 21 open spaces, and the inner names run vertically ("Heist", "Jubilee"; `b4-laptop-r3-24-spaces.png`). Rival rings, halos, the rim arrow and the worker discs all compete for attention (`b2-laptop-r2-board-busy.png`).
- **Laptop layout.** The board is 391 px wide on a 1270 px screen. The side column takes 600 px and mostly repeats the board.
- **Shop.** On HEAD's 10-card shop, the buy view clips the last two cards under the follower buys (`b8-laptop-shop10-clipped.png`).
- **Phone.** Tapping a space opens a sheet that covers it (`b6-phone-sheet-covers-space.png`); the shop dock hides the board while you buy (`c6-phone-buy-dock.png`); the page is 2344 px tall, with a ~150 px empty band kept for Undo (`b7-phone-scroll-and-gap.png`).

**Root cause.** The board is a map of names, and their meaning lives somewhere else (the hover card, the side list). Spinning exists to make one quadrant readable, so three quarters of the board is always the hard part. Rings that aren't open yet take full space in rounds where they mean nothing.

**Options.**
1. **Mock A, text on the board:** glyph and number on each cell; rings that aren't open collapse into the hub; fixed orientation. Agricola and Lords of Waterdeep (Playdek) print the action on the space itself *(unverified)*.
2. **Mock B, the board as a map plus a full list to act in.** It reads like a BGA spreadsheet. The board stops being the game's face, and the eye shuttles between map and list, which is the same split that hurts (a).
3. **Today's wheel, with the list showing all quadrants.** The smallest change, but it is still two places.
4. **Tap a quadrant to zoom into it** (Root digital's clearing focus) *(unverified)*. This adds a mode.

**Pick:** A on both laptop and phone, taking two things from B.
- **Why A.** You look and act in one place, and the board stays the game's face. Hover becomes optional, because every round-I space shows its main effect.
- **Laptop.** The side list goes, so the board grows to about 560 px (it is 391 px today).
- **Phone.** Board, prompt and your pill fit in one 390×664 view (`design/prototypes/board-readability/shots/A-phone.png`). B needs three screens of scroll (`B-phone-full.png` in the same folder).
- **From B,** keep each quadrant's rule with its live leader (moved onto the rim, as Cory asked) and the full wording in a detail card.
- **Fix in A before shipping:** its phone sub-line renders at 8.8 px. Put sub-lines in the tap sheet on phones, with names ≥12 px and main lines ≥16 px.
- **If Cory later wants rotation as a mechanic,** the board can turn as a game event rather than as navigation.

**Spec.**
- **Orientation.** The board is fixed and never spun. Quadrants keep a fixed order. Cell text is drawn upright, never along a curve.
- **Rings.** Only open rings take radius.
  - Round I: one band of 12 cells, each with name, main line and sub-line.
  - Round II: two bands. Round I is the outer band, round II the inner one (8 cells). Sub-lines move into the detail card.
  - Round III: the 4 round-III cells take the hub.
  - Rings not open yet are ghost dots in the hub, labelled "II · III open later" or "III opens next round".
- **Cell states:**
  - legal: lit fill, 2 px stroke, pointer cursor, a slight lift on hover;
  - open but not now: dim, with no pointer cursor;
  - taken: text at 40%, with a disc in the player's color and their initial;
  - a rival's move since your turn: a ring in that player's color, kept until you act;
  - locked: a ghost dot in the hub.
- **Rim band, one per quadrant,** at ≥12 px: "Most gold +2 · P2 3 · you 2". Hovering or tapping it opens the standings for all players, with the tiebreak and the prize.
- **Detail card.** Laptop: hovering a cell fills a docked card in the side column (name, full text, round, status, "Place here"); clicking a legal cell still places directly. Touch: the first tap opens a bottom sheet ≤40% tall, scrolling the board first so the sheet never covers the cell; a second tap or "Place here" places.
- **Motion.** When a ring opens, the hub ghosts grow out into a band over 500 ms. With reduced motion, the change happens instantly.
- **e2e assertions,** at 1270×700 and 390×844:
  - `.spin`, the quadrant tablist and the side panel are absent.
  - Every open, untaken cell has a name ≥12 px and a main line ≥14 px on the laptop and ≥16 px on the phone (computed size × board scale).
  - Locked spaces render no text.
  - Each quadrant has a `.rim-rule` that names the leader, and tapping it opens a popover listing every player.
  - At 390×664, the board's bottom edge is ≤664, with the prompt and your pill on screen.
  - A touch sheet's box never intersects the tapped cell.

### (c) "Selecting how to pay is overly complicated and not tactile." Recommendation: coins drop into cost slots; swap by tapping; Pay.
**What I saw.**
- **One spend, five times.** The dialog shows the same spend five ways: a cost line, a coin row, four ± steppers ("n/max"), "Ways to pay" chips, and "You pay 2 magenta." (`c1-laptop-pay-mole.png`, `c3-laptop-pay-ways-colour-only.png`).
- **Illegal by construction.** The steppers let you build an illegal spend (5 coins for a 4 cost), then scold you: "That spend doesn't fit the cost", with Confirm dead (`c2-laptop-pay-illegal-state.png`).
- **Chips that don't scale.** The chips tell ways apart by color alone (●1 ●1 vs ●1 ●1). They also multiply: holding 6 of each color, +10 followers has 206 ways to pay, and 8 from 4/4/4/4 has 85.
- **Three taps even when forced.** A forced payment still goes card → modal → Confirm: Seed Money costs 4 gold and there is exactly one way (`c4-laptop-pay-forced-still-modal.png`).
- **A silent suggestion.** The suggested way spares colors whose contest you lead, which is smart, but "suggested" never says why.
- **Hidden context.** The modal dims your holdings and the board, and on the phone it's a full sheet (`c5-phone-pay.png`).

**Root cause.** The engine's output, a list of legal spend vectors, is rendered straight onto the screen. A list of vectors is a form, not a handful of coins.

**Options.**
1. **Auto-pay with Undo.** Dominion by Temple Gates has one "play treasures" tap; Hearthstone spends mana for you. It's the fastest, but it isn't tactile and it hides the choice.
2. **Coins into slots.** In Splendor digital, gems arrive pre-placed and you tap to substitute gold *(unverified detail)*. In Wingspan digital, food moves from your supply onto the cost and you choose only the flexible part. This is tactile, and illegal payments can't be built.
3. **Three labelled chips** ("keep your gold lead", "use extras", "cheapest"), preselected the way Race for the Galaxy preselects. Simpler than today, but still a list.
4. **Drag coins.** Dragging on a phone is slower than tapping, and it has the same legality problems as the steppers.

**Pick:** 2, with the speed of 1. The suggested coins arrive already placed, and a payment with only one way commits on the first tap (with Undo).

**Spec.**
- **No modal.** Tapping a card or a follower buy lifts it in place.
  - Under it sits a row of slots: colored slots (●● magenta) and "any" slots (○).
  - Your coins, grouped by color in real counts, sit below the slots, next to your pill.
- **Fill and labels.**
  - The suggested coins fly from your coins into the slots, staggered 150 ms.
  - The top line reads "Recruit Mole · pay 2 ● + 2 any".
  - The bottom line reads "You keep ●1 ●0 ●1 ●0", next to the Pay button. Enter pays; Back or Esc cancels.
- **Moving coins.**
  - Tap a placed coin and it flies back, leaving the slot dashed.
  - Tap one of your coins and it flies to the first empty slot that takes it.
  - A colored slot refuses other colors with a shake and "Mole needs ● magenta here".
  - Pay lights only when the slots match one of the payments the engine offers (an id in `pending.options`), so the engine doesn't change.
- **Coins you'd rather keep** wear a small crown ("you lead Most gold"). The suggestion never uses them, and placing one warns "Spending this costs your Most gold lead".
- **Shortcuts.** With one legal way (Seed Money), the first tap pays, the coins still fly, and a toast says "Paid 4 ● · Undo". A double tap on any card pays the suggested way.
- **Phone:** a bottom tray at most 45% tall, keeping your pill, the card and Pay in one view, with tap targets ≥44 px.
- **e2e assertions:**
  - `.steppers` and `.ways` are absent.
  - A one-way buy takes 1 tap; any other buy takes 2 (card, then Pay).
  - 50 random taps on coins and slots never light Pay on a spend outside `pending.options`.
  - Tapping a placed coin restores your count.
  - A `.coin` 100 ms into its flight has a transform different from where it ends.
  - At 390×664, the slots, your coins and Pay are all inside the viewport.

### Strip list: every element that could go, and where its information would live
| On screen now (HEAD) | Goes; its information moves to |
|---|---|
| Side quadrant panel: header, collapse ▾, 4 tabs, rows, "More below" | Text on the board's cells, plus the detail card on hover or tap |
| "Most gold +2 this round · now…" line (one quadrant at a time) | The rim band on each quadrant, and the standings on tap (Cory's call) |
| Spin buttons ‹ ›, drag to spin, arrow keys, "▲ facing you · drag…" hint, ▲ marker | Gone, because the board no longer spins |
| Ring numerals I/II/III, "ROUND II" tags, "opens round II" | The hub ghost ("II · III open later") and the detail card |
| Dots in empty spaces; halo + glow + ping + rim arrow + recent-move ring | Two marks only: a lit cell for legal, a player-colored ring for "since your turn" (the worker's flight does the ping's job) |
| "Last: …" ticker | The "Since your turn" chips; Log becomes a small header button |
| Caption over the wheel ("P3 took Gift (+2 silver)") | The turn card |
| "last move +N" tags and gift floaters on player cards | The turn card, plus coins flying into the pill |
| Four tall player cards (members, "3 workers", "N members") | A compact player row (followers, coins, worker dots); members open with one tap on the pill (rubric check B7) |
| Phone score bar, which repeats your followers from your strip | The same player row |
| "Round I · 3 workers each" | "Round I"; workers left show as dots on your pill |
| Undo pill, the phone's second Undo row and its reserved blank band (~150 px) | One "↶ Undo" inside the prompt pill |
| "Shop · 57 in the pile · click a member to recruit" | "Shop"; the pile count on hover or tap; the prompt already says what to do |
| "✓ YOU CAN AFFORD" and "you'd pay 7 gold, 3 silver" on cards | Lift and glow for affordable cards (plus a non-color cue); the payment shows in the slots |
| "Release a member ▸ once a round…" line under the buy view | "Release" on your own member chip, shown only while you buy |
| Pay dialog: cost line, coin row, steppers, chips, sentence | Cost slots and your coins, as in (c) |
| Leave as a big pill next to How to play | A ⋯ menu; How to play stays as one tap (rubric check B8) |
## 6. Follower buys shouldn't need colors; sold followers can't come off members (done in engine; UI hints by UI agent)
