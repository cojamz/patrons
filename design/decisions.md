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
- ❓ (panel 3, tester G) Gold counting as any color makes 'gold → 6 followers' (doubled by Strike or Speculator) the dominant line: 36 of their 46 followers came from 5 buys with 5 members. Claude's working call (gold wild) needs Cory's verdict.
- ✅ (Cory, 2026-10-14) Members per player are too high (~10). Target is about 6–7 each, maybe 10 in an unusual game. "Nobody buying followers?" was asked; it was follower cards he meant by "count double".
- ❓ (open, Claude's recommendation: yes) Double every member's cost to reach ~6.8 members per player (sim: ×1.5 → 8.7, ×2 → 6.8, about 16 bought followers each).
- ❓ (open, Claude's recommendation: yes) Gold counts as any color for the 2-for-1 and 4-for-3 follower buys, but not the 6-for-6.
- ✅ (Cory) Red's tiebreak (red members) is now printed in Red's scoring label and the rulebook, after a blind tester read "ties all score" and saw one tied leader paid.
- Finding (thinking bot): on every new-sphere table the thinker wins 65–90% (stand-in table ~55%) and places far less on the new sphere than greedy bots do (Echo 15% vs 33%). The greedy bots likely overvalue new spaces, so greedy-bot action values for new spheres are suspect. Check with 2 thinkers before quoting balance.
- ✅ (Cory) Loot must be spendable. Black change: stolen goods become black in your supply at once; no loot piles; scoring is most black at round end.
- ✅ (Cory) Black scoring is 'most Black members' for now (not most black, which copied Gold's contest).
- ✅ (Cory) The thieves sphere's color is magenta, not black (black was hard to see on the table).
- 💡 (Cory) Many spheres feel same-y; we're missing something in the design space. The atoms are spaces/workers, currencies, members, followers. Claude's read: almost everything pays out in currency, colors have no distinct job, and each atom has one fixed rule. Levers pitched: give each color a job (Claude's pick), members that bend your rules, workers/spaces with more than one rule. Awaiting Cory.
- ✅ (Cory) Design direction: members that bend the rules (not new income). Calibrate on a handful of example members with Cory before scaling.
- Finding (thinking bot, 50 games, plain table): thinker wins 78% (39/50). So its 65–90% on new-sphere tables is the instrument, not the spheres.
- Finding (panel 6, tester S): buying followers dominates recruiting (won with 3 members, 39/48 from buys). Claude withdraws the cost-doubling recommendation (it would worsen this). Variant sims running: gold not wild on 6-buy, 6-buy costs 8, both, members +1★.
- ✅ (Cory) Member costs ×2, and the 6-follower buy costs 8 (still gives 6). Sims: ~5.8 members/player (winner ~6.8), pure follower-buying 31% vs 25% parity. Gold-wild question dropped (no effect).
- 💡 (Cory) Maybe a higher tier of follower buy above 8→6. Measuring.
- ✅ (Cory) Add a top follower tier: 10 resources → 10 followers. Build it now, tune numbers after.
- ✅ (Cory) Design target, Dominion's Big Money: just buying followers is a solid baseline strategy that a good member engine beats.
- ✅ (Cory) Testers report what FEELS unfair or unfun, on both sides of an interaction. Member movement is wanted; the question is how it can sting in a good way (e.g. member theft).
- ✅ (Cory) Target: the pure 'big followers' strategy wins ~25% of 4-player games (20–30% ideal, 15–30% acceptable). Outside that, retune.
- ✅ (Cory) Rule-bending members, first set ("good set!"):
  - Squatter (once/round place on a taken space): yes; very strong, make it expensive.
  - Big Spender (once/round buy twice): yes.
  - Early Bird (next ring's space): no, too strong.
  - Freelancer (pay colored part in any colors): yes; belongs to Yellow.
  - Insider (also recruit from top 3 of the pile): yes; expensive. He wants more interaction with the pile.
  - Extra Hand (+1 worker in round III): yes, but SUPER strong; price very carefully.
  - Fence/Release (once/round release a member for its cost in any colors): yes; try it as a base rule for everyone.
  - Front-runner (always pick first in a round): yes.
- ✅ (Cory) New member, Straggler: after the last worker of the round is placed, move one of your workers to an unused space and take that action (useful in rounds II–III only). Purple's old Straggler gets renamed.
- 💡 (Cory) Relics: no, too similar to members. Omens: liked, but must not hand a committed color a lucky round; prefers neutral. Options pitched: all omens face up at setup, trailing player picks from 2, structural-only effects; alternatives Rank, Titles, Devotion.
- ✅ (Cory) Omens: tabled until we see whether the game needs it. If used, all three are revealed (or peekable) up front.
- ❌ (Cory) Rank: no, win-more. Titles: maybe, but he doesn't like the mechanism. Devotion: second favorite after Omens.
- 💡 (Cory) Maybe members need more types that overlap across spheres (think Wingspan).
- ✅ (Cory) Tabled for later, in priority order: 1) role tags across spheres (Wingspan-style; e.g. round goals by role), 2) Omens (three revealed up front), 3) Devotion.
- ✅ (Cory) Put all five drafts (Green/Echo, Silver, Purple, Blue/Market, White/Trading) on the table as drafts with their critic-approved defaults; judge them by playing, not by reading lists.
- ✅ (Cory) Claude may adjust and rework the unconfirmed spheres (Green, Silver, Purple, Blue, White, Yellow, Magenta details) as playtest feedback comes in. Log each change here; Cory's earlier calls on them still stand.
- Built (Claude): the approved rule-benders plus Straggler as guest members in the shared deck, and Release as a base rule (toggleable). Measured prices: Squatter 8, Big Spender 4, Freelancer 4 (Yellow), Insider 6, Extra Hand 10, Front-runner 2, Straggler 8. Details in design/rule-benders.md. Purple's old Straggler is now Late Riser.
- Finding (normal bots): the pure big-followers strategy wins ~8% against the new normal bot with or without Release (29% against easy bots). Release barely moves it; the bot level does.
- ✅ (Cory) Joint Venture's gold is a gift: a Guest (Silver: "whenever another player gives you something, +1 more of it") gets +1.
- ✅ (Cory) Heist takes the card, not an Investor's set-aside gold: that gold goes back to the victim, not doubled.
- ✅ (Cory) Weaver and Extortionist fire on the 10-follower buy too ("6 or more").
- ✅ (Cory) Releasing (or trading in) an Investor: its set-aside gold comes back, not doubled.
- ✅ (Cory) Hideout protects resources only, not members: "Take 1 resource from a rival. Then no one can steal resources from you this round." (So it doesn't block Trade, Heist or Ransom.)
- ✅ (Cory) Priority: anything that makes the game playable by humans comes first. Improve the thinking bots, but no rabbit holes with bots or agent prompting. To-do list: design/todo.md.
- ✅ (Cory) The face-up members for sale must be visible while picking starting resources: what's for sale informs the pick.
- ❌ (Cory) Relay (Purple: pay 3 purple to answer a rival's extra turn with one of your own) is cut: it doesn't make sense. Claude brings 2–3 priced replacements.

## 2026-10-14 — Cory's first play of the v4 build (notes)
- ✅ (Cory) "The game works great." For fixes for now, Claude goes with his gut (defaults on open questions), logged here so Cory can overturn any.
- ✅ (Cory) Follower buys don't require multiple colors: 2→1, 4→3, 8→6 and 10→10 take any resources.
- ✅ (Cory) You can't sell followers attached to members without getting rid of the member. (So only loose followers sell; Pawn's sale is dead in round I and Pawn needs rework.)
- ❌ (Cory) Shift Crew too expensive; Clockmaker too expensive, and purple is worth nothing at the end of round III. Claude: plain-follower members back to their pre-doubling cost (they don't pay for an ability); Clockmaker 4 and pays at round start.
- (Cory) Feast Hall should be better or worth more; many members are miscosted, so pricing needs a more robust exercise (the fair-price screen over every card).
- (Cory) Linger is just bad; Rally makes no sense (a worker spent to get a worker). Purple's ring II/III need rework. Most workers on the board is almost always a tie (Claude's gut: ties score nothing).
- (Cory) Cash In and Magnate seem redundant, and Cash In maybe too strong. White needs a pass.
- (Cory) Green needs tweaking as a whole.
- (Cory) UI: animations are good but it's still too hard to tell what's going on; choosing how to pay is overcomplicated and not tactile; the board is overwhelming (too many spaces, hover to read).
- Claude's gut calls under "go with your gut": Watchdog blocks Red's Trade; stolen loot stays magenta (Midas/Underdog don't apply); use/buy-then-release allowed; Release on; Late Riser name; discounts doubled with costs; 10→10 is the game-end clock; Investor's or Sower's set-aside comes back undoubled whenever the card leaves; Doppelganger doesn't re-fire a copied "when recruited"; Prospector/Tinker/Hustler bonuses and Investor's return aren't "gold gains" for Underdog; Underdog doubles Rainmaker and Speculator; Lamplighter pays the printed 3/4/5; a copied Underdog doubles once; Linger's text says it counts as an extra turn (moot if Linger is reworked).
- ❓ (Cory) Big problem: a member you like is usually bought before your turn comes back, so it's hard to build toward a strategy. Options pitched: 1) Reserve as a base rule (Splendor: instead of buying, hold one face-up member only you can recruit later; max 1) [Claude's pick]; 2) a private hand of 2–3 members each round; 3) plan by kind (role tags). Awaiting Cory.
- ✅ (Cory) The shop shows 10 face-up members (was 6): more of a community pool, so a member you want is more often still there.
- (Cory) Broad critique: the game feels too chaotic. Maybe unfamiliarity with the spaces, or not taking time to think; playing with 4 people may give more time. Watch item: ask friends after their first game; the 'what just happened' narration and slower bot pacing may help. Goal now: finish every running process and to-do, then package a playable multiplayer version for Cory and friends.
- ✅ (Cory) The game is called **Cults** now (the repo keeps its name).
- ✅ (Cory) Versioning: the build with all of today's inputs is **v0.2**. (Claude's scheme: v0.x are playtest releases; each release link Cory shares with friends bumps the minor number and gets a git tag; fixes on a release bump a patch, v0.2.1. The version shows on the home screen and in every saved game and game record.)
- ✅ (Cory) Little pixel art for every action and member, baked into the UI. Calibrate on a handful with Cory first, then do all of them.
- ✅ (Cory) Strip unneeded elements. Example: no separate round-contest progress strip; see who's winning by hovering (tapping on phone) the quadrant's scoring rule on the board.
- ✅ (Cory) Standing rule: fresh-eyes reviews at every milestone by a picky designer, an engineer and a board game enthusiast, each blind and new each time.
- Claude's gut calls (Cory delegated fixes) on card verifier B's questions: Price Check rounds down; a Spree reached through Straggler gives no extra buys; a Ransom paid from a Hideout isn't a steal; Sticky Fingers/Desperado count action steals only; Big Score keeps skipping a hidden top-magenta rival; Broker pays once per White action; Liquidator and Raider let the player choose how many; Translator/Wallflower don't re-apply on repeated copies; a Doppelganger copy of a "when recruited" member fires it once.
- ✅ (Cory) Rename the actions so they cleverly say what they do and fit the theme: a cult leader taking an action. Calibrate on a handful with Cory before renaming all. (Principle stays: the frame is light; leader verbs, not ritual or religion, unless Cory likes it.)
- ✅ (Cory) The designer reviewer must bring a perspective on what COULD BE, not just what's wrong: an expert designer with lots of outside design context, especially game UI. ui-critic now ends with a Vision section; a visionary design pass is running.
- ✅ (Cory) After each fresh-eyes trio, a synthesis brings the three reports together into the meta picture (themes, agreements, root causes, one ranked list), in addition to acting on each individually.
- Fix (Cory hit it): Steward didn't pay at round II start with 4 silver. It counted before other round-start income. Steward and Clockmaker now count after every other round-start payout, as a player reads 'at round start, +1 per N you hold'. Guard: cards-silver 'Steward counts after other round-start income'.
- ✅ (Cory) Basically every UI element has a hover that gives more info (long-press or tap on phone): numbers explain themselves, chips name their source, icons say what they are.
- ✅ (Cory) Some members are better as "now and at round start". Claude's pick (gut, prices to be re-checked by the fair-price screen): Banker, Host, Clockmaker, Lamplighter, Benefactor, Steward, Gardener, Peddler, Curator, Minimalist, Shopkeeper, Evergreen. Left as round-start only: set-asides (Investor, Sower), catch-up conditions (Late Bloomer, Safety Net, Late Riser), discounts (Planner, Underbidder), theft (Cutpurse, Mole), Social Climber, Afterimage.
- (Cory) After playing: loves how smoothly it runs; the UI is rough: SO much info, no clear hierarchy, maximalist. Direction for the redesign: radical hierarchy and restraint; most info one hover/tap away.
- ✅ (Cory) Pixel art approved (can be even more basic). Members are drawn in the color of their card (their sphere), so anyone's cult reads at a glance: your members on the table form a colored crowd.
- ✅ (Cory) The look is the **Lamplit Table** (design/prototypes/vision/). Adjustments:
  - Actions must be clearer on what they do without hovering: each space shows its icon plus a short readable effect.
  - Member pixel figures are distinct characters (not one silhouette), so players learn them over time; tinted in their sphere's color.
  - A visual of each player's cult: members as figures, plus something for followers so the cult looks bigger as it grows, without taking much space.
  - Keep the spinning wheel, but nothing elsewhere changes with the wheel's orientation (no "facing quadrant" panel).
  - Yes: pay by dropping coins into cost slots; the hierarchy rule (≤7 groups on screen, the rest one hover away); round end as "the Reckoning"; seat rail with sigils.
- ✅ (Cory) Much clearer UI for what's happening; at round end, a little animation showing which cult wins each prize (the Reckoning, quadrant by quadrant, followers flying to the winner).
- (Claude, under Cory's go-with-your-gut) Purple's ring is now "Most purple" (ties all score), replacing "most workers on the board, purple breaks ties". The old rule tied almost every round; at 4 players round I can't break the tie, since every space fills and extra turns need a spare space. So it was most purple under another name. "Ties score nothing" paid nobody in 100% / 69% / 40% of rounds I / II / III (easy bots, 300 random tables), so the design critic's call won. Purple held for the ring is the price of spending it on turns, and purple left at the end of round III scores +6.
- (Claude, under Cory's go-with-your-gut) Linger is replaced by Plan Ahead: "+2 purple per worker you have left to place this round." Linger was the same as placing on the space it moved to, minus Linger itself. Plan Ahead's takers won 27% (easy bots, 300 random tables; par 25%).
- (Claude, under Cory's go-with-your-gut) Overtime: "Pay 8 purple: take 2 extra turns right after this one. If you can't, +3 purple." One worker in, two out, so the extra turn is a net gain, not a worker spent to get a worker back. Takers won 26% at 8 and 29% at 6 (same instrument).
- (Claude, under Cory's go-with-your-gut) Rally: "Spend all your purple: 1 extra turn right after this one per 4 spent, plus 1 (up to 3). With less than 4, +4 purple." Double Time makes it 1 per 2. Takers won 37%, against Strike 33%, Jubilee 37% and Boom 39% (old Rally 21%). The "plus 1" means it never hands back just the worker it used. Watch: one player placing 4+ times in a row now happens in 57% of games.
- (Claude, under Cory's go-with-your-gut) Bookkeeper: "When you place your last worker of a round, +1 purple per 2 workers you have on the board." It used to pay at round end, after round III's last buy. Its "+1 per worker" version measured 8.4 followers and a 57% win rate (late purple decides the ring), so it's halved. Halved, it measured 5.0 and 44% (Banker 3.0 and 34% in the same run; Easy bots, 160 games), and the cost stays 6 (value × 1.5 − 1.5).
- Fix (found by the Purple agent's sims): two Straggler moves in one round (Straggler plus a Doppelganger copy) crashed the game when the second choice was stale. Each choice now re-checks the board and re-offers. Guard: straggler-twice.test.js.
- ✅ (Cory) Starting a game shows a short, skippable intro of the game's gist, using the animated pixel figures. Per player (each player sees and skips their own; nobody waits on it), not for the whole table.
- ✅ (Cory) Followers get their own symbol, not a star (★).
- ✅ (Cory) Workers are now **minions**: little spooky creatures, drawn as common emojis in pixel art (a nod to the old game's emojis, and funny).
  - Each player picks an emoji when joining; all their minions are that emoji, and their **cult leader** is a robed figure with the emoji on the robe.
  - Sizes: cult leader > members > minions > followers (Claude's reading of where minions sit; Cory said leader > members > followers).
  - About 20 random emojis to pick from (Santa, unicorn, surfer, bug…), as pixels. Each emoji is taken by one player per table. The emoji replaces the seat sigil as player identity.
- Purple rework landed (Claude, under go-with-your-gut; details in design/spheres/purple.md): Most purple; Plan Ahead replaces Linger; Overtime pays 8 for 2 extra turns; Rally spends all purple for turns; Bookkeeper pays at your last placement. Watch: one player now places 4+ times in a row in 57% of games, which may add to the chaos Cory felt.
- ✅ (Cory) Minions you haven't placed yet float around your cult leader (or another simple visible way), so minions left is seen, not counted.
- (Claude, under Cory's go-with-your-gut) Green: Echo is now "Copy a space a rival took since your last turn (not the center)" (was any outer-ring space this round), so its targets are in sight before you place. Yield 2.6/4.0/5.3 (Normal bots, 300 games). Why: design/eval/cory-notes-2026-10-14.md §3.
- (Claude, under Cory's go-with-your-gut) Green: Refrain replaces Recall: "+2 green, and copy one of your spaces from this round." Recall needed memory of last round's board and offered 11–13 chips. Yield 5.9/6.9 against Windfall 4.9/7.7.
- (Claude, under Cory's go-with-your-gut) Green: Understudy (4+2, "When recruited: copy a space a rival took since your last turn") replaces Choirmaster, which paid a rival for your copies. Member value +3.1.
- (Claude, under Cory's go-with-your-gut) Green: Ensemble (2+2, "Game end: +1 follower per green member") replaces Fan, which had nothing to do with copying. Member value +1.7.
- (Claude, under Cory's go-with-your-gut) Green: a copy chip whose free member nothing face up can match now says so: "a member (≤2; none face up)".
- (Claude) Green kept "Most green". The copy pile is an unspendable pile (Cory's Magenta call), and "+1 green per copy" didn't tie the contest to copying (copiers win it 67% vs 65%; same winner next round 49% vs 42%).
- (Claude, under Cory's go-with-your-gut) White: Pawn is now "Per round number: +1 follower or +2 white" (you pick the mix). It was "+2 white, and sell up to 1 follower per round number", and under the only-loose-followers-sell rule its sale was dead in round I. Why: design/eval/cory-notes-2026-10-14.md §2.
- (Claude, under Cory's go-with-your-gut) White: Cash In is replaced by Barter: "Recruit a face-up member, paying 1 follower per 2 of its cost, rounded up (only followers you've won or bought)." Cash In's uncapped 1-for-1 white→followers did Magnate's job at three times the rate, and it closed a "sell for 3, cash back in at par" loop. Magnate stays. Bots barter about once a game.
- (Claude, under Cory's go-with-your-gut) White: Broker pays once per action (it paid per resource traded on Buy Low; card ledger B question 6) and costs 2+0 (was 2+2). Member value 3.5 → 0.6 once Cash In, its main trigger, was gone.
- (Claude, under Cory's go-with-your-gut) White: Dealer costs 2+0 (was 2+2). Pawn no longer sells, so bots sell half as often. Member value 6.2 → 2.1.
- (Claude, under Cory's go-with-your-gut) White: Sell High and Pawnbroker stay at 3 white per follower, and Buy Low and Boom stay. Measured: a pure follower buyer wins 9.4% on the reworked White table, against 11.6% on the stand-in table. With a sale of 3, sellers win 35% vs 29% for non-sellers; at 2 it's 30% vs 33%. The critic preferred one price of 2.
- ❓ (Claude, flag for Cory) Release refunds a once-per-game member's full price after it's used. Buying Liquidator, using it and releasing it cost nothing in my hand-played game. In the same game my seat took 3 of the 4 10→10 buys in round II, so the game ended after round II. [Release refunds nothing for a used once-per-game member.]
- ✅ (Cory) A feedback tab on the live site (side or bottom, out of the way): anyone writes a note and attaches the stretch of the log where the issue happened (plus the game record). A pipeline turns it into fixes automatically: bug fixes go straight in; design changes that aren't bug fixes come to Cory first. Goal: start a new game and last game's issues are already fixed, with balance tweaks in too.
- ✅ (Cory) Members are always people or groups of people, never rooms, objects or events. Feast Hall becomes a group that counts as several members (it's a hall: lots of people), not just more silver. (This is a deliberate exception to "Twins and Big Family don't count as extra members.") All member names that aren't people or groups get renamed; Cory grades the batch.
- ✅ (Cory) Release refunds only the member's colored part, in its own color, not the "any" part (if its color isn't on the table, in any colors).
- (Cory) The live feedback pipeline is tabled until Cory allows Firebase/Netlify in the environment; the in-game "Copy feedback" tab may stay if it's done.
- ✅ (Cory, stretch goal) Leaders and members have small idle animations, each on its own loop, so a cult looks alive. Plus reactions: a member does something when its ability fires (e.g. +silver when you take a Silver space); the leader gestures when sending a minion, celebrates a round-end prize, and gives a little scheming shake/laugh when recruiting.
- ✅ (Cory) Layout: the wheel in focus; every player's cult visible around the wheel's corners; the shop condensed.
- (Cory) Hover-overs don't feel quick or seamless. Target: instant (<100ms), one sticky layer that swaps content as you move, no flicker.
- Doppelganger copying a 'Now and at round start' member also pays its 'now' part when it copies (Claude, consistent with 'becomes a copy of the card').
- ✅ (Cory) Shop cards are like elegant sports cards: the pixel member, name, cost and followers; the effect on hover. When buying, only what you can afford is highlighted.
- (Cory) Pixel art is a little weak but good enough for now; an art polish pass comes later.
- (Claude, under Cory's go-with-your-gut, from the dead-window audit) Planner, Underbidder, Cutpurse, Mole, Late Bloomer, Safety Net and Afterimage are "Now and at round start": their round-start effect also fires when recruited. Recruited in round III they gave 0 every time, and round III was their most common recruit round. Late Riser stays as it is.
- (Claude, under Cory's go-with-your-gut, from the dead-window audit) Heir: "Now and at the start of round III: +1 silver per member you have." It was blank when recruited in round III.
- (Cory) Feast Hall is replaced by Revelers (4+2, worth 1 follower): "Counts as 3 members." Members are people or groups, and a hall is lots of people, so it brings members, not silver. Red's contest, Patriarch, Windfall, Heir and Grifter all count 3. The name is a fill-in for the naming pass, and the fair-price screen checks the cost.
- (Claude, under Cory's go-with-your-gut, from the dead-window audit) Social Climber: "Whenever you release another member, +2 of any color you choose." Bots take their least-held color. The old once-per-game round-start trade-in never fired in bot play, and Release does its job better. "Another" means releasing the Climber itself gives nothing extra.
- (Claude, under Cory's go-with-your-gut, from the dead-window audit) Bloom: "+1 of each color you hold the fewest of (ties: all of them)." It printed Gardener's text. It always adds one full set.
- (Claude, under Cory's go-with-your-gut, from the dead-window audit) Silversmith: "Whenever a rival takes a Silver space, +1 silver." It rewards not hosting. The old "+1 more on action silver" was Majordomo at half the yield. The price stays 4+2 for the fair-price screen (the audit suggested 2+2).
- (Claude, under Cory's go-with-your-gut, from the dead-window audit) Release: a member can't be released in the round you recruited it. This stops buy-collect-release loops such as Lender's +5 and the "when recruited" refunds. You can still release a member you stole that round.
- (Cory) Release gives back only the member's colored part, in its own color, or in any colors when that color isn't on the table. A member with no colored part can't be released (Volunteer). Bots value a release the same way.
- (Cory) The floating minions around the leader are too much visual noise: a quiet static row of small minions beside the leader instead; only leaders and members get idle motion.
- Watch items from the reworks: Green's last round-I seat wins 31% (±2.6) after the Echo change (was 28%); in one White game a single seat took 3 of the four 10-follower buys in round II and the game ended after round II (the clock can be rushed by one player).
- (Cory) GitHub's automatic test runs emailed a failure on every work-in-progress push. They now run only by hand or on a release tag (v0.2…).
- (Cory) Actually keep the minions floating by the leader for now; judge the noise in play.
- (Claude, under Cory's go-with-your-gut, from the dead-window audit) Rainmaker is unchanged, but bots now use it on their last buy of the game whenever it gives anything. They had left it unused, so the fire-audit gate never saw it fire.
- (Claude) Cards, prompts and log lines now say "minion" instead of "worker": Squatter, Straggler, Extra Hand, Catch Up, Wind-up, Plan Ahead, Foreman, Bookkeeper, Lamplighter, "place a minion", and "+1 minion" in the round's opening line. The glossary follows. Code names (p.left, workersOnBoard…) stay.
- ✅ (Cory) No rescue clauses ("if you can't…", "if there's none…", "at least N"): taking a space or card you can't use is on the player. Claude's fallbacks came from bot statistics ("dead in X% of offers"), but naive bots take dead options and people don't. Reverted: Echo/Understudy/Barter/Sell High fallbacks, Tip-off and Grifter floors, Prism's rewrite, Extra Hand's round-III extra turn. Kept: real problems (duplicate text, dominated cards, cards that can never pay) and Cory's own "now" idea.
- (Claude) Per Cory's ruling above ("Cory: no rescue clauses based on bot offer stats; a card or space you can't use is on you"), Extra Hand ("+1 minion in round III."), Prism, Tip-off and Grifter keep their texts. The audit's floors and Extra Hand's round-III extra turn were built, then reverted. Kept from the audit: the "now" flags, Heir, Bloom (it printed Gardener's text), Silversmith (strictly dominated), Social Climber, Revelers and the Release rules.
- (Cory) Phone can wait. Actions more visual (icons on spaces); round scoring needs a more elegant solution than boxy plaques; your table only slightly bigger than rivals'.
- (Claude, under Cory's go-with-your-gut, from the design critic) Green's one rule is printed once instead of on each card: "Copies never reach the center or another copy." It's on the sphere, in the rulebook (The board) and in the glossary's "copy"; Echo and Encore dropped "(not the center)". The engine already worked this way (Echo, Encore, Refrain, Eternity, Understudy and the copying members all skip the center and copies).
- (Claude, under Cory's go-with-your-gut, from the design critic) Keepsake is cut ("When recruited: copy one of your spaces from this round"): Refrain does the same job.
- (Claude, under Cory's go-with-your-gut, from the design critic) Ensemble is now "Whenever you copy a rival's space, +1 follower." (4+2, was 2+2), and the follower counts at once. It was "Game end: +1 follower per green member". Not measured yet.
- (Claude, under Cory's go-with-your-gut, from the design critic) "Loose followers" is defined once (rulebook and glossary): followers you bought or won, not the ones your members are worth. Sell High, Pawnbroker and Liquidator use it, and Barter reads "Recruit a face-up member for half its cost (round up), paid in loose followers." (same rule as before).
- (Claude, under Cory's go-with-your-gut, from the design critic) The 10-follower buy (the game-end clock) is at most once per player per round; the stock of 4 stays. One seat had taken 3 of the 4 in round II and ended the game early. Bots follow it because the option is hidden.
- (Cory, overruling the design critic's fallbacks) Cory: no rescue clauses; taking a space you can't use is on you. Echo ("If there's none, +2 green"), Understudy ("+3 green"), Barter ("If you can't, +3 white") and Sell High ("If you have no loose followers, +3 white") stay without them.
- ✅ (Cory) Floating minions or a minion count, not both: keep the floating minions, drop the count dots.
- ✅ (Cory) No geometric seat shapes (circle/triangle/square/star) anywhere players see: identity is the leader's emoji.
- ✅ (Cory) A member's sphere color must be obvious from its clothes/color, with an aura if needed.
- (Cory) "We're definitely on the right track" with the Lamplit build (rim labels, Reckoning). Still doesn't like the action spaces: three distinct visual directions are being mocked (design/prototypes/actions/) for him to pick by number.
- (Cory) Show the member deck and how many cards are left: a face-down pile at the head of the shop strip with its count, hover for what's in it, refills come off it.
- (Cory) A picky game player does a pass too (game-design and fun critic): the boardgame-enthusiast, blind, on the frozen build.
- ✅ (Cory) Placed minions sit ON the action (over the space itself), not offset to its edge. Replaces build-plan's "offset the minion onto the space's rim".
- ✅ (Cory) The contest leader on the rim is a small version of the leader's emoji inline with the engraved rule text ("MOST BLUE · +2 · 🐱"), several side by side for a tie; nothing when no one leads. Replaces the tiny leader figure and name beside the label (off-center and confusing).
- (Claude, under Cory's go-with-your-gut) The open ❓ on releasing a used once-per-game member: no special rule. Release now returns only the colored part, so recruiting, using and releasing one still costs its "any" part; one rule beats an exception.
- (Claude, under Cory's go-with-your-gut, from the Purple sim) Night Owl takes Relay's slot in Purple (8 purple + 2 any, worth 1): "When you place your last minion of a round, take an extra turn right after this one." Member-value sim, handed over at round II: +6.9 followers, 53% win (Normal bots, n=320), so 10 on the rule-benders scale. Once per round; no extra turn when the board has no space to spare. Purple has 15 members again. Cut from the same sim: Sprinter (too strong, 60% win), Cheerleaders, Relief Crew (a cheaper, stronger Second Wind). design/eval/purple-members.md.
- (Claude, under Cory's go-with-your-gut, from the Purple sim) Double Time ("Extra turns you pay purple for cost you half") 8 → 6 (4+2): measured 4.9 followers (Normal bots).
- (Claude, under Cory's go-with-your-gut, from the Purple sim) Overseer ("Whenever a rival takes an extra turn, gain half your purple (up to 4)") 6 → 4 (2+2): measured 3.9 (Normal), 2.1 (Easy).
- (Claude, under Cory's go-with-your-gut, from the Purple sim) Taskmaster ("Once per round: pay 5 purple to take an extra turn right after this one") 8 → 6 (4+2): measured 5.4 (Normal), 2.6 (Easy).
- (Claude, under Cory's go-with-your-gut, from the Purple sim) Second Wind ("Once per game: take an extra turn right after this one") 12 → 8 (6+2): measured 6.5 (Normal), 6.9 (Easy); both bot levels agree.
- (Claude, under Cory's go-with-your-gut, from the Purple sim) Late Riser ("At round start, if you have the fewest followers (ties count), take an extra turn before anyone else") 8 → 6 (4+2): measured 4.8 (Normal), 3.2 (Easy). The rest of Purple keeps its prices.
- (Claude, under Cory's go-with-your-gut) Revelers ("Counts as 3 members.", Silver, replaced Feast Hall) gets its own drawing: three party-goers in silver, the one in front in a party hat. The Feast Hall drawing is gone. A UI test now fails when any member of a real sphere, or any guest, has no drawing.
- ✅ (Cory) Barter is cut ("no, I don't like that"). Dividend fills its White ring-II slot as Claude's gut call: "+1 white per loose follower you have."
- ✅ (Cory) No once-per-round limit on the 10-follower buy. "The turns are the end game clock": the game always ends after round III, and the 10→10 buy is unlimited (no stock, no clock). 8→6 keeps its limit.
- ✅ (Cory) Try the equal-cost swap ("ehh ok let's try it"): Even Swap, "+1 red, and swap one of your members for a rival's of equal cost." It goes in Red's outer ring in place of Scout (Claude's slot pick: the weak twin of Trade, the way Open Door pairs with Open House).
- (Cory) Night Owl's text was "extremely confusing"; reworded to say plainly what happens.
- ✅ (Cory) Action names batch 1 (Gold, Red, Magenta) "looks good": Claude's picks applied. Batch 2 (the other spheres) is drafted and applied the same way, pending his grade.
- ✅ (Cory) Member renames (people or groups only): "I trust you on this for now". Claude's picks applied.
