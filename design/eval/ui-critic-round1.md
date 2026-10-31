# Blind expert UI critic, round 1 (frozen build 49c94c3, 2026-10-14)

Played by sight, no code. Desktop 1270×700 full game (Purple, Yellow, Blue, Magenta); iPhone 13 through round II (Blue, Gold, Silver, Yellow). Screenshots: /tmp/patrons-shots/ui-critic/ (container-local).
Grades: information access D · intuitiveness C- · visual C+ · interaction C · phone C- · overall C-. Verdict: handsome shell; scoring layer partly invisible and self-contradicting.
Foreman check: the engine's Blue contest is correct (0 badged scores 0, core.js endRound skips top<=0; market.js:136); the screen's counts don't come from the engine's scoring, so they disagree. Purple's engine label says "purple breaks ties" (resources); the UI showed "purple members break ties".

Top issues (worst first), smallest fix:
1. "Badged" is an invisible keyword; contest counts shown ≠ counts scored (paid "P2 0"). Fix: badge glyph on cards; keyword tooltip; every contest number on screen comes from the engine's scoring function.
2. Scoring explanations contradict: tiebreak label says "purple members" but uses purple resources; results says "Most Magenta members two rounds (+18)" when Magenta gave +10 (18 = all contests); header "5 workers each" while a player has 6 (Extra Hand). Fix: one source for labels; per-contest summary.
3. Spaces never preview their outcome (Catch Up, Wind-up, Harvest, Bloom, Showroom, Price Check, Tip-off, Prism). Fix: "You'd get: …" in tooltip/sheet (engine actions have estimate()).
4. Player colours ≈ resource colours (orange~gold, pink~magenta, lavender~purple). Fix: player colours outside resource hues and/or seat glyph on worker tokens.
5. Card text not reachable everywhere a card is named (log, rival chips hover, since-your-turn, game-end bonuses, Ransom picker lacks owner/cost; shop text truncated; on phone tap = recruit). Fix: one CardName component everywhere, hover/long-press opens card; owner+cost in pickers.
6. Phone header eats 34% (empty Undo band ~76px); rivals offscreen; truncated space names; 9px text. Fix: ≤96px header, Undo in pill, swipe-down tray for rivals/contests, no truncation.
7. Right panel jumps between phases (shop moves ~182px; follower row moves when Release appears; quadrant rules in a 177px scroll box showing 3 of 6). Fix: fixed regions; decisions in a fixed bottom dock.
8. Spatial choices made in text lists (Linger, Tip-off, Pickpocket, Ransom). Fix: highlight legal targets on the board.
9. Turn order invisible (snake, re-sorted each round). Fix: turn-order rail with workers left.
10. Four different payment/choice UIs; Release chips "Purple" = all 3. Fix: one payment component; quantities on every chip.
11. Events scattered in 4 places; being attacked barely registers (Ransom: no disabled "Pay 4 — you have 1", no warning of losing 2★). Fix: one event feed with linkable names; hostile events pinned until acknowledged.
12. Undefined vocabulary: full set, badged, unbadged, plant, in play, worth; "tie→purple" cryptic. Fix: glossary on every keyword; each contest says what it counts.
13. Members framed in colours of absent quadrants (Big Spender gold, Front-runner purple). Fix: neutral frame + "colourless".
14. Legal/affordable signals weak (round III everything glows; unaffordable buys only dimmer; affordability not shown while placing). Fix: proper disabled + "need 3 more"; "affordable after this space".
15. Setup without the shop (already being fixed).
Felt confusing: "+(" overflow; "tie→purple"; "(3 purple)" read as members; badged "no one yet" then paid; absent-colour frames; "Silver" truncated; Release chip; surprise snake turn; stale "Undo buy" next turn; "5 workers each"; Catch Up count; stale hover tooltip at round start; rival chips hover dead; "release" read as giving away; "+18"; Ransom loss not warned.
IA proposal: fixed ≤64px top bar with turn-order rail + prompt + Undo; board with targets + "you'd get"; contest mini-leaderboards on the board rim; right: your area / fixed shop with affordability / fixed decision dock; rival strip; one event feed; glossary; phone ≤96px header + bottom sheet + swipe tray.
Works: phone tap→sheet→Place here; Undo; round-scoring modal reconciles exactly for non-badged rows; since-your-turn recap; "you'd pay / you can afford"; recruit flights.
