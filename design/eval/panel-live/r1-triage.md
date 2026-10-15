# Live panel round 1 (cf23306): triage into fixer lanes

The panel graded this build C, C− and C− (skeptic: NOT YET). Phone is out of scope.
Each lane owns its own files. If a fix needs a file another lane owns, describe the change in your report instead of making it.

## G1 · Engine and hover honesty
Files: src/engine/v4 (core.js, preview.js, content/*.js) and src/v4/game/Info.jsx.

- **BLOCKER:** Even Swap into Banker ("Now and at round start, +3●") paid nothing when Banker joined. Every "now" or "when joined" trigger must fire when a member arrives by swap or steal, not only by recruit.
- Poach's hover says +1 follower, but it paid +2.
- Help Yourself's face says +4 and its hover +8 (Desperado doubled it), and neither says why. The hover WHY should name Desperado.
- Redistribute glows as available but pays the leader nothing. It should read as idle when it gives nothing. Its recap toast said "1 gold from P3" but the stack that dropped was magenta.
- Collect Debts:
  - The hover says "P3 has 0…" while P3 holds 3, and it carries Kickback's sentence.
  - The face says +3, the hover +4, and it paid 4.
- Bandwagon's hover leaves out its base +1.
- Snap Up's hover shows "−4●", which matches nothing paid.
- Trade Seeds warns about yellow when silver was the colour given.
- The pay suggestion breaks your only full set without warning. Warn the way a lost lead is warned.
- A ransom (Shake Down) takes one of each colour with no choice. Check this against today's Shake Down change.
- The round III "Most gold" scoring card left out P2, who held 2 gold and appears in the end summary.

## G2 · Pay flow and shop cards
Files: PayPicker.jsx, pay.css, ShopCards.jsx, MemberDeck.jsx, and pay placement in GameScreen.jsx.

- The 8→8 buy and an exact-cost member skip the pay dialog, while 2→1 and 4→4 open it. Testers can't predict which. Make it one visible, predictable rule.
- "Faded coins pay / the number is what you keep" reads backwards. Make the paid coins read as leaving.
- The shop card shows the discounted price, while the dialog shows the full cost plus the discount. Show one consistent number.
- The struck price runs into the worth digit ("101").
- The worth "1 follower" reads as part of the cost; separate it visually.
- The member pay dialog is centred, ~580 px from the card. Anchor it to the card.
- The face-down pile sits in the first shop slot at member size and gets mistaken for a member. Make it read as a deck, not a buyable card.

## G3 · Pickers, steals, eye distance, keyboard
Files: boardPick.js, GiftCard.jsx, giftcard.css, boardpick.css, MemberUse.jsx, memberUse.js, members.css.

- Steals take one click per coin (8 clicks for Help Yourself in round III). Add a one-click "take all N" and keep per-coin picking.
- The steal, Collect Debts, Snap Up and Hand-pick targets sit 420–600 px from the space while the prompt sits top centre. Put a prompt card at the space, as Goody Bags and Cheap Seats now do, with the seats lit as the targets.
- Straggler waits on a tiny "Stay put" pill at top centre; one tester sat 18 s. Its choice belongs in a card at the space or the member, with a clear Stay put.
- The Swap Sides and Even Swap pickers clip their bottom rows and show no member cost. Show each member's cost, and never clip.
- Escape doesn't close the Kickback picker.

## G4 · Seats, setup and keyboard focus
Files: CultSeat.jsx, seats.js, build.js, seatMemo.js, layout.css (seat rules), screens/Screens.jsx, Intro.jsx.

- Seats fold members into "+N more", so "Most members" can't be counted. Show every member, smaller or as a counted row, and never hide the count.
- An empty zero ring is nearly invisible on purple and magenta.
- Unplaced minions stand in a 2×2 grid, not a column.
- The "extra turn" badge overlaps the count ("extra turn1").
- "EACH ROUND +6●" needs a hover to decode, and P4's block has no source. Name the member on the line or in its hover.
- Hovering a rival's member portrait on a seat opens nothing. Every element needs a hover.
- Keyboard:
  - Tab starts on rivals' portraits.
  - Focus on the follower buys and "Done, no buy" is invisible.
  - Fix the tab order and the focus rings.
- Setup has no "clear" control, and you can't swap a colour once 4 are picked. Allow click-to-swap.
- There's a 23 s intro before "Begin". Make it skippable at once.

## G5 · Words, summary, results, header
Files: panelText.js, shorts.js, glossary.js, RoundEnd.jsx, Results.jsx, FinalScore.jsx, Reckoning.jsx, Wheel.jsx (rim label words only), and design/rulebook.md.
format.js and parts.jsx belong to fixer 9 until it lands. List any wording there for the foreman.

- Cheap Seats charges resources. That rule is Cory's call, so fix only how it reads.
- "Pick 4 more spheres" uses a word not in the rulebook.
- "Most purple/white/silver" doesn't say most what (resources? members?).
- "Most full sets" is never defined on screen.
- "Others get 1" doesn't say 1 of what.
- Faces change by round without saying so.
- "+1 new members".
- Freelancer's "counts as a member of no colour" reads as developer phrasing.
- "Gain blue, half your priciest" gets misread as half your largest stack.
- Kickback's face "you pick who" is awkward.
- Round II's summary shows P4 "This round —" after P4 recruited 3.
- The round III total says 72 while the results say 73.
- The results show "7 members" in one place and 10 in another.
- Results numbers look clickable but open nothing.
- "P3 picks first: Front-runner" is never explained.
- The step tabs are ~9 px and the current step is only underlined.
- "Undo placement" and the "Done, no buy" pill look like different control families. (Coordinate in your report; the header is GameScreen.jsx, owned by G2.)

## Fixer 9 (format.js, parts.jsx, unit tests)
- The log and strip use space names the board never shows ("P1" in Encore).
- After "Done, no buy", the result toast lingers into the bots' turns.
- After a reload, the Redistribute hover reopened by itself. (G1 may own this if it's Info.jsx.)
