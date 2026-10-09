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
