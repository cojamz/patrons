# Wheel language: focused follow-up — 2026-10-16

Reviewed the actual 1270×700 Open Door screenshot and all panel definitions against engine action text. The existing wording pass is real; the remaining crowding comes particularly from wrapped inner-ring conditions and the narrow wheel, so copy edits alone cannot solve it. Preserve the current design and pair this pass with the performance/layout work.

| Space | Before | After | Reason |
|---|---|---|---|
| Roll Call | per minion on the board | per minion you placed | Shorter and explicitly excludes rivals’ minions. Live amount still includes this placement. |
| Plan Ahead | 1 per minion left after this | 1 per minion left to place | Names the remaining, unplaced minions directly. |
| Crunch Time | Take your next 2 turns now | Your next 2 turns, now | Removes one word; keeps these as your existing turns, not extra turns. |
| Echo | Copy the previous action | Copy previous action | Same shared previous-action target, less wrapping. |
| Reprise | Copy a space / where you have a minion | Copy a space / with your minion | Reduces the condition from 23 to 16 characters while keeping ownership. |
| Greatest Hits | Copy every action / where you have a minion | Copy every action / with your minions | Keeps “every” and own-minion condition while shortening its second line. |

No engine rules, action names, icons, prices, or eligibility changes. Existing explicit rival/round conditions elsewhere remain, even where long: deleting a core condition for brevity would make those actions misleading.

Focused check: `npx vitest run src/test/v4/ui/panel-words.test.jsx --maxWorkers=1`: 10 tests passed. Full browser visual verification belongs to the combined build; the source screenshot was inspected before changes. The long Ransom and Show Off sentences still deserve attention if their quadrants are put in the visible market; they were not shortened by losing conditions.
