# RC1 blind panel: saboteur, 2026-10-15

Blind tester (URL + rulebook only) on the frozen RC1 build fd4d734, trying to break it. Verbatim report; screenshots were in /tmp/patrons-shots/panel-saboteur/. Triage: panel-rc1-triage.md.

**Robustness grade: B.** I never got a crash, a stuck state, a move applied twice or a score that didn't add up. Three paths do lose data silently, though: two tabs on one game, a reload on Game over, and a reload mid-Reckoning. Separately, member cards in the bottom seats can't be read.

**Bugs, worst first**

1. **The same game in two tabs splits into two games, and moves get lost without warning.**
   - Steps: mid-game, open a second tab from the game tab (`window.open` of the same URL, or duplicate the tab). Both tabs show "Your turn". Take New Faces in tab 2 and Intro Offer in tab 1.
   - Expected: one game, with the stale tab refused or warned.
   - Actual: two separate games, each running its own bots and saving to the same save. When I reloaded tab 1 it loaded tab 2's state, which had moved on to round II. Tab 1's Intro Offer move was simply gone.
   - Screenshots: `/tmp/patrons-shots/panel-saboteur/48a-tab2-newfaces.png`, `48b-tab1-introoffer.png`, `49b-tab1-reloaded.png`.

2. **Member cards in the bottom seats open behind the shop strip and off the bottom of the screen.**
   - Steps: at 1270×700, click, hover or Tab-focus any member icon in your own seat, or in P4's.
   - Expected: a readable card.
   - Actual: the card sits under the shop row and the Followers bar, and runs past y=700. In the DOM it measures y=609 to y=791.
   - Screenshots: `31-click-own-underbidder.png`, `109-p4-member-popover.png`.

3. **Reloading the Game over screen wipes the game.**
   - Steps: finish a game, then reload the results screen.
   - Expected: the results come back, or the home screen offers a way to see them.
   - Actual: you land on the home screen with no Resume and no results. Local storage keeps only `introSeen`.
   - Screenshot: `100-reload-results.png`.

4. **Collect Debts offers more gold than the rival has.**
   - Steps: take Collect Debts when the only rival with gold has 1.
   - Actual: the button says "Take all 3 from P3"; clicking it takes 1 (log: "You stole 1 gold").
   - Related: after a reload partway through the split, the counter resets from "1 of 3 taken" to "0 of 2 taken". The seat totals don't show the gold already taken until the action finishes, though the final numbers were right.
   - Screenshots: `51-collect-debts.png`, `74-reload-mid-collect.png`.

5. **Reloading during the Reckoning or the round-end summary skips the rest.**
   - Steps: reload while the Reckoning animation or the "Round II scored" summary is up.
   - Actual: the summary never comes back; you land straight in the next round or on Game over. In game 1 (Normal bot speed), three bot turns resolved within about 1.5 s of the reload, so I never saw them happen.
   - The totals were correct.
   - Screenshots: `79b-reckoning-reloaded.png`, `99b-after.png`.

6. **Minor**
   - The Social Climber choice reads "Gold", "Red", "+2 blue", "+2 green": inconsistent labels, though all four give +2 (`54-released-dbl.png`).
   - The pay dialog doesn't move focus into itself. Focus stays on the page body, so Enter does nothing until you Tab in (`58-pay-4to3.png`).
   - The name I typed shows raw in the Encore options and the log, while everything else says "You". It is safely escaped: no HTML ran.
   - During the Reckoning, the seat totals already show the final numbers while it is still on step 1 of 4 (`106-skip-visible.png`).
   - At 500×400 the shop, wheel and seats overlap (`37b-small.png`). That is an extreme size.

**Checked and not bugs**
- A copy gives you what the space gave its original taker; the rulebook says so.
- P3's Even Swap took my Big Family (worth 3) for Impressionist (worth 1). The costs were equal, so it's legal.

**Console and page errors:** none in about 30 minutes across both tabs. I confirmed the error listener works by logging a test error myself.

**What held up well**
- **Spam and double-clicks:** I spammed starting resources, taken and locked spaces, the four follower buttons, Confirm, Pass, Start, Resume and Skip. No buy, placement or pass ever applied twice. Taken, locked and unaffordable clicks all gave clear messages ("Opens in round II", "You can't afford Muse yet").
- **Undo:** spamming Undo placement, Undo buy and Undo pick restored the exact state. That includes undoing a rival's member trigger my buy had set off (P3's Tax Collector gold). Undo is one level only.
- **Reload:** it resumed exactly in setup, mid-gift choice, mid-payment, mid-Collect Debts, mid-Social Climber choice and during the intro.
- **Back and Leave:** Back opens "Leave this game?". After Leave, Resume brought the game back intact.
- **Mid-game overlays:** the menu, How to play, the log and the intro replay all opened mid-turn, and Esc closed each one.
- **Keyboard only:** you can Tab to every space, card, follower button and choice. Enter and Space work, and I completed a full buy that way.
- **Round-end summary:** while it's up, the bots wait. Spamming Skip was safe.
- **Totals:** every round summary and the final table added up, whether checked by hand or against the log.

Scripts are in `/tmp/panel-saboteur/` and all 108 screenshots are in `/tmp/patrons-shots/panel-saboteur/`.
