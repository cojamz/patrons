---
name: rework-members
description: Pitch and price a color's members with Cory: light concepts from strong to weak with counters, his cut, then sim sweeps set the prices. Use for any member rework or member pricing job.
argument-hint: <color>
---

# Rework a color's members

Follow design/member-process.md step by step; it is the process Cory set on Oct 21 ("think of the concepts and then run a bunch of balance test simulation games"; "the concepts need to range from strong to weak. each color should also have a few of its own counters").

Before step 1, read design/lessons/design.md and design/member-principles.md.
Short version:
1. Concepts first, light: keep what he praised, change what his notes name, add only counters and the ends of the power range.
2. Send numbered picks with the strong-to-weak order. No prices yet.
3. Build his cut on `claude/members-<color>`, never live.
4. Sweep prices with scripts/v4-fair-price.mjs at 2, 3 and 4 seats; buy-followers-only win rate with scripts/v4-big-followers.mjs.
5. Report each price with its instrument. Nothing ships until he says yes.
