# Purple in the old game ("Timing/Order")

Read from the old game's code (src/data/allGameLayers.js, shopData.js, engine/scoring.js). A patron was a minion; "this turn" means right now, with minions from your own hand.

Spaces
- Round I: "Gain 4 purple, skip next turn"; "Gain 3 purple"; "Gain 2 purple, take back a patron (from a different color)"; "Place 2 more patrons this turn".
- Round II: "Gain 5 purple, skip turn"; "Place 3 more patrons this turn".
- Round III: "Gain 4 purple, take another turn after this one".

Purple shop (pay purple plus any)
- I: "Take an extra turn after this one" (1 purple + 2 any).
- II: "Place 2 more patrons this turn" (2 + 2).
- III: "Place all your remaining patrons now" (3 + 3).
- Followers: 6 purple for 5.

Contest (automatic, every round): the first AND the last player to run out of patrons each get +4.

Fate: it was pulled from the basic game for bugs (12 on file). A Nov 2025 redesign turned it into "worker efficiency" (per minion placed, per minion on the board) and dropped turn tricks. Today's Roll Call and Plan Ahead come from that redesign, not from the timing color.

What the old game had that today's Purple doesn't
- Skip: take resources now, give up your next turn, place later. A paid way to wait.
- Take back: lift one of your minions and place it again.
- Rushing your own minions out ("place 2 more now"), which is today's Crunch Time.
- A race contest: rewarded both rushing out first and holding out last.
