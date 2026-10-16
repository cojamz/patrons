# Sphere design brief (approved by Cory, 2026-10-14)

Handed to every sphere-design agent, together with design-principles.md, decisions.md and the Gold and Red files.

## Principles (Cory approved)
1. Each sphere is defined by one mechanic and plays differently from Gold (hoarding) and Red (many cheap members).
2. One scoring rule, counted at round end.
3. Actions match the anchors: round I like Joint Venture or Rush, round II like Steal or Windfall, round III a burst like Strike.
4. Weak versions of strong actions are welcome; the draft gives them meaning.
5. 15 simple members, built from what Cory has kept: income, triggers on rivals, links to other spheres, catch-up, a way to win, a once-per-game burst.
6. No members tied to one specific contest, nothing that only helps whoever's already winning, no fiddly timing.
7. Interaction, including harm, is fine when it's fun on both sides.
8. Every card is measured by simulation before Cory sees it.
9. **Win conditions are visible state, never event counts** (Cory, 2026-10-14). A sphere's round-end rule must measure something you can SEE on the players right now: resources held, members held, a visible pile. Never count things that happened during turns (steals made, actions taken, repeats). Anyone glancing at the other players should know who's winning each contest.

## What a sphere is
- One resource (its color) and one scoring rule, measured at round end. You need at least 1 to score, ties all score, and it pays +2/+4/+6.
- By default a sphere scores "most of its resource held" (Cory, 2026-10-15: "defaulting to currency is better… it gives more tension rather than just everything encouraging member buys"). Holding is weighed against spending on members. Exceptions say so: Red (most members), Yellow (most full sets), Magenta (most magenta members).
- 6 actions: 3 in ring I, 2 in ring II, 1 in ring III. 15 members (one copy each for now).
- Mechanic first, theme second. It must play differently from Gold (hoard money) and Red (many cheap members).

## Power anchors (Cory's calls are the ruler)
- **Show the arithmetic for every action**: its value in resources early (round I, typical holdings) and late (round III), next to the anchor for its ring. Cory read Yellow's first actions (Bloom +6, Flourish) and Black's (free +black) as "not well considered". Scale is the first thing he checks.
- Ring I is about Joint Venture (+3 gold, +1 to a player you choose) or Rush (+2 per round).
- Ring II is about Steal 3 or Windfall (+1 per member).
- Ring III is a burst like Strike (double your gold) or Take (any face-up member free).
- Weak versions of strong actions are welcome (Hire next to Hire Up): the draft gives them meaning.
- Members cost 1–6 (cheapest 1–2, most 2–3, top 5–6), as a colored part plus "any". Price them by measurement (`node scripts/v4-member-value.mjs`), not by feel.

## What Cory likes in members
- Simple effects; hooks into other spheres (Midas, Tinker, Coin Purse); steady income (Banker); triggers off rivals (Tax Collector, Merchant); catch-up (Underdog); time shifts (Investor); a win condition on its own (Tycoon, Patriarch); count padding (Twins, Big Family); a once-per-game burst (Speculator, Jackpot).
- Not: effects tied to one specific contest, win-more, fiddly timing for small gains, hooks on mechanics that don't exist.

## Lessons from testing
- Anything that pays more the later you take it (Turnout) bends the draft. Know why.
- Players can't see what they can't read: one line per effect, plain words, no codes.
- Interaction is welcome, including harm (Steal, bribe), when Cory chooses it. Never punish whoever is forced to pick last in round I.

## How to deliver
- Build the sphere for real as an engine content module (`src/engine/v4/content/<id>.js`) with unit tests, so it can be played and simulated.
- Measure: run the member-value sim and a 400-game seat-balance sim with the sphere swapped in for a stand-in.
- Hand Cory a numbered list (actions, then members, one line each with cost) that he can answer by number. Pitch only what survived your own play-through in your head and the numbers.

# Rework principles (Cory, 2026-10-15; full wording in decisions.md 17:39–18:20)

0. The heart of the game: members feel good and fun to have in your cult. Different combinations feel radically different and push radically different play styles; members from different spheres, with the actions, make a wide variety of competitive engines.

Spheres and spaces
1. Every action feels GOOD to take, and distinct.
2. Each sphere has a high-level theme with several ways to achieve it, sometimes a way to counter it, and several ways to gain its resource.
3. Each sphere has a round-I action giving up to 3 resources with a condition or flavor attached (Top Up, Kickback).
4. Spaces that grow through a round are welcome (Bandwagon; Catch Up as 1/2/3 for your 1st/2nd/3rd minion): take it early for less, or wait and risk losing it. Watch the edge for whoever goes first.
5. Interaction is mostly implicit (Green's copying, Rising Tide). Stings are fine, never crazy bad: losing a member is for round III only.
6. Every word explains itself (no "loose follower").
7. Pending Cory's yes (Claude's): a sphere's prize rewards what the sphere builds; its round-III moment is visible from round I; dipping into a sphere is worth it.

Members
8. Works on a real table: players track it themselves, nothing remembers last round, no debts owed later.
9. Any choice is made at recruit and kept; the card says what happens if it's stolen.
10. Easy to show, or it's out. It lives where its idea lives. Its name says what it does.
11. No two members in a sphere are slight variations of each other. Passive gain is fine where it's distinct.
12. Fitting many builds is a plus; interaction is good even if it fades as you grow; rule-benders welcome, priced for round III; paying for itself on arrival allowed, not loved.
13. No type labels on members: types overlap, and the fidelity of each card matters. The mix is checked for the sphere as a whole: varying costs (maybe 1–10), links to other spheres, extra followers, extra scoring, activatables, combinations.
14. Short term: 10 members per sphere, 10 neutral (Cory designs the neutral ones).
