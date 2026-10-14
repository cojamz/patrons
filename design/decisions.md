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
- ✅ (Cory) Each quadrant aims for 10 members (with a couple of copies each).

## 2026-10-10 — Member economy
- ✅ (Cory) Drop the "buy from the quadrant you just played" rule. Any face-up member is buyable. Why: buying a member is usually the best move, and the stall rule just starved people.
- ✅ (Cory) One combined market: all spheres' members in one deck, 5 face up.
- ✅ Buys per player ≈ 1.5 / 3 / 4 by round (~8.5 a game, ~34 at 4 players), with some buys going to fixtures.
- ✅ (Claude, answering "5 unique feels thin") Don't size the deck to the buys. Keep 10 kinds × 2 per sphere (~80 cards); most go unseen each game, which is the replay variety.
- ❓ Is "always buy a member" too automatic? Watch it once fixtures and costs are real; resources, not the pool, should be the limit.
- ✅ (Cory) 80 feels like a lot; not everything needs a duplicate. Working: workhorses doubled, signature members single, ~14 cards per sphere, ~56 total.
- ✅ (Cory) Deck is 60: 15 cards per sphere, 10 member types, 5 of them doubled.
- ❌ (Cory) Patron is out of Gold; he never okayed it. Gold has 9 members, and the 5th pair is open.
- ❌ (Cory) Steward and Gambler are out. Gold has 7 members: pairs are Banker, Prospector, Middleman and Treasurer; singles are Speculator, Tycoon and Alchemist. 1 pair slot and 2 single slots are open.
- 💡 (Cory) Gold member: whenever you use a gold action, gain 1 gold. It overlaps Prospector. The difference: it triggers on any gold space, including ones that spend gold (Cash Out), while Prospector triggers on any gold gain from any sphere.
- ✅ (Cory) Alchemist: 2 other resources always count as gold (Claude's reading: you pick 2 resource types, and they count as gold everywhere, for the Crown and for paying).
- ✅ (Cory) Alchemist doesn't feed doubling: Strike and Speculator double only real gold.
- 💡 (Cory) Gold wants a couple of activated members. Claude's ideas, each usable once per round on your turn: Broker (recruit a member paying its whole cost in gold), Climber (raise your gold to match the player just ahead of you), Fence (swap any amount of gold 1:1 for other resources).
- ❌ (Cory) Broker and Climber are rejected. Gold's 2 open singles are his to fill.
- 💡 (Cory) Gold activated single: once per round, pay 3–4 gold to bribe a rival's member over to you. Claude: only from a player ahead of you, and they get the gold, per the harm-points-up rule. It overlaps the buy-off idea that was moved to the member-mover sphere.
- ✅ (Cory) Gold single, activated: once per round, pay 4 gold to bribe another player's member to come over. As he said it: any player, the gold goes to the bank. It's a deliberate exception to harm-points-up.

## 2026-10-12 — Start basic
- ✅ (Cory) We're getting too complicated. Start basic for actions and members, and add complexity later. Gold gets redone as a basic layer; Alchemist, the bribe and the gold-space member are parked for layer 2.
- ✅ (Cory) Gold basic: keep Joint Venture and Strike. Round II gets Windfall (+1 gold per member), replacing Mint. Round I has one open slot.
- ✅ (Cory) Gold ring II: steal 2 gold from a player (any player). It replaces Cash Out. Like the bribe, it's a deliberate exception to harm-points-up.
- ✅ (Cory) Gold ring I: Rush (+2 gold per round number) and a discount: your next member costs 2 less, off any part of the cost (1 gold + 1 wild becomes free; with 2 gold + 2 wild you choose which 2 to skip). Tribute is out. Claude's reading: the discount waits until your next recruit.
- ✅ (Cory) Gold ring II: Steal takes 3 gold from any combination of players.
- 💡 (Cory) Members could upgrade individual actions. Claude drafted one upgrade per Gold action (see gold.md).
- ❌ (Cory) He doesn't like the 30-member pool. Also: 4 resources for a 2-follower member is too expensive.
- ✅ (Cory) Fixtures: 2→1, 4→3, 6→6. He says something feels a little off. Claude's read: at 1:1, late resources are followers outright, so Strike doubles followers and members (~3 for 1 follower + effect) can't keep up.
- ✅ (Cory) Member costs vary: the cheapest 1–2, most around 2–3, the most expensive 5–6.
- ✅ (Cory) Gold member pool narrowed to 24 keepers (see gold-members-pool.md). He likes the direction.
- ✅ Cory's member taste so far:
  - Likes: simple effects; hooks into other quadrants (Midas, Tinker, Coin Purse); steady income (Banker, Interest); rival-watching on fixtures and recruits; catch-up (Underdog, Safety Net); time-shifts (Investor).
  - Dislikes: Crown-specific effects; win-more; fiddly timing for small gains; anything hooking mechanics that don't exist yet (trade, release).
- ✅ (Cory) 15 member types per quadrant for now. (Claude's reading: 15 types, up from 10. Copies are still to settle.)
- ✅ (Cory) Don't call them fixtures. For now they're just "followers" (buying followers).
- ✅ (Cory) Gold's 15: Midas, Banker, Prospector, Tax Collector, Merchant, Thrift, Coin Purse, Underdog, Tinker, Investor, Jackpot, Speculator, Tycoon, Seed Money, Hustler. Dropped Goldsmith, Counterfeiter and Diversifier.

## 2026-10-13 — Red
- ✅ (Cory) Red scoring: most members at round end; red members break ties. Red members are usually cheap (the synergy).
- ✅ (Cory) Red I: Scout (+2 red, put a face-up member at the bottom of the pile) and +1 red per member recruited this round by anyone (worth waiting for). Muster is out. One slot is open.
- ❓ (Cory) We need better terms for the face-up row ("shop") and the member pile.
- ✅ (Cory) Red I: Hire — recruit the cheapest face-up member, free. Round I is complete.
- ✅ (Cory) Red II: +2 red and recruit the cheapest face-up member free; and swap one of your members with another player's.
- ✅ (Cory) Red III: take a member for free. Rally, Encore and Payroll weren't strong enough. Open: from the face-up row, or from a rival.
- ✅ (Cory) Red III: take any face-up member in the shop, free. Cory said the shop has "6 or 7" face-up members; it was 5. Check.
- ✅ (Cory) The shop shows 6 face-up members (was 5).
- ✅ (Cory) Red keeps "most members" scoring. People gain members in other spheres too, so it won't run away.
- ✅ (Cory) Weaker versions of other actions are good: they give the draft its texture (miss the strong one, take the weak one; or take the strong one to deny it). Hire stays alongside Hire Up.
- ✅ (Cory) Don't price scaling actions at their theoretical max. In a draft, people grab them before they peak (Turnout).
- ✅ (Cory) Trade is a little too strong. "They pick" is rejected; alternatives are pending.
- ✅ (Cory) Trade: swap one of your members for another player's costing no more than yours +1.
- ✅ (Cory) Red members: 13 keepers plus 3 maybes (see red-members-pool.md). Proselytizer is now 'whenever you recruit a member, gain a follower'. Founder becomes Mentor & Protégé (cost 5).
- ✅ Playable hot-seat prototype: design/prototypes/play.html (https://claude.ai/artifact/D32uNuYuSq3pUEn4VrQ8YN). Gold and Red as designed; Blue and Green are plain stand-ins. Working calls: rings pay +2/+4/+6 and ties all score; wild costs are paid from blue/green/red before gold; Investor sets aside half automatically. First bot finding: gold piles up at game end (20–60 left), because the follower buys need 2–3 colors.

## 2026-10-14 — Rule calls for the build
- ✅ (Cory) Doppelganger copies member count too (copying Twins counts as 2 members).
- ✅ (Cory) You choose where a discount comes off (the colored part or "any").
- ✅ (Cory) You choose which resources pay "any" costs (and follower buys).
- ✅ (Cory) Fine for now: ties all score the full ring value; every quadrant pays +2/+4/+6; turn-order ties go to whoever picked later last round; you can start with the same color twice; one copy of each member (15 per quadrant); Twins and Big Family are worth 2 and 3 followers; Midas is an on/off switch for gains from actions; Tinker only fires on gains from actions; Underdog doubles every gold gain; Steal must take all 3 if it can; Hire ties let you pick.
- ✅ (Claude, working call) Final ties go to more members; it's in the rulebook. A Discount waits for a member that costs something (a free Volunteer doesn't use it up).
- ✅ (Cory) Investor asks how much gold to set aside (choices: none, ¼, ½, ¾, all).
- ✅ (Cory) Proselytizer's follower counts the moment you recruit. The round-end principle only covers round-end bonuses.
- ✅ (Cory) Doppelganger effectively becomes a copy of the member card: its effect, member count and follower value.
- ✅ (Cory) Member costs: Claude makes an informed pass, using bot win rates as one input.

## 2026-10-14 — Blind panel 1 + balance read
- Blind panel 1 (laptop newcomer, phone, saboteur): all three said NOT YET, overall C / C- / C+. The common problems: reload and Leave lose the game; developer copy on screen; 4-letter codes on the wheel; hover-only information on touch; the "1" glyph reads as "I"; unlabeled worker dots; no answer to illegal clicks; layout jumps. All of it was sent to the UI fix round.
- Rule fixes from the panel: Recruiting Drive pays on your 2nd recruit (so it's spendable); Steal names who it took from; the rulebook now explains free recruits, contest timing, the turn-order tiebreak and that each quadrant prints its own rule.
- ❓ Balance (bots, 2000 games): the seat that picks last in round I wins ~32% vs ~23%. Picking last in a round lets you snipe the round-end contests. For Cory.
- ✅ (Cory) Ring contests stay as big as they are for now (37% of a winner's followers).
- ✅ (Cory) Round I turn order is random.
- ✅ (Claude, per Cory "make some gold changes") Gold is money: each gold counts as any color when buying followers. Gold quadrant flag, in the rulebook.
- ✅ (Cory: buff/rework the weak Gold cards) Underdog: doubled while anyone has more gold than you. Tinker: an action gaining another resource also gives half as much gold. Hustler: +1 gold per round number in your color. Re-measured: Underdog 6.7, Tinker 4.9 (both repriced to 3), Hustler 1.3 (still weak), Investor 1.9.
- ❓ Even with random round I, whoever picks LAST in round I wins ~33% (2000 games). It's the position, not the seat.
- Note: gold left at game end is still ~22 per player even with the gold sink. Mostly that's held for the Crown and freshly Struck in round III with no buys left. That may be fine.
- Done: local games run on one implementation (session/local.js, with resume and strict undo).
- Finding (1500 bot games per variant): the round-I last-picker edge (~33% vs ~22%) comes from Turnout. Variants: +1 starting resource for the first picker gives 25/20/24/31; no contests gives 22/21/26/32 (so contests aren't the cause); flipping the tiebreak gives 21/22/25/32; Turnout flat at +3 gives 28/27/23/23; Turnout capped at 4 gives 20/22/24/33; Turnout at +1 per 2 recruits gives 30/25/25/20. Cory's call.
- ✅ (Cory) Keep Turnout as is. The last-picker edge is probably a bot blind spot (greedy bots never take Turnout early to deny it). The thinking-bot run will check it.
- ✅ (Cory) New sphere wanted: Yellow, themed on the old yellow quadrant (getting various resources). Four design agents launched in parallel: Yellow (variety and sets), Tempo (turn order and echo), Territory (claim spaces), Patronage (giving). Each builds and measures its sphere and hands Cory a numbered list.
- ✅ (Cory) Add a Thieves sphere (stealing resources and members). Scoring is open; the agent is testing 'most loot' (a visible stolen pile), 'most members from other colors', 'most black' and 'fewest resources'.
- ❌ (Cory) Tempo, Territory and Patronage are bad ideas. Their designers were stopped and deleted. Yellow and Thieves continue.
- ✅ (Cory) The sphere design principles (8 points) are approved. They're in design/sphere-brief.md.
- ✅ (Cory) Scoring rules must measure visible state (resources, members, a visible pile), never counts of events during turns. Anyone glancing at the other players can see who's winning each contest.
- ✅ (Cory) He likes all five older-game ideas: Echo (old green), Market (old blue), Trading (old white), Purple (extra turns; a rough fit, needs rethinking) and Silver (gifts for everyone). Once Yellow and Thieves look solid and pass critic agents, launch designers on all five, with win conditions rethought under the visible-state rule.
- Finding (thinking bot, 16 games): round III isn't flat for a strong player (placements across 24 spaces; buys 41 members vs 38 follower buys). Hoarding isn't dominant: the thinker won 9/16 with ~10 gold left vs ~24 for greedy bots. No rule change; live contest standings should teach new players.
- ✅ (Cory: go go go) Five more sphere designers launched in parallel: Echo (green), Market (blue), Trading (white), Purple (timing; rethink), Silver (spill). Visible-state scoring is a hard rule. Critic agents check every sphere before Cory sees it.
- (Cory, first read of the drafts) Yellow members are OK. The actions are too strong and not well considered: Bloom (+6 early) is crazy, Flourish is crazy, Transmute should give +1 yellow. Black: nothing (or very little) should give black except stealing, since black is loot; Pickpocket read as 2 from everyone (insane). Both are being redone with value math per action.
- ✅ (Cory) Twins and Big Family don't count as extra members. They're single members worth 2★ and 3★ followers.
