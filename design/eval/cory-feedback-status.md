# Cory's play notes: where each one stands (2026-10-15, 04:13 UTC)

Done means seen on screen and tests passing. The next batch ships to the preview link after one combined test run.

## Done
1. Straggler moves your last minion and asks only where. (engine, tests)
2. One turn card per action, with the right name and the amounts actually paid. (turn story)
3. The snake double turn reads "Your turn again (snake order)", and the turn-order chips count it.
4. A "since your last turn" strip lists each rival move. Hover a line for its card; the log is one tap away on the strip.
5. Midas shows its state ("Midas: on").

6. Hovers open right next to what you hover, fully on screen, never docked under P3. Your own members' cards open beside them. (Seen on screen.)
7. The member hover is stripped: no "You pay", "Leaves …", "you'd lead N" or "Click to recruit". Just the card and its cost.
8. The starting-resource pick sits under the wheel as one row that glows and pulses once.
9. Every member opens a card. Kingpin wouldn't reproduce; a hover lost when its element was redrawn under the pointer is fixed.
13. Follower buys are four tiles at the right end of the shop strip, lit when you can buy, each with a hover.
14. The top score row is gone. Each seat shows its place ("2nd") and the leader is lit.
15. Seats are condensed, each with a line on what the player makes each round, member color pips, and members grouped by what they do on hover.
16. The shop is sorted by cost, with a cost/color toggle.
17. The deck has no hover.
28. Rims say "+2 followers", and the rim hover opens reliably.
29. The giant follower in "Your Call" is fixed.
30. Spaces have no names; the hover leads with the name.
31. Pay dialog: one line for each price changer ("Penny Pincher: your gold counts double").
32. Reloading on the results or the round summary brings it back, and two tabs no longer split a game.

## In progress (an agent on each)
- Seats in turn order with the snake visible (layout). The round-end scoring made slow and clear (layout).
10. Snappiness: a speed tracer (`?trace=1`) and a measured list of what's slow. (measurement)
11. A faster wheel spin, instant hovers, and no waiting on animations. (motion)
12. Every gain flies from its source to where it lands, and buttons and pieces feel tactile. (motion)
18. Round-end scoring slowed down and made clear: one quadrant at a time, totals climbing as each prize lands. (layout)
19. Every choice picked on the board: steal by clicking the rival's pile, copy by clicking the space on the wheel, members by clicking the card, players by clicking the seat. (pick-on-board)
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

## Follow-ups seen on screen (foreman)
- Pick-on-board: the choice caption sits over the bottom of the wheel, and the keyboard list shows as chips for everyone. Fold the list behind keyboard focus, and dock the caption off the wheel once the seat column lands.
