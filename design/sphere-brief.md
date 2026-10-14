# Sphere design brief (draft for Cory, 2026-10-14)

Handed to every sphere-design agent, together with design-principles.md, decisions.md and the Gold and Red files.

## What a sphere is
- One resource (its color) and one scoring rule, measured at round end. You need at least 1 to score, ties all score, and it pays +2/+4/+6.
- 6 actions: 3 in ring I, 2 in ring II, 1 in ring III. 15 members (one copy each for now).
- Mechanic first, theme second. It must play differently from Gold (hoard money) and Red (many cheap members).

## Power anchors (Cory's calls are the ruler)
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
