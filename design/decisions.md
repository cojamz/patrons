# Design Log

One line per decision or idea. Newest at the bottom. Status: ✅ decided · 💡 idea · ❓ open.

## 2026-10-09 — Kickoff (v4 rework)
- ✅ Rework, not a rewrite-from-zero. Keep the core loop: draft actions → gain resources → buy things that improve your drafts.
- ✅ Keep the soul: reading opponents, "will my spot still be open?"
- ✅ Main problem: too complicated to approach. Simplify the design AND rebuild the UI to feel tactile and obvious.
- ✅ Old game stays playable on `main`. All rework happens on a separate branch.
- ✅ Cory designs; Claude builds, tests, simulates, critiques.
- ❓ What exactly the new direction is — to be found together, starting from a teardown of v3.

## 2026-10-09 — Core stays, focus on approachability + visuals
- ✅ Core loop is fixed: snake-draft actions from a mostly communal pool → actions give you resources → a shop to buy engine upgrades. Don't redesign this.
- ✅ The rework is about making it easy to learn and finding a great way to visualize it, not inventing new mechanics.
- 💡 Board as a circle: each quadrant is one god. Spin the wheel toward you to look at a quadrant's options. One shared board everyone looks at, like a real table.
- ❌ The three alternate directions in `design/directions.md` (Shrines, Patron Hand, Piles) are shelved. Too much redesign.

## 2026-10-09 — Wheel sketch + where the game is broken
- ✅ The wheel board is the visual direction. The sketch's fidelity is about right. Mocks are illustrations, not full builds.
- 💡 Shop could sit apart from the god cards. But keep the rule that you must take an action at a god to buy from its shop.
- ✅ Keep the structure and themes. Rework the resources and the play, and rebalance rather than revamp.
- ✅ The biggest gap is scoring. It's too complex and too opaque, so players can't tell how they're doing. Engine-building should stay rich, and scoring should become obvious.
- ❓ What are the other balance and design gaps? Claude is reviewing the game and the playtest/sim history.

## 2026-10-09 — Scoring shape + modular quadrants
- ✅ The round-3 burst is intentional, like Civ: small early choices build the engine that explodes in round 3. Keep it.
- ✅ Favor can go down. The problem is only that Favor comes from too many sources to track.
- ✅ Quadrants are modular: swap different ones in, each plays very differently with its own interactions, so no two games are the same.
- 💡 (Claude) Each quadrant has exactly ONE printed way to earn Favor. 4 quadrants means 4 scoring rules a game, and swapping quadrants changes how the game is won.
- ❓ Working through a sample quadrant (Gold) at concept level. See chat for the three stabs.

## 2026-10-09 — Gold quadrant in a vacuum
- ✅ One quadrant per player. Everyone starts with 3 workers, and in round 1 every action space gets filled.
- ✅ Gold scores by the Crown: whoever has the most gold at round end gets the Favor. Someone can run away with it if nobody stops them, and that's on purpose.
- ✅ Keep some patron flavor in Gold.
- ✅ Tracking difficulty is the UI's job. Only cut rules if we can't make them easy to track on screen.
- 💡 (Claude) Gold round-1 actions: Mint (+2 gold), Patron (+1 gold, plus +1 each time anyone uses a quadrant you pick), Levy (take 1 gold from the leader). Gold's shop costs gold, so buying engine upgrades costs you Crown standing.

## 2026-10-09 — Board layout + item shop
- ✅ The old shop layer is out for now. An ITEM shop replaces it.
- ✅ Board = concentric wheel. Outer ring is round 1, inner ring is round 2, center is round 3. The quadrants fit together across all three rings.
- ❓ One item shop per quadrant, or one combined shop? (Claude's lean: one combined market beside the wheel, with items color-tagged by quadrant.)

## 2026-10-09 — Starting resources
- ✅ At setup, each player picks their 2 starting resources in one go, in seat order from first to last, with everyone watching.
- ✅ Seeing what others pick helps you read them. Going first is a slight disadvantage because you reveal your plan first, which offsets having first pick in round 1.
- ✅ Champions are cut. Picking 2 starting resources replaces them: it's personal, balanced by nature (everyone picks from the same pool), and gives round 1 some juice.
- ✅ The four-quadrant draft in `design/quadrants.md` is liked as the working base.
- ✅ No simulator yet. Rules will still shift, so wait until they settle.
- ❓ Items: one random shared market, or 1–2 items sitting on each quadrant (buyable only when you use it)? Claude leans per-quadrant: the purchase becomes part of the placement read, and items travel with their quadrant when it's swapped.
- ✅ Items sit on a separate market board, not on the wheel, because you interact with them differently. One stall per quadrant, two items each. A stall lights up after you place in its quadrant.

## 2026-10-09 — Design ideal + Gold scoring locked
- ✅ Ideal: no quadrant or action should feel weaker than another. The depth comes from creativity, from how you combine them.
- ✅ Gold scores by the Crown: most gold at the end of each round takes X Favor, and ties share it. Values to tune (working: 2 / 4 / 6).
- ✅ Each round's scoring is printed on the board, in that quadrant's ring, so it's clear. It should be visually distinct from the actions but sit neatly alongside them.
- 💡 (Claude) New Gold R1 actions: Patronage (+1 gold, sponsor an empty space: whoever takes it, you both gain 1 gold; a lure, not a toll, since every round-1 space gets filled and a toll would only punish the last pick), Interest (+1 gold plus 1 per 3 held), Exchange (trade any 2 resources for 3 gold). Each scales with the game, so they stay live in later rounds.
- ✅ Design check for every action: every space fills in round 1, so a penalty tied to a space only hits whoever is forced to pick last. Prefer lures over tolls.
- ✅ Actions should be elemental: simple verbs that items and later spaces can hook into and amplify.
- 💡 Gold verb candidates: Mint (+2), Sponsor (coin on a space, taker and you both +1), Interest (+1 per 3 held), Exchange (2 any → 3 gold), Wager (stake gold on winning the Crown, doubled or lost), Lend (give 2 gold now, repaid 3 at round end).

## 2026-10-09 — Names dropped; where Favor comes from
- ✅ Quadrant god names are dropped. Colors stay.
- ❓ Favor sources: the per-round ring rules (with round 3 as the burst) plus some items? If items are rarer, should the currency shrink or move off-center? Or should items be more frequent and robust, with a wider spread of costs, so buying feels like collecting passives (and some activatables)?
- ✅ The market has permanent fixtures, like Dominion's victory piles. Any resources buy Favor at fixed, always-open tiers that get more efficient as they get bigger (working: Laurel 2→1, Garland 5→3, Diadem 8→6, with limited Diadems). One purchase per turn: either an item from the stall you just visited, or a fixture.
- ✅ (from discussion) Two Favor channels: ring contests (public, per round) and items (private; top-cost items carry Favor). Resources have two jobs, counting toward ring contests or being spent on items. Market should feel like a bazaar: frequent cheap items, rare grand ones, with a wide cost spread.
- ✅ The market is a second, smaller round board. Colored items sit around its edge, one stall per quadrant color, and the neutral Favor fixtures sit in the middle as repeatable buys.
- ✅ Everyone's items are public knowledge.
- ❓ Revisit later: should buying be limited to the stall of the quadrant you just played? Keeping it for now as a trial.
- ✅ Reframe: the game is mostly about buying lots of items and escalating your resources to buy the communal Favor fixtures, Dominion-style (may change later). The ring contests are supporting tension.
- ✅ Guard rail: no exponential races in silos. The game must feel very interactive, but never feel BAD.
- 💡 (Claude) How: interact through the board, not at people. Compete for shared spaces, items, contests and the Diadem clock. Many actions spill a little gain onto others (Patronage-style). Items trigger off rivals' plays, so you watch them. Direct harm is rare, small, and only aimed at the leader.

## 2026-10-09 — Quadrant set v2
- ✅ Old items are thrown out (kept only as a cross-reference in git history).
- ✅ Design principles are now distilled into `.claude/rules/design-principles.md`, which auto-loads every session.
- 💡 (Claude) Quadrants v2 drafted in `design/quadrants.md` (viewable in `design/quadrants.html`): Gold the merchant, Shadow the thief, Verdant the gardener, Sunlight the giver. All interplay is generic.
- ✅ Scoring happens at round end. Nothing changes Favor in real time during a round (for now), because it confuses players. Claude may bend this as an experiment and report back.
- ✅ The evaluator is a team of agents: blind judges, mind-playtesters who hold a written game state and play moves out, a red team, and a synthesizer. Use cutting-edge harness patterns.

## 2026-10-09 — Theme: Cult Wars
- ✅ (working frame, don't over-commit) You're a cult leader taking actions on the wheel to build your cult.
- ✅ The items you buy are cult **members**.
- ✅ Victory points are **followers**. Followers include your members and yourself, so everyone starts with 1.
- ✅ Members lean toward certain actions or spheres (wealth, subterfuge, charisma and "getting people to switch"…), so who you recruit shapes what you do.
- 💡 Hooks this unlocks: things that scale with the size of your following or your member count; X resource per member; releasing a member for a resource.
- ✅ Use it as the brainstorming frame. It gives the design a cohesive feel.
- ✅ The communal fixtures are bulk followers (the 6-point fixture = 6 followers). They're the organic way to grow your following.
- ✅ Scoring is Dominion-like in scale. A game can be low-scoring for everyone or extremely high-scoring, depending on which spheres are on the wheel and which members can be recruited. Different tables, different engines.
- 💡 Maybe: a neutral pile of basic members always available for each sphere (like Dominion's base cards), to grease the wheels. To consider, not decided.
- ✅ Don't over-index on "cult" (religious, sacrificial and so on). The frame is light: members and followers. Quadrants should stay unique and varied, defined by their mechanics, not bound to an arbitrary theme.
- ✅ A quadrant's round-III action doesn't have to gain or convert followers. It just needs to be powerful in general.
- ✅ Members, like the old items, cost a specific part (the sphere's own resource) plus a wild part (any resources). Some members cost only wild.
- ❓ (Cory) Members feel less numerous and integral than they should be. Revisit how many get recruited, how cheap the common ones are, and how much they shape your actions.
- ✅ Division of labor for spheres: Claude brings broad ideas (the core mechanic, how it scores, how it feels and how it touches other spheres). Cory does the granular design: actions, numbers and members.

## 2026-10-09 — Gold, Cory's pass
- 💡 Cory is designing Gold himself. Ideas are captured in `design/spheres/gold.md`: the Crown (most gold gets followers or members each round), gold as member money, Joint Venture, Jackpot, a round-II cash-out, Banker, Alchemist, Tycoon, and a "counts double" member.
- 💡 Doppelganger: an expensive member that copies another member. Any sphere.
- ✅ (Cory) Everything should feel vaguely powerful. Open, relative amounts (double, half and so on) beat small fixed numbers.
- 💡 (Cory) He likes a sphere that moves members around, one that's about members themselves. Claude's broad sketch, a "Guild" sphere, is in chat: recruit, swap, poach (paying the leader), release, copy. It scores on member count or member variety. Doppelganger fits here.
- (Cory) Member-mover sphere: he likes the actions (recruit anywhere, swap, poach paying the leader, release, copy). He doesn't like count- or variety-based scoring.
- ✅ (Cory) Members come in copies, a couple of each, so no one can monopolize a member. It also deepens each sphere's deck, which fixes stalls running dry.
- ✅ (Cory) One player can own both copies and stack them. Everything stacks, multipliers included (two Treasurers is fine).
