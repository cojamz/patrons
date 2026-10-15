# Cults: how the table moves (the motion language)

Owner: the motion designer. Builders read this as a contract; the review of what's built lives in `review.md` beside it.
Cory, 2026-10-15: "whenever somebody does something it should be obvious, and it triggers a chain of animations … All timed well, paced well, and obvious. So each action results in a bit of a little show across the board." "Not SLOW slow. Just clear and steady enough for players to see what's happening." "All the cascading effects of an action should be obvious (in addition to the selection of that action itself)." And earlier: "a super tactile feel", "way snappier".

The engine already says what moved and why: `src/engine/v4/effects.js` emits `{ n, type, cause, from, to, what }` per move, causal and complete. This file says how each of those plays on screen. Effect type names below (`gain`, `pay`, `transfer`, `recruit`, `release`, `member-move`, `refill`, `shop-out`, `discount`, `followers`) and cause kinds (`space`, `member`, `recruit`, `buy`, `contest`, `round`, `release`, `final`, `move`) are the engine's.

## 1. Principles

1. **Cause before effect.** Nothing arrives before the thing that sent it has visibly acted. A space lights before its dots leave; a member hops before its gift flies; a rim lights before its prize lifts. The summary ("You +7●") appears when the last piece lands, never before.
2. **One focus at a time.** At any moment one beat owns the eye: one source sending, one place (or one fan of places) receiving. The next beat may start while the last pieces of this one are landing, never sooner. Bookkeeping (the shop closing its gap, a deal, a counter) may run underneath, but never draws the eye with a hop, pulse or glow.
3. **Source to destination along a readable path.** Every piece leaves from where the rules take it and lands where the rules put it: the space, the member, the rival's pile, the shop card, the rate, the rim. Never from the middle of nowhere, never off screen. The path's shape says what kind of move it is (section 2).
4. **Destinations react as pieces arrive.** A number changes when a piece lands on it, never before, and drops when a piece leaves it, never after. Every landing settles the place it lands on. You can count along.
5. **Fast enough to stay out of the way, steady enough to follow.** A flight is long enough for the eye to catch its start and track it to the end (about 300ms at Steady over a typical 400px), and no longer. Holds exist only where a player has to read something (which space a rival took, which card they're buying).
6. **Your own input answers at once.** Your press shows within one frame (≤70ms). Your minion stands on the space the moment you click. Nothing you can do ever waits on decoration, and a click during a chain finishes the chain and does what you clicked.
7. **Few patterns, used everywhere.** Eight small motions (section 2) build every effect in the game, the way the visual language builds every card from two symbols. Never invent a one-off animation for one card: find which pattern it is.
8. **Respect attention.** What happens to you lands with full weight; what happens between two rivals lands lighter (smaller settle, no hold). Nothing loops. Nothing glows except the one thing you can act on, plus a new member's brief landing ring.

## 2. The parts (a closed set)

### What moves
- **Dot:** a resource, the same flat disc as the stack's dot, 16px, in its color.
- **Follower:** the pixel follower mark, 18px, cream on the table.
- **Bundle (4 or more of one thing):** one lead dot (or follower) at 18px with its count pinned on its left in the language's own form, "+6●": a heavy 14px number, cream with a 1px dark edge, no pill, no badge. Two trailing dots ride 30ms behind it on the same path, at 70% size and 60% / 30% opacity, so it reads as "a handful". It lands as one. Up to 3 of a thing fly as single pieces, 4 or more fly as a bundle: the eye counts 3 at a glance, and past that the number has to say it. Never fly ten slow pieces.
- **Card:** the member itself, a copy of the shop card, shrinking to its chip in the crowd on the way.
- **Minion:** the minion's own sprite.
- Nothing else flies. A discount, a toggle and a set-aside change in place.

### Eight motions
| Motion | What it says | How it moves |
|---|---|---|
| **Press** | "got it" (your input) | the thing you touched goes to .96 and back, 70ms, ease-out. Never slowed by the speed setting. |
| **Pulse** | "this is about to give" (a space, rim or rate as a source) | brightens from inside and scales to 1.04, then back, `cubic-bezier(.3,1.4,.5,1)` |
| **Hop** | "this member just acted" | the chip rises 6px and scales to 1.08, then drops back with a small overshoot |
| **Tug** | "this is being taken from you" | the victim's stack shifts 3px toward the taker and back, once. No red, no shake. |
| **Flight** | "this moved from there to here" | one of four paths, below |
| **Settle** | "this arrived" | the destination scales to 1.18 (1.24 for a bundle, 1.10 for a landing between two rivals) and back, spring `cubic-bezier(.3,1.5,.5,1)`, and its number ticks |
| **Stamp** | "this changed in place" | the new state appears at 1.25 scale, 0 opacity, and settles to 1 / 1 |
| **Sweep** | "this whole row changed" | the same small change runs left to right across a row (shop prices, a fresh row, a deal), 30ms apart |

### Four paths
| Path | Used for | Shape | Easing |
|---|---|---|---|
| **Arc** | gains, gifts, a card to its crowd, followers scored | a true parabola bowing up, height 18% of the distance, 16px to 70px | travel `cubic-bezier(.45,0,.2,1)` (leaves briskly, lands soft); the arc's rise eases out and its fall eases in |
| **Line** | takes (steals, a member taken from a rival) | straight, no bow | `cubic-bezier(.55,0,.1,1)`: a snatch, slow for a frame then fast, hard landing |
| **Drop** | payments, spending | lifts 6px in the first 20%, then a straight accelerating line into the place it pays; shrinks to .6 and fades in its last 15% (it's spent) | `cubic-bezier(.5,0,.75,0)` after the lift |
| **Cross** | swaps | two arcs mirrored: one bows up, the other bows down, so the two cards never overlap mid-flight | the arc's easing |

Build note: a true arc is two layers, an outer element moving along the straight line with the travel easing and an inner one rising and falling (keyframes 0 → −h at 50% with ease-out → 0 with ease-in). The three-keyframe single-element arc in today's `ghostFly` kinks at its middle.

### Flight time scales with distance
Distance `d` is in CSS px between the centres of source and destination. Steady: `clamp(260, 200 + 0.30·d, 440)` ms. A space to a seat (~400px) is about 320ms; the shop to a seat (~600px) about 380ms; your stacks to the 10→10 rate (~1000px) hits the 440 cap. A constant feel of speed reads more honest than a constant duration: short hops don't drag, long throws don't blur. Quick and Relaxed use their own formula (section 4).

### Color can turn in flight
When a rule changes a resource's color on its way (a steal that "arrives as magenta", Midas's "gains come as gold instead", Translator's "what you copy comes as green"), the piece leaves in its old color and turns at the midpoint (an 80ms crossfade). If a member causes the turn, that member hops as the piece turns. The change is seen, not inferred.

## 3. The catalogue

Every row: the path, what flies, the stagger for N, the duration (Steady; section 4 has every speed), the easing (from section 2 unless named), the destination's reaction, and the emphasis.

### Selection
**S1. A space is chosen (yours).** Press on the space at pointerdown. Your minion stands in its door on the first frame (stamp, 140ms). A trail: a ghost of the minion leaves the foot of your seat's minion column on an arc and fades onto the space, 180ms; the column closes its gap (the minions above slide down 4px, 160ms). The space then pulses (90ms), and the chain's first beat leaves from it 60ms into the pulse. Nothing waits on the trail.

**S2. A space is chosen (a rival).** The rival's seat already carries the turn light. Their bottom minion lifts out of their column (the first 15% of its flight, no separate hop), flies on an arc to the space (380ms; the space's door stays dark until it lands), and stamps into the door (140ms, overlapping the last 60ms of flight). Then a read hold of 160ms from the landing: the space's words are what the eye lands on, so it reads which space before anything flies. The space's pulse is the last 90ms of that hold, and the first piece leaves as the hold ends.

**S3. A choice inside an action** (Kickback's "a player you choose", Collect Debts' picks, Echo's target). The chain pauses at the choice: everything before it has landed, nothing after it has left. A rival's choice shows as a 160ms point at what they chose (the chosen seat or space pulses) before its effect flies.

### Movement
**M1. Gain** (`gain`, from a space, quadrant, member, rim or bank to a stack). Arc. Dots, or a bundle at 4+. Stagger 60ms between single pieces. Flight by distance (~320ms). Each landing ticks the stack by one and settles it; a bundle rolls the number from old to new over 240ms and settles at 1.24. Emphasis: the source's pulse (a space) or hop (a member) before the first piece leaves. Several colors from one source (Peddler's "+1 of each other color", "+2 silver and +2 of another color") fly as one beat, each color its own group, groups 40ms apart.

**M2. Pay** (`pay`, from stacks to a shop card, a rate, a space, or the bank). Drop. Dots or bundles, one group per color, groups 40ms apart, pieces in a group 60ms apart. ~300ms. The source stack's number drops as each piece leaves (dip: the stack goes to .88 and back, 140ms). The receiver presses (.96, 100ms) once, when the last piece is in. A payment to "the bank" (no place on the board) drops into the space that caused it if there is one, else into the wheel's hub. Payments come before what they buy, always (the engine's order already says so).

**M3. Take** (`transfer` where the cause's owner receives: a steal, Collect Debts, Cutpurse, Raider). Line, straight from the victim's stack to the taker's. First the victim's stack tugs toward the taker (90ms); then the pieces leave one by one (60ms apart), the victim's number dropping as each goes. Flight by distance, with the snatch easing. A take that "arrives as magenta" turns color at the midpoint. Several victims (Collect Debts split 2 and 1, "1 from each rival") are one beat: each victim's tug and pieces start 40ms after the last, in seat order, and land in one stack. If you're the victim, your stack's settle-down is full size; between two rivals it's lighter. Build note: the engine records a magenta steal as the victim's `pay` plus the taker's `gain` under the same cause (different colors, so not a `transfer`). Pair them: a non-owner's `pay` and the owner's `gain` of the same total under one cause play as one take.

**M4. Give** (`transfer` where the cause's owner sends; Kickback's gift; Silver's "a rival you choose gets 2"). Arc from where it comes from (the giver's stack if the giver pays, else the space) to the receiver's stack. Same timing as a gain. Gifts are generous: arcs, never lines.

**M5. Spill** (one cause's `gain`s to several players: "everyone else +1 silver", "everyone else gets 1 of that color"). A fan: the same source sends one group to each rival at once, 40ms apart in seat order after the actor. The fan starts when the actor's own pieces are two-thirds of the way (it's the same action, one beat). Lighter settles (1.10) on rivals' stacks.

**M6. Copy** (a space's cause carrying a copied space: Echo, Encore, Reprise, Greatest Hits, Understudy, Stunt Double, Sleepwalker). A link: a 2px cream line draws from the copy space to the space being copied, straight across the wheel, 160ms, ease-out; it fades as the copied space pulses (its original taker's minion still in the door). Then the copied space's own effect plays exactly as it did for its taker (its gains arc from the copied space to the copier). The pieces come from the copied space, not the copy space: that's what makes it read as an echo. Copying several spaces (Greatest Hits, Tribute Band) is one link and one beat per space, in the order they were taken.

**M7. Recruit** (`recruit` with its `pay`, from a shop card to a crowd). Three steps.
1. Lift: the card rises 10px and scales to 1.06 (120ms). Your buy: the lift starts on your press. A rival's buy: the lift starts at the hand-off from their gain (two-thirds rule), and the coins leave when the lift ends; the card stays lifted while the coins fly into it, and that is the telegraph of which card (no extra hold).
2. Pay: the coins drop from the buyer's stacks into the lifted card (M2). They aim at the lifted card's spot and fade in their last 15%, so a card already leaving never shows a miss.
3. Fly: when the last coin is two-thirds of the way, the card leaves on an arc to the buyer's crowd, shrinking to its chip (380ms, `cubic-bezier(.3,.7,.2,1)`). The chip lands with a settle and a light ring (260ms, the one exception to "one glow"). Then the member's worth: its follower marks hop from the chip to the follower count (a short arc, ~240ms), and the count ticks. The follower count never jumps on the card's landing without that hop.
The shop closes its gap (shop slide) as soon as the card has left its slot, and the deal (B4) follows, both as bookkeeping. A "When recruited" or "Now and at round start" member plays its effect next, as a trigger (M9) from the new chip.

**M8. Release** (`release`, a member to the pile, with its refund `gain`). The chip presses, then flies on a drop to the face-down pile at the head of the shop row, shrinking to the pile's card size and sliding under it (its last 20% goes behind the pile). 380ms. The follower count drops by its worth as it leaves (the follower marks don't fly back; the number ticks down at departure). The refund arcs from where the chip was to the stack, leaving when the card is 40% along. The pile's count ticks up when the card is under it.

**M9. Member trigger** (any effect whose cause is a `member`). The member hops (180ms); its payload leaves the member 100ms into the hop, on the path its type calls for (a gain arcs, a take is a line, followers rise). Several members of one player that fire on the same cause hop left to right, 80ms apart, each sending its own pieces. A trigger plays after the effect that set it off has landed (the two-thirds rule, section 5), never before; a rival's member reacting to your move plays after your own members.

**M10. Swap** (`member-move` both ways under one cause: Even Swap, Double Agent, Poach). Both chips lift (hop, 120ms), then cross (420ms) on mirrored arcs and land with settles. Each follower count ticks by the worth difference as the cards land. A one-way `member-move` (a member taken) is a take: the victim's chip tugs, then flies on a line.

**M11. Follower buy** (`buy` cause: `pay` to the rate, then `followers` from the rate). An exchange in three steps.
1. In: the coins drop from the buyer's stacks into the rate tile (M2; each color a group). Gold that counts as any color is still gold in flight.
2. Accept: the tile presses (.94, 80ms) then pops (1.06, 80ms). A limited rate's "8 left" ticks down at the pop.
3. Out: the followers leave the tile on an arc to the buyer's count (a bundle with "+10", or single marks up to 3), 60ms after the pop. The count rolls on landing and settles at 1.24.
Rivals' triggers on a buy (Tax Collector, Tipster, Extortionist) play after the followers land.

**M12. Followers scored** (`followers` from a member, space, rim or the bank to a count). The follower mark rises out of its source (8px, 100ms) and arcs to the count. Up to 3 single marks, 60ms apart; 4 or more as a bundle. A loss of followers (Lender's game-end cost, selling followers) runs backwards with a drop: marks leave the count (it ticks down as each goes) and drop into the space, member or bank that took them.

**M13. Sell or trade for followers** (White's spaces: "Trade up to 2 resources per round number for followers", "Sell up to 2 loose followers for 3 white each", "Cash in"). The same exchange as a follower buy, with the space as the converter: in (drop into the space), accept (the space presses and pops), out (arc to the count or stacks).

### Bookkeeping
**B1. Round-start income** (`round` cause; members that say "Now and at round start", Investor's and Sower's set-asides). After the minions come home. Seat by seat in the new round's turn order, each seat starting 200ms after the one before; in a seat, every round-start member hops at once and their pieces fly together, grouped by stack. No holds. A table with nothing to pay skips straight to the first turn.

**B2. Discount** (`discount`, Intro Offer, Planner, Underbidder, Apprentice, Sommelier). No flight. The source pulses (space) or hops (member). A price tag "−4" stamps onto the player's seat (beside the crowd, the place a pending discount lives), and if the shop shows your prices, every price it lowers ticks down in a sweep, left to right, 30ms apart, each number pressing to .92 as it changes.

**B3. Set aside and return** (Investor's gold, Sower's yellow). Set aside: a drop from the stack into the member chip, where the parked count stamps on. Return: the member hops, its parked count stamps to the new amount ("3" becomes "6": the doubling is seen), then it arcs back to the stack as a bundle.

**B4. Shop refill and deck draw** (`refill`, `shop-out`). The row closes its gap (shop slide 240ms, `cubic-bezier(.3,.7,.4,1)`). Then the top card of the pile lifts off (the pile's count ticks down as it leaves), flies face down on a short arc to its slot and turns face up in its last 40% (a scaleX flip), 300ms. Several new cards deal 40ms apart. A whole fresh row (Blue's sweep, `shop-out` × 10): the old row drops away left to right (12px down and fade, 160ms each, 25ms apart) toward the pile, then the new row deals. Always bookkeeping: never a hold, never a glow.

**B5. Switch toggle** (Midas, Translator: "you can switch it off or on when you buy"). The chip flips on its vertical axis (200ms, ease-in-out) to show its new face (on: full color; off: faded). No flight.

**B6. Contest prizes in the Reckoning** (`contest` cause, `followers` from a rim). One rim at a time, in the wheel's order starting at the top. The rim lights (the others step down to 60% for the Reckoning). The leader's emoji on the rim hops (180ms). The prize lifts off the rim's engraving as the language's own "+4" follower bundle and arcs to the winner's count; tied winners get a fan (one bundle each, 40ms apart). The count rolls and settles. A rest of 120ms, then the next rim. A rim nobody scores pulses once, dim, and moves on (250ms). Members that act at round end (Investor, Dyer, Sower) play before the first rim, as triggers, because the rims count what's held after them. Then the minions fly home (all at once, 30ms apart) and B1 begins.

**B7. End-game bonuses** (`final` cause). After round III's rims. Player by player, from fewest followers to most (the suspense builds toward the leader); in a player, each "Game end" member hops in turn, 250ms apart, and its followers arc to the count (M12). A loss (Lender) runs backwards. Then the seats slide into rank order (400ms) and only the winner's seat takes the light.

**B8. Extra turns** (Go-Getter, Errand Runner, Night Owl, Taskmaster, Overtime, Rally). If the extra turn was paid for, the payment drops first (M2). If a member gave it, the member hops. Then the turn marker on the left rail slides back to this seat (240ms, ease-in-out) and the seat's turn light rekindles (dims to 60% and back, 240ms). "Extra turn" reads on the turn card. Two extra turns: the marker slides back once, and the seat's light rekindles twice, 120ms apart.

**B9. Counted from somewhere else** (an amount measured from a holding: Tithe's "per member", Mime's "as much as the rival with the most", Upstart, Lottery Winner, Catch Up, White's "+1 per player ahead"). Before the payload leaves, the thing counted pulses (a 1px light outline, 120ms): your chips ripple left to right for "per member", the richest rival's stack pulses for "equal to the richest rival's". It says "because of this" in a tenth of a second. Skipped at Quick.

## 4. Speeds

The menu offers Quick, Steady and Relaxed. **Steady is the default.** Press, hover and your own minion standing on the space never change with the setting. Every other number does.

| Pattern | Quick | Steady | Relaxed |
|---|---|---|---|
| Press (your input) | 70 | 70 | 70 |
| Your minion stands on the space | 0 (stamp 100) | 0 (stamp 140) | 0 (stamp 180) |
| Your minion's trail from the column | 140 | 180 | 240 |
| A rival's minion flight | 240 | 380 | 560 |
| Read hold after a rival places | 60 | 160 | 320 |
| Pulse (a source about to give) | 50 | 90 | 140 |
| Hop (a member acts) | 120 | 180 | 260 |
| Hop or pulse → first piece leaves | 40 | 60–100 | 100–150 |
| Tug (taken from) | 60 | 90 | 140 |
| Flight, by distance d (px) | clamp(160, 120+0.18d, 280) | clamp(260, 200+0.30d, 440) | clamp(380, 280+0.45d, 640) |
| Stagger between single pieces | 35 | 60 | 90 |
| Bundle trail spacing | 20 | 30 | 45 |
| Fan or group stagger | 25 | 40 | 60 |
| Settle on landing | 140 | 180 | 240 |
| Number roll (a bundle) | 160 | 240 | 360 |
| Card lift | 80 | 120 | 160 |
| A rival's buy: extra hold before the coins leave | 0 | 0 | 160 |
| Card flight to the crowd | 260 | 380 | 560 |
| New member's landing ring | 200 | 260 | 340 |
| Worth hop (chip → follower count) | 180 | 240 | 340 |
| Exchange accept (rate or space press-pop) | 100 | 160 | 240 |
| Swap cross | 280 | 420 | 620 |
| Copy link line | 100 | 160 | 260 |
| Color turn in flight | 60 | 80 | 120 |
| Counted-from pulse (B9) | skipped | 120 | 180 |
| Price sweep, per card | 15 | 30 | 45 |
| Toggle flip | 140 | 200 | 280 |
| Shop slide | 180 | 240 | 320 |
| Deal: per card / stagger | 220 / 30 | 300 / 40 | 420 / 60 |
| Next beat starts when this beat's last piece is … along | half | two-thirds | landed + 60 |
| Breath between one player's turn and the next | 80 | 180 | 360 |
| Reckoning: per rim (light, hop, prize, rest) | 500 | 900 | 1300 |
| Minions home: each / stagger | 260 / 20 | 340 / 30 | 480 / 45 |
| Round-start income: seat stagger | 120 | 200 | 320 |

### What a turn costs (targets, measured on the storyboards in section 7)
| | Quick | Steady | Relaxed |
|---|---|---|---|
| Your placement with a simple gain (click → last landing) | ~0.45s | ~0.75s | ~1.1s |
| Your recruit with its worth hop | ~0.55s | ~0.85s | ~1.3s |
| Your whole turn's motion (both chains) | ~1.0s | ~1.6s | ~2.4s |
| A rival's turn: place, gain, recruit, breath | ~1.1s | ~1.85s | ~2.9s |
| A rival's turn with no buy | ~0.75s | ~1.2s | ~1.9s |
| The Reckoning, four rims | ~2.2s | ~3.8s | ~5.6s |

The speed setting also sets the bots' pace: a bot's next turn starts when the last chain (plus the breath) is done, not on a separate timer. `BOT.pace` becomes a floor for a turn with nothing to show (a pass), not a fixed hold on top of the motion.

### Hard targets (test these)
Measured today on the quiet box (design/eval/perf/quiet-baseline-b3ac40c.md): a bot's move is applied in about 0.5s but shows on the table at 2.5s p50 and 5.9s p95, because the animation queue sets the pace; from the end of your turn to your next turn takes about 12.5s p50 with three bots. That wait is most of "it doesn't feel snappy". The budget below brings it to about 6s while every effect stays readable. Steady unless named; Normal bots; 1270×700; numbers at p50 over a whole game unless named, on a quiet box. `scripts/v4-perf.mjs` already records most of these.

| # | What | Target |
|---|---|---|
| H1 | Your input → visible response (press, minion standing) | ≤ 100ms (the snappy gate) |
| H2 | **End of your turn → your next turn's spaces lit**, three bots | **≤ 6.5s p50, ≤ 9s p95** (today 12.5s). Quick ≤ 4s p50. Relaxed ≤ 9.5s p50. |
| H3 | **A rival's whole turn**, from their minion leaving to the next player's minion leaving | **≤ 2.0s p50, ≤ 3.0s p95** (Quick ≤ 1.2s, Relaxed ≤ 3.0s p50) |
| H4 | A rival's plain turn (place, simple gain, recruit, no triggers) | ≤ 1.9s |
| H5 | Engine applied a move → its chain starts on screen | ≤ 1.0s p50, **≤ 2.5s p95** (today 2.5s / 5.9s): the backlog rule (section 5) |
| H6 | Gap between one player's last landing and the next player's first motion | breath (180ms) + ≤ 50ms: a bot's thinking hides behind the chain in front of it |
| H7 | Your placement chain with a simple gain (click → last landing) | ≤ 0.8s |
| H8 | Your plain recruit (click → worth landed on the count) | ≤ 1.0s |
| H9 | Any one chain except the Reckoning | ≤ 3.0s (the cap) |
| H10 | The Reckoning, first rim lit → last count settled | ≤ 4.5s |
| H11 | Skip (click or Space) → every number final and every ghost gone | ≤ 120ms |
| H12 | Your turn starts → your spaces accept a click | 0ms (the glow may still be fading in) |
| H13 | Truth: 50ms after a chain ends or is skipped, every number on the table equals the engine's | always (a gate) |
| H14 | Reduced motion: a rival's whole turn | ≤ 0.8s, in order |

## 5. Sequencing

### The order inside one action
One move of the engine becomes one **chain**. A chain is a row of **beats**; a beat is one cause doing one visible thing (one source sending, one place or one fan receiving). Play the engine's effects in their order (`n`), grouped into beats by their cause frame:
1. **Selection** (S1 or S2).
2. **What the action costs** (a `pay` under the space's own cause: Overtime's 8 purple, Rally's purple). Give before get, as the visual language reads left to right.
3. **The main effect:** what the cause's owner gets or takes.
4. **The spill:** the same cause's effects on everyone else, as a fan inside the same beat (M5).
5. **Triggers:** each `member` cause is its own beat, in the engine's order, which is the order of causes. The owner's members come before rivals' members because the engine resolves them that way; where the engine's order and seat order disagree, the engine wins.
6. **Followers that follow from it** (a recruit's worth, a bonus) ride at the end of the beat that caused them, never as a separate jump.
7. **Bookkeeping** (refill, `shop-out`, the discount sweep, the pile's count) runs underneath the next beat and never holds the chain.

A recruit or follower buy is a second move in the same turn, so it is a second chain; for a rival it follows the first chain with no breath (section 5, bot turns).

### Overlap: the hand-off
- Inside a beat: single pieces 60ms apart, groups and fans 40ms apart.
- Between beats: the next beat's first motion (its pulse, hop or tug) starts when this beat's **last** piece is **two-thirds** of the way. There's always one thing landing while the next thing wakes: that hand-off is the rhythm, and it is what makes a chain read as cause and effect instead of a list.
- No overlap (wait for the landing) in two cases: a choice (S3), and a beat whose source is the last beat's destination (a "When recruited" member can't hop before its chip has landed: it hops 90ms after the landing).
- A landing on **your** seat from someone else's action (a steal from you, a gift to you, your member reacting) holds 60ms longer before the hand-off, so "that hit me" registers.
- At most one beat has the eye. At most 12 ghosts in the air (bundle trails count), and at most 4 flight groups at once (one per seat).

### Ten pieces, ten beats
- Per group: up to 3 single pieces; 4 or more fly as one bundle with its count.
- Per beat: if the groups would put more than 12 ghosts in the air, the smallest groups fly as bundles too ("+2●" as one piece with a count).
- Per chain: beats 7 onward play at Quick timings; beats 11 onward land together in one sweep of settles 30ms apart. Back-to-back beats with the same cause, type and destination merge into one (their counts add).
- A chain's cap (not the Reckoning): 3.0s at Steady. If a chain's plan runs longer, every remaining duration scales down to fit, never below Quick.

### Bot turns read as a short story
A rival's turn is five lines, each one beat or a few:
1. **Who:** the turn marker slides to their seat (200ms, during the last turn's breath).
2. **Where:** their minion lifts from their column and flies to the space; a 160ms read hold on the space's words.
3. **What:** the space's effects: main, then spill.
4. **Who reacts:** members' triggers, in the engine's order; yours land with the extra 60ms.
5. **What they bought:** the chosen card lifts at the hand-off from their gain, the coins drop into it (that's the "which one"), the card flies, its worth hops to their count. Or the follower buy's exchange. A pass shows nothing; the turn card says "passed".
Then a 180ms breath and the next player. The bot's own steps inside its turn (its choices, its buy) never wait on a timer of their own: the story plays straight through.

**Thinking never shows as waiting.** The engine runs ahead of the screen: the next bot's move is computed while the current chain plays, and the table plays the queue. The only time the table waits on a bot is when its thinking takes longer than the chain in front of it.

**The backlog stays short.** The screen never falls more than one turn behind the engine. When a whole turn is queued behind the chain that's playing, the queued chains play at Quick; when two are queued, the oldest lands at once (crossfade, 120ms) and the newer one plays. A move is never on screen later than 2.5s after the engine applied it.
