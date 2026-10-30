# How Cults actually works (the model to pitch from)

Read this whole file before any pitch. It's written for one job: so that a space or member idea is built on the real pieces and the real math, not on an impression of the game. Facts marked (code) are read from `src/engine/v4/`; (Cory) are his calls in design/decisions.md; everything else is Claude's read and says so. Card texts change daily, so this file holds the frame; `scripts/live-board.mjs` prints today's cards.

## Contents
1. The pieces you can touch
2. The three scarce things, and how they change by round
3. The math every pitch is checked against
4. What each color is, as a verb
5. Interactions that break ideas (copying, extra turns, more players)
6. Questions to answer before pitching

## 1. The pieces you can touch

A good space or member does a verb to one of these. If an idea needs a piece that isn't on this list, it needs a new mechanism, and Cory will ask "what does that even mean?"

- **Spaces** (code). Each color has 6: three on the outer ring (open from round I), two in the middle (from round II), one in the center (round III). Rings stay open. One minion per space per round unless a card says otherwise (Crowd In). With N players there are N colors, so round I has 3N spaces for 3N minions: every round I space fills, and whoever places last gets the leftover. Rounds II and III have exactly N spare spaces (5N for 4N minions, 6N for 5N).
- **Minions** (code): 3 in round I, 4 in round II, 5 in round III. Every minion comes home at round end. 12 placements a game per player.
- **Turns** (code). Snake order, one minion per turn: 1-2-3-4, 4-3-2-1. The players at each end take two turns in a row. Round I order is random; from round II, fewest followers goes first. Extra turns never happen in round I. A skipped turn (Hold Up, Sleep In) passes you over once; you still place every minion, later (Cory, Oct 22).
- **The recruit** (code). After placing, you recruit one thing or pass: one shop member, OR one follower card. It's one per turn and can't be banked. Recruit Twice and Spree give more. A space that recruits for you (Open Door, Recruit a Member) doesn't use your recruit.
- **The follower cards** (code, Cory). Three fixed cards in the shop: recruit 1 follower for 1 resource, 5 for 5, or 10 for 10, any colors, unlimited stock. They are physical cards with set sizes, "a specific part of the design". A space can change *how often* you recruit or *what you pay with*; it never changes the cards. So: a resource converts to a follower at 1 for 1, at most 10 per recruit, and only by spending a recruit.
- **The shop row** (code). Face up: 6 members in round I, 7 in round II, 8 in round III. A member that leaves is replaced from the top of the face-down pile. Between rounds the whole row goes to the bottom of the pile and a fresh row is dealt. Blue already owns the shop verbs: send to the bottom ("bury"), refill, sweep a color, look at and reorder the pile top, recruit from the pile top.
- **Members** (code). Cost = a colored part (only that color) + an "any" part. Floor 2: one color, one any (Cory, Oct 21). Worth = followers it adds (at least 1). Some count as several members (Twins, Mob, Panel). Ability timings: when recruited, now and at round start, whenever X, once per round, once per game, game end. Members move: swaps (Red), theft (Magenta), bury (Blue, White).
- **Resources** (code). One color per sphere on the table. They carry over between rounds and are worth nothing at game end unless a member says so. Stolen resources keep their color.
- **Contests** (code, Cory Oct 22: "contests are always resources now"). Every color's rim scores the most of its color held at round end: +4 / +6 / +10 followers by round (RING_VALUE), tied leaders each take half rounded up, you need at least 1 to score. So 20 followers per color per game, a major score source. The rim only prints what is counted; no other rule lives there. This is the hold-or-spend tension: a resource held wins a contest, a resource spent becomes a member or followers.
- **Followers** (code). The score. Start at 1. Members' worth, follower cards, contests, abilities. Only followers you recruited or won can be stolen or sold; followers printed on members stay with the card.

## 2. The three scarce things

Every turn spends a placement and a recruit, and moves your pile. Which one is scarce changes across the game; a space is good when it relieves whatever is scarce at the moment it's taken. (Claude's read, from strategy.md and the reworks.)

- **Round I: resources are scarce.** Everyone has 1 to 4. A member costs 2 to 10. Spaces give about 2 to 4 including the +1. The recruit is cheap: you often can't use it well.
- **Round II: the bridge.** Piles grow, members start doing work, the middle ring opens. Cory's bar for a round II space is Promote ("swap a member with a shop member costing up to 2 more") and Shake Down ("they pay its cost or you take it"): it must change what you own or how much you recruit. Access or information alone ("claim a card", "pull a card from the pile") is "so weak".
- **Round III: the recruit is scarce.** Piles are big, 5 minions, the center opens. Ten resources need a whole recruit to become 10 followers. Anything that adds recruits (Spree), skips the recruit (White's cash-in, free recruits), or turns piles into followers without the card cap is worth the most here. The center action is the burst the whole color builds toward.

## 3. The math every pitch is checked against

- **Every space gives at least 1 of its color** (Cory, Oct 22: "all should give at least 1"), usually as a printed "+1 <color>" after the effect.
- **Lean conservative on resource gains** (Cory, Oct 22). Round I totals about 2 to 4 including the +1. A plain scaling gain ("+2 / +3 / +4 by round", Gather, Build Up) anchors round I once per color, no more.
- **Grows by round.** Round I spaces stay open all game and should still be worth taking in round III ("× round", "per member", "per rival", copy-based). "Those kinda don't scale" is a no. But a round I space that grows *too* well becomes a round III power (Yellow's "do one round I action of each other color" was nixed for this).
- **Sibling parity.** Compare against the reworked color's space in the same ring. Cory checks this himself: "+1 follower × round" lost to Help Yourself ("steal 1 and +1 follower × round") — "way worse than magenta one". The fix that worked was matching totals with a different side effect.
- **Placement accounting.** Every space costs a minion and a turn. A space that only hands back a minion or a turn (take a minion back, one turn after this one, an extra minion) nets zero and must pay some other way. Write the net out.
- **Exchanges.** Judge any trade against all three limits on the follower card: 1 for 1, 10 per card, one recruit per turn. "Turn all your white into followers, 1 for 1, no cap, no recruit" is strong because it skips the cap and the recruit, not because of its rate. Cory: "the idea is you can have a lot of white and go above 10".
- **Member value** (Cory, Oct 21). A member should return about 2× its cost in followers over the game (Cory, Oct 22, raised from 1.5×). Prices are educated guesses, a little pricier than bots suggest, never below 2; lift a weak card with more followers before cutting its price. Don't put prices in a pitch unless he asks.
- **Buy-followers-only** wins about 25% of 4-player games; a good engine should beat it. An idea that mostly helps someone who only recruits follower cards pushes the wrong way.

## 4. What each color is

See design-core.md section 3 (each color's fantasy, how it wins, who it rubs against). Run `scripts/live-board.mjs <id>` for today's texts; ids: red, echo (Green), thieves (Magenta), market (Blue), purple, gold, silver, yellow, trading (White). Guests (no color) are Cory's to design.

## 5. Interactions that break ideas

- **Copying.** Any space can be copied by Echo (previous action), Encore, Reprise and Greatest Hits (every action with your minion, round III). A copy gives the printed gain; a space that takes or trades is done again by the copier. So a big round I gain is also a big Greatest Hits gain. Spaces that "do other actions" can't copy themselves from inside the chain (Cory, Oct 22).
- **Extra turns and skips.** Extra turns only exist after round I and only while spare spaces remain. Snake ends already double up, so "two turns in a row" happens naturally.
- **More players.** At 5 and 6 players Purple and Yellow join with no rule change. "Per rival", "per minion on the board" and "per member anyone has" grow with players, which Cory accepted (Oct 22).
- **Between rounds.** Anything that pays when cards move between rounds is "too strong between rounds" (the row refreshes every round).
- **Spaces resolve at once; members carry what lasts** (Cory, Oct 22). An action does everything when it's taken. Watching for events ("whenever"), effects for the rest of the round, and anything that waits for round end belong on members, whose card is the reminder. Lie Low's "can't be stolen from this round" is the exception he knows.
- **Real-table test.** A player at a cardboard table must be able to run it without remembering past events (no "last round", no debts to track). A visible pile on the board is fine; a memory isn't.

## 6. Questions to answer before pitching

Answer these to yourself from the live board output before writing a single idea. If one is shaky, reread section 1; the most damaging failures came from getting one of these wrong.

1. What exactly happens on a player's turn, step by step, and what can the recruit buy?
2. What are the follower cards, and what can a space change about them? (How often you recruit and what you pay with; never their sizes.)
3. In this slot's round, which is scarce: resources, placements or the recruit?
4. What does the strongest reworked space in this same ring give, in total, and what decision does it create?
5. What does this color's round III action reward, and how does this slot build toward it without previewing it?
6. If Green copies this, or a player takes it in round III instead of round I, what happens?
