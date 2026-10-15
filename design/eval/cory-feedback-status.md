# Cory's play notes: where each one stands (2026-10-15, 03:51 UTC)

Done means seen on screen and tests passing. The next batch ships to the preview link after one combined test run.

## Done
1. Straggler moves your last minion and asks only where. (engine, tests)
2. One turn card per action, with the right name and the amounts actually paid. (turn story)
3. The snake double turn reads "Your turn again (snake order)", and the turn-order chips count it.
4. A "since your last turn" strip lists each rival move. Hover a line for its card; the log is one tap away on the strip.
5. Midas shows its state ("Midas: on").

## In progress (an agent on each)
6. Hovers open next to what you hover and stay on screen, never docked under P3. (clarity)
7. The member hover is stripped: no "You pay", "Leaves …", "you'd lead N" or "Click to recruit"; the cost is shown clearly. (clarity)
8. A clear call to action for the starting-resource pick, and the picker moves off the wheel. (clarity)
9. Every member gets a hover (Kingpin had none, and neither did your own recruit). (clarity)
10. Snappiness: a speed tracer (`?trace=1`) and a measured list of what's slow. (measurement)
11. A faster wheel spin, instant hovers, and no waiting on animations. (motion)
12. Every gain flies from its source to where it lands, and buttons and pieces feel tactile. (motion)
13. Follower buys as prominent as the member shop. (layout)
14. Top score row removed. (layout)
15. Seats condensed, each with a one-line read of that player's build. (layout)
16. Shop sorted by cost, with a sort toggle. (layout)
17. No hover on the deck. (layout)
18. Round-end scoring slowed down and made clear: one quadrant at a time, totals climbing as each prize lands. (layout)
19. Stealing by clicking the rival's resource pile on their seat. (steal flow)
20. Redistribute says what "more" means. (engine)
21. A visual language first (few symbols, one type scale, a grid, plain-dot currency), then one polished sample page for you. It covers the member card's hierarchy, the currency symbols and how actions look. (language lead)
22. Testers rebuilt to look only at the screen, calibrated against your notes as the answer key. (calibration)

## Queued
23. The pay screen redesign, after the hover work in that dialog lands.

## Ideas logged, not started (yours to call)
24. A discard pile beside the deck, not called a graveyard.
25. Members that are items rather than people, worth no follower.
26. The Blue rework.
27. Better pixel animations (the art pass).
