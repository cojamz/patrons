# Rework panel brief (2026-10-21, overnight)

Every agent on the panel reads this first. It is the shared ground; it does not replace reading the sources it names.

## The job
Cory (designer) asked for **recommendations, not builds**, for every color not yet reworked. Nothing ships until he approves. You sit in the designer's seat tonight, so think like a designer who knows this game cold: ruminate on options, reason from what wins, price carefully (cost and followers), and keep it interesting but not complicated. He was blunt: past suggestions "felt like you don't understand the game". He wants fewer, better ideas over many shallow ones. Never "slop".

### In scope
- **Blue members** (Blue's actions are settled in another thread; see below).
- **Magenta members** (Magenta's actions are locked).
- **Neutral members** (the guests: Squatter, Freelancer, Extra Hand, Front-runner, Straggler; neutral cards stay neutral, no color).
- **Gold, Purple, Silver, Yellow, White: actions and members.** Cory: "I'm not married to the core identity of Silver, Gold, or White", so those three can be rethought from the ground up. Purple: "kernel is there, but needs rework" (Crunch Time, extra turns). Yellow: variety/sets, weak at low player counts, "basically doesn't want members".

### Out of scope (do not touch)
- Green (actions and members), Red (actions and members), Magenta actions. Blue actions are "mostly locked"; a light suggestion only if clearly better.

## Sources (read them; live code wins over docs)
- `design/strategy.md` — how the game is won, Cory's taste with evidence, how he designs a color, how to pitch. **Required.**
- `design/pitch-ledger.md` — every pitch and his verdict, with tags. **Required.**
- `design/decisions.md` — every call. The Oct 20 economy entry and everything after it are the current frame.
- `design/eval/member-feel.md` — what makes a member feel good or bad (Oct 15 audit; prices there are older).
- `design/eval/rework-panel-2026-10-21/live-cards.txt` — every live action and member, with cost (colored+any) and followers, dumped from the engine tonight.
- `src/engine/v4/content/*.js` — the live rules (purple.js, silver.js, yellow.js, gold.js, trading.js = White, market.js = Blue, thieves.js = Magenta, benders.js = guests, red.js and echo.js = the approved reference decks).
- `design/spheres/*-redesign-*.md`, `red-members-2026-10-18.md` — how the approved reworks were reached.
- `design/eval/neutral-members.md` — the rejected neutral batch (and why).

## The current economy (Cory, 2026-10-20) — the frame for every pitch
- Using an action gives **1 of its color** (printed "+1 <color>") and only sometimes more. Move away from big flat resource gains.
- **Members are where followers come from.** Member costs come down to match.
- **Resources held at round end score the color's contest** (2/4/6 by round to the leader, halved on a tie). So **holding vs spending on members** is the core tension.
- Follower buys: any resources, 1-for-1, packs of 1, 5 or 10, one buy per turn (a member or one pack). Minions 3/4/5 → ~12 buys per player per game.
- Shop: **7 face up**, refills from the pile at once; the whole row goes to the bottom of the pile and a fresh 7 comes out at the start of rounds II and III. No discard pile (Cory, Oct 20). Cull: 10 members per color dealt. Member cost ceiling 10.
- Round I spaces must stay worth taking in round III (scale by round, or copy, or relative). Round II bar (Oct 20): measured against **Promote** ("Swap a member with a shop member costing up to 2 more") and **Shake Down** ("they pay its cost to keep it, or you take it"): round II must change what you own or how much you buy, not just what you can see. Round III is the burst the color builds toward.

## Blue's actions (settled in the "Blue shop ideas" thread; design members to fit)
Round I: churn (send 3 shop members to the bottom, refill), flip out a color (send every shop member of one color to the bottom), peek (look at the top 4 of the pile and reorder). Cory said round I "kinda don't scale"; scaling variants are with him. Round II: **Buy twice** ("This turn you buy twice"), plus one slot open (he liked "bury for half"). Round III: **Spree** (buy 3 times), +2 blue on top of the +1. Every space +1 blue. Blue's contest is live as "most blue members"; the other reworked colors moved to held resources, and Cory spoke of "the updated blue actions and conditions", so treat Blue's contest as open (a recommendation is welcome, flagged as such).

## Tonight's verdicts from Cory on Blue (calibration, read closely)
- Claim ("only you can recruit a marked shop member"): ❌ "promote and ransom are just straight up way better".
- Dig (pull a pile card into the shop): ❌ "No this is so weak. shit like this makes me feel like you dont understand the game at all".
- Cash in a card (bury a shop member, gain blue = its cost): ❌ "way too strong. it would be like +10 blue in round 2".
- Round I churn/flip/peek: "those Blue Round 1 kinda don't scale".
- Getting blue from cards going to the bottom between rounds: ❌ "seems too strong between rounds".
- Buy twice: ✅. Member idea he liked: **"you can always buy twice"**.
- "Borrow a recruit" (use a shop member's On Recruit): good, but "for Red rather than blue".
- Recruiting one of the peeked cards as your buy: liked, "but it's awkward because they are in different phases".
- "Maybe the number of members in the shop should grow each round? maybe not." (an idea, not a rule)

## Members Cory has liked (with his words) — study their SHAPE
Recluse ("I love this one a lot": game end +2 followers per rival with more members than you). Squatter ("really great… maybe TOO strong in round III"). Doppelganger ("really good, almost any build takes it"). Stunt Double ("one-time activate. Elegant."). Impressionist ("great"). Straggler (he "really likes" it). Extra Hand ("SUPER strong"). Front-runner, Freelancer ("good set!"). Treasurer ("really good"). Penny Pincher ("good, could get a little crazy"). Underdog ("likes it, interactive"). Rainmaker ("likes it, should cost more"). Banker, Busker, Host: steady income ("they all kind of feel weak… except for scoring ones or passive income"). Panel (his own: worth 3, Promote or Demote another member). Mob (worth 5, +1 per red member at game end). Loyalists (worth 2, your members can't be swapped). Chronicler (his rewrite: +1 follower per green member). Retinue ("needs to be more members. More followers"). Launderer (his idea: "On recruit he lets you rearrange your money as you please"). "You can always buy twice" (tonight).
Rejected or disliked: Big Spender (hard to show), Sleepwalker (too hard to track), Lender ("a little too complicated"), Mime (pays for itself at once: "doesn't love"), Hustler ("nothing players have to remember"), Lottery Winner, Banker at 8 ("too dear"), Bookkeeper ("bad"), Overseer (cut), the 8 neutrals (out-of-turn placement), cost reductions (dropped), anything about Release, small "+1 when…" triggers on rivals' turns.

## Cory's added member principle (tonight)
**"Interesting but not complicated."** Every member pitch must pass it.

## Deck visibility (Cory tonight)
"Think about how many members will be seen in a game from a deck. It's good not to assume a player will be able to see/buy all of a color in a given game (or maybe they should be?)". Count it from the rules (no sims) and lay out both options as a pick with a recommendation.

## Rules for every agent
- No sims, no game runs, no code changes. Read and think.
- Pitch broad ideas; give concrete cards and numbers only to illustrate a principle or when pricing is the point, and label every one "(Claude's fill-in)".
- Quote live card text in a few words whenever you name a card.
- Never name another specific color in a card's text (interplay is generic: resources, colors, spaces, members, rivals, the leader).
- Check every idea against the ledger's ❌ tags: no rescue clauses, no spending to use a space, no out-of-turn minion placement, no win-more, no cost reductions, no Release, no hidden tracking ("nothing remembers last round"), no member loss before round III unless it's a Cory-style harm he's accepted, nothing hard to show on screen, no slight variations of existing cards.
- Write plainly. No hype words.
