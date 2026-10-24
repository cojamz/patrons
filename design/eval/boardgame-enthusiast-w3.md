# Boardgame enthusiast — wave 3 (blind, laptop 1270×700, v4-eyes)

Two full games plus a speed check, ~60 minutes of play.
- Game 1: Gold / Yellow / Magenta (steals) / Blue, 3 Normal bots, Steady. **I won 50–47–36–31.**
- Game 2: White / Blue / Silver / Red (Most Members), 3 Hard bots, Steady. **I came last: 83–66–59–54.**
- Speed check: a third table on Quick, round I only.
Move logs with a reason per move: `boardgame-enthusiast-w3-moves.md`. Screenshots are in /tmp/eyes/enthusiast/ (not committed).

**Verdict:** a lively, readable worker-placement with a gorgeous wheel and real snake-draft tension, but recruiting members doesn't pay. Both games went to whoever converted resources into followers 10→10 or hoarded for the rim prizes. My 16-member engine came last, and so did game 1's 9-member bot.

## Grades
- **Decisions: B.** About 22 of 26 turns were real choices: the space, then member vs. followers vs. hold for the rim. One turn was forced (the last open ring-I space), and three were obvious (Hand-pick, Open House).
- **Tension: B+.** The snake double-turns, "is Tithe still open?" and "spend now or keep it for Most Gold?" are all good. Steals and "half the richest" punish hoarding, so holding resources is a live risk.
- **Strategy / arc: C+.** I could plan in round I (gold engine, silver engine), and round III does burst. But the burst is a follower-buying burst, and the engine part of it doesn't matter.
- **Interaction: B.** Redistribute, Rising Tide, Raider and Shake Down all bite, and mostly hit the rich or the leader. Getting robbed felt fair because I could see why it happened.
- **Balance: C−.** 10→10 at 1:1 with no limit sets the price of everything. A member is roughly 4–6 resources for 1 follower plus an ability, and few abilities pay that back in time.
- **Clarity: B−.** Space hovers ("YOU'D GET +5, you'd lead it") are excellent, and so is the chain readout card ("You took Toast: Majordomo +2, Toastmaster +1"). Occupied spaces read weakly, and the round-III burst is a blur.
- **Fun: B.** Game 1 was a joy: a tight gold race, steal-backs and a 3-point win. Game 2 was a sting: I built the biggest engine on the table and lost by 29.
- **Overall: B−.** The bones are good. The economy sends every road to "buy 10".

## Top 10 game-design issues (worst first)

**1. Followers bought at 1:1 make members a losing trade.**
- What happened:
  - G1 final: I won 50, with 43 of it bought and 4 from members. P3 bot had 9 members and came last on 31.
  - G2 final: I had 16 members, scoring 14 from members and 20 bought, and finished last on 54. P4 had 4 members, bought 43, and came second on 66.
  - Moves log G2 R3 m2: I paid 10 for Extra Hand instead of 10→10. The extra minion then made +2 followers and +10 resources, so it barely broke even.
- Why it matters: the designer's pitch is "recruit lots of members, escalate into bulk followers". In practice the members are the slow lane. A newcomer who follows the theme gets punished.
- Smallest fix: make 10→10 the capped tier (like 8→6 at 2 per player), or step it down (10→8). The cleaner option is to give members a scaling end-game or round-start payout, so that holding 10+ members beats 10 loose resources.
- Who does it best: *Dominion*. Big Money beats a weak engine but loses to a real one, because Province supply is finite and the engine draws faster. *Splendor* makes engine cards pay for future cards, so the engine snowballs.

**2. The round-III contests go to whoever didn't spend, so hoarding beats building.**
- What happened: G2 round III, P2 won Most White, Most Blue and Most Silver with 2, 2 and 9. Everyone else had cashed out to 0–1. That was +18, and +30 prizes over the game, which decided the winner by 17. G1 round II, P4 swept all four rims (+16) with 2 gold, 2 magenta members and 2 blue.
- Why it matters: the rims are meant to be "seasoning", but in both games they decided who won. In round III, everyone's best move is to spend everything, so the one player who sits on a pile wins three contests uncontested. That's a cliff, not a contest.
- Smallest fix: count round-III rims on something you've built (members of the color, or the peak held this round) rather than the resources left at the bell. Or pay round III at +4, not +6.
- Who does it best: *Viticulture*'s end and *Lorenzo*'s faith checks score built state, not leftover coins.

**3. Ties at 1 in round I make the round-I rims a participation prize.**
- What happened: G1 round I, Most Magenta and Most Blue had P2, P3 and P4 all tied at 1, so all three scored +2. Most Gold was me and P2 tied at 1. I had worked for gold and got the same +2 as players who picked one resource at setup.
- Why it matters: round I's only scoring moment feels random and flat.
- Smallest fix: make ties score nothing unless the rim's tiebreak settles them (Red already has one), or require 2+ to score in round I.
- Who does it best: *El Grande* scores ties one tier down.

**4. A shop refresh before my first turn wiped out the card I'd picked my setup resources for.**
- What happened: in G2 I picked Silver + Silver for Shareholder (2 silver + 1 any, worth 3). P4's New Faces swept the row before I acted, and my setup plan was dead before my first move.
- Why it matters: the rulebook sells setup as "pick toward a member". The game then lets a bot shuffle that promise away at no cost.
- Smallest fix: no row sweep during round I, or setup picks come after the first sweep. Alternatively, New Faces only refreshes half the row.
- Who does it best: *Everdell*'s meadow refills one card at a time, so a sweep can't erase a plan.

**5. Front-runner ("always pick first") is dead for the player who would want it.**
- What happened: G1 R1 m3, I bought it because it cost the same as 2→1. I was last in followers, so I picked first anyway, and it did nothing for me all game.
- Why it matters: it's a trap card for trailers and a pure gift to the leader, who skips the catch-up rule. That runs against the game's own "the trailer picks first".
- Smallest fix: make it "pick second-to-last becomes first", or give +2 any if you'd already go first.

**6. In round III you can't see the swing coming or follow it.**
- What happened: in G2 the Hard bots took 33/33/36 to 59/53/59 in one run of turns, about 13 s of animation (Spree + 10→10 ×3, Bandwagon +11 red + 10→10, Hold Court +10). I went from 10 behind to 23 behind between two of my turns.
- Why it matters: the "burst" is the designer's aim. But from the other side of the table it feels like a slot machine, not a payoff you saw building. I couldn't read who was about to burst, because rival panels show resources but not "spending power this round".
- Smallest fix: show each rival's total resources as a "≈ followers if they cash out now" number on hover, and slow the round-III follower buys into one readable beat each.
- Who does it best: *Terraforming Mars* shows each player's production at a glance, so a rival's big generation is visible coming.

**7. Rising Tide / "half the richest" swings hard, and in game 2 it turned my hoard into a rival's prize.**
- What happened: G2 R2, P2's Rising Tide took +10 silver because I was the richest. P2 then led Most Silver all three rounds (+12) with silver partly mirrored off me. P4 repeated it in R3 (+10).
- Why it matters: it's good catch-up and creates tension (I like it), but it's +10 in round II for one ring-II space. That's huge next to "+2 then recruit".
- Smallest fix: cap it at the round number ×3, or "half, rounded down, max 6".

**8. Tied "most" rules and shared resources mean you can't plan a rim from round I.**
- What happened: Yellow's "Most full sets" never entered my thinking in G1, and no bot pursued it either; P2 just won it. The four-color "full set" is hard to see on a rival's panel.
- Why it matters: one of four rims is dead weight for a newcomer. A whole quadrant (Yellow) felt dull and opaque.
- Smallest fix: show set counts on each player's panel as a number. Better, make Yellow's rim about something Yellow's own spaces build.

**9. Big Spender seemed to fire more than its text allows (verify).**
- What happened: G1 R2 m2 and m3, it offered "buy again" on two separate turns in the same round. My note from its hover says once per round.
- Why it matters: if the text is right, the rules engine is wrong. If the text is wrong, it's stronger than it reads. Either way a careful player feels cheated or confused.

**10. Ownership was ambiguous in the swap log.**
- What happened: in G2 round III the strip said "your Retinue +1 red", while the full log said "P3 traded Broker for P4's Retinue". My score went 37 → 36 and I couldn't tell from the screen whether I'd lost my Retinue.
- Why it matters: losing a member is the one harm that really stings. It must be unmistakable who lost what. Also in G1 R3 I saw P4's pizza and my octopus on Golden Years at once and couldn't tell if that was a copy or a bug.
- Smallest fix: every swap or steal gets one line in plain words, "P3 took your Retinue; you got Broker", plus a visible card flight between the two seats.

## Cut, buff or nerf
- **Buff Extra Hand** (10 any for +1 minion in round III). It costs exactly a 10→10, so it must beat 10 followers, and it doesn't. Try 6 any, or make it work in round II too.
- **Buff Recluse / Revelers-style member-count cards.** These are where members matter. More of them would let a member strategy win.
- **Nerf 10→10.** Make it limited (as 8→6 is) or 10→8. That one change rebalances every member.
- **Nerf Rising Tide / "Gain silver, half the richest".** Cap it near 6 (see #7).
- **Rework Front-runner.** It's dead for its natural buyer (see #5).
- **Keep Lender** (+5 white now, −2 at game end). A nice, readable tempo-for-points deal; I'd keep it exactly.
- **Keep Toast + Majordomo + Toastmaster.** The one chain that felt like an engine (+9, +2, +1 follower per silver space) and made me grin.
- **Keep Raider.** Once per game, buy 3 followers from the leader for 1 each. Perfect "hit the leader" design. It was only weak because I had 2 white.
- **Watch Shake Down** (ransom a member). I lost Big Spender while holding 0 resources. That's fair because I was the leader, but losing a member outright is the harshest hit in the game.

## Felt unfair or unfun
- **G1 R2, Shake Down.** P2 held my Big Spender for 4 while I had 0 resources, so I lost it. I'd emptied my purse on 10→10 one move earlier. I could have seen it coming because the space was open. It stung but was earned.
- **G2 R2, Rising Tide.** P2 gained 10 silver because I was rich, then beat me on Most Silver with it. Visible on hover, but the size of the swing felt out of scale.
- **G2 R3 burst.** I was 10 behind, then 23 behind before I could act again, after 13 s of others' buys. I couldn't have predicted the size.
- **G2 end.** I had 16 members against the winner's 6, and finished last. The game told me its theme and then scored against it.
- **G1 round I.** Three players tied at 1 magenta all got +2. My deliberate gold play earned the same as an accident.
- **On the other side:** when I stole with Redistribute/Crime Wave, it felt good and fair. The "only from richer rivals" wording made me feel clever, not mean.

## Table talk
- "Just buy ten-for-ten. Every time I recruited someone cool, I fell behind."
- "Okay, Toast into Majordomo into Toastmaster was sick. I want a whole game of chains like that."
- "Wait, he won three rims by holding nine silver while we all cashed out? Round three's a trap."
- "That wheel is gorgeous, and the hover telling you exactly what you'd get is chef's kiss."

## What genuinely works
- The wheel and the snake draft. The ring-by-ring opening and double turns create honest "will it still be open" tension.
- Hover previews ("YOU'D GET +5 · you'd lead it") and the "You took X: chain…" receipt make cause and effect obvious, even at Quick (~0.9 s per bot move; Steady ~1.7 s, which felt right).
- Steals aimed at the rich, Raider aimed at the leader, and gifts on most gain spaces. Interaction stays mostly kind and readable.

Pacing note: at Steady, bot moves at ~1.5–1.8 s each felt steady. The round-III burst of 8+ moves, about 13 s, is too long to watch and too fast to follow. Clicks routinely took 150–350 ms to first paint, which is noticeable on every tap.
