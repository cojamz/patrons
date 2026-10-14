# Card ledger B: Blue (market), Magenta (thieves), White (trading), Green (echo)

Card-by-card check, 2026-10-14, at the doubled member costs (Blue's badge cutoff is 8). Each card has a scenario test that runs through real legal moves and asserts the printed effect: amounts, who gets it, when, limits and rounding. Each test also checks that a log line names the card whenever it changes a number. Most cards also get one cross-sphere case.

The tests are in `src/test/engine/v4/cards-{market,thieves,trading,echo}.test.js`. The gate is the "Blue, Magenta, White, Green" block in `src/test/engine/v4/fire-audit.test.js`: seeded mixed tables with normal bots, and every member with an effect is dealt out at least 3 times. It must leave a log line naming it, and it runs in about 40 s. Plain cards ("Worth N followers") are skipped: Crew and Shareholder.

Status key:
- **OK:** matches its text and is named in the log.
- **FIXED:** what changed, plus the test that guards it. Each guard failed before its fix.
- **QUESTION:** for Cory, with the default in [brackets].
- **DEAD-BY-DESIGN:** why bots can't fire it.

## Shared engine changes (core.js, generic)
- A member hook that only changes the next member's cost now leaves a trace line, like "P1's Planner: next member costs 4 less." This works because the trace snapshot now includes the discount.
- New `ctx.asMember(owner, name, fn)`: content code that runs a member's effect itself (Green's copy reactions, White's sale reactions) gets the same named trace as the engine's own hooks.
- `ctx.stealCount(thief, base, { say: true })`: a real steal names the members that changed its size, e.g. "P1's steal takes 6, not 2 (P1's Sticky Fingers: +1; P1's Desperado: doubled)". Estimates don't pass `say`. Gold's Steal (`gold.js`) still calls it without `say`; that's the twin's sphere, so Sticky Fingers and Desperado on Gold's Steal remain unnamed until it passes `{ say: true }`.
- Negative game-end parts used to print as "Lender +-1". They now print as "Lender −1".

## Blue (market)
- Bargain: OK. Cross: an Echo copy of a Bargain does Bargain again for the copier.
- Restock: OK. Cross: Midas turns the blue into gold, and the log names Midas.
- Showroom: FIXED. With no badged member face up it gained 0 and said nothing; it now logs why. Guard: `cards-skips-b.test.js`. Cross: Encore copies the printed number.
- Clearance: FIXED. Clearance is "your buy", but it didn't count as a real first buy, so Big Spender's second buy was lost. It now counts. Guard: `× Big Spender: Clearance counts as your first buy`.
- Price Check: FIXED. With no member costing 2 or more it gained 0 and said nothing; it now logs why. Guard: `cards-skips-b.test.js` (Price Check). See QUESTION 1.
- Spree: OK. Cross: with Big Spender you get 4 buys. See QUESTION 2.
- Stylist: OK. Cross: a Doppelganger copy gives +2.
- Onlooker: OK. Cross: the Heist victim's free recruit of a badged member counts.
- Connoisseur: OK. Cross: a Bargain recruit counts.
- Reseller: OK. Cross: a guest that leans to an absent sphere gives nothing.
- Curator: OK.
- Planner: FIXED. It was silent, because a discount left no log line. Guard: `Planner: … (named in the log)`. The discount comes off the color part first at the doubled costs (Tycoon 12 costs 8 gold).
- Underbidder: FIXED. It was silent, same cause. Guard: `Underbidder: …`.
- Minimalist: OK.
- Social Climber: OK in tests. Cross: a used Climber that gets stolen stays used.
  - DEAD-BY-DESIGN for bots: their hint only trades in vanilla members, and almost no table members are vanilla. It was held 36 times in 120 games and fired 0 times. It's exempt from the gate.
- Auctioneer: OK.
- Sommelier: FIXED. It was silent. Guard: `Sommelier: … (named)`. Cross: a Clearance half-price badged member counts.
- Patroness: OK. Cross: a badged member recruited for Mentor counts.
- Black Market: FIXED. Its log line read "Black Market: P1 pays …", which isn't the "P1's Black Market" form, so it didn't count as named. Guard: `Black Market: once per game …`. Its question comes after the re-queued buy step (documented: "also"). Cross: a Doppelganger copy is a second use.
- Snob: OK.
- Recluse: OK.

## Magenta (thieves)
- Pickpocket: OK at 2 / 3 / 4 by round. Cross: Sticky Fingers + Desperado makes it (2+1)×2 = 6 in round I.
- Tip-off: OK. Cross: a richer player in the Hideout can't be tipped off.
- Hideout: FIXED for Cory's ruling. It shields resources only, and members stay takeable. Changes:
  - `guardSteal` blocks only kind `res`, and the text is updated.
  - Updated `spheres/thieves.test.js` (the Hideout test) and `interactions.test.js` (Ransom in the Hideout).
  - `design/spheres/thieves.md` is updated.
  - Guard: `Hideout (Cory's ruling): your members can still be taken, by Heist, Ransom and Trade`.
- Rob: OK. Cross: a bystander's Lookout fires once.
- Ransom: FIXED. After the ruling, a Hideout holder who chose "pay" kept the member and paid nothing, because the payment went through the steal guard. They now pay. Guard: the Ransom part of the Hideout ruling test. Cross: Watchdog blocks it. See QUESTION 3.
- Heist: OK. The victim's free recruit costs up to the stolen card's cost. Cross: Light Fingers fires on that free recruit.
- Cutpurse, Mole, Accomplice, Grifter, Lookout, Light Fingers, Extortionist: FIXED (log form). They logged "Mole: P1 took 1 from P2", which doesn't count as naming the card. They now log "P1's Mole: took 1 from P2." Guards: each card's `(named)` test.
  - Cross for Accomplice: a stolen Accomplice doesn't fire again.
  - Cross for Lookout: a Lookout that fired, then got stolen, stays spent for the round.
- Sticky Fingers: FIXED. It was silent: the bigger steal was never named. Guard: `× Sticky Fingers +1 and Desperado double`. See QUESTION 4.
- Desperado: FIXED. It was silent, same cause and same guard.
- Robin Hood: FIXED. On a member steal (Heist, Ransom, Double Agent), "the player with the most followers" was checked after the card had already moved, so taking the leader's big member could miss. It now checks who led before the steal. Guard: `× Heist: taking a member from the leader counts`.
- Watchdog: OK: Ransom, Heist and Double Agent can't reach the owner's members. DEAD-BY-DESIGN for the gate: it changes no number.
- Double Agent: OK.
- Big Score: OK, rounds down. Cross: a Doppelganger copy is a second use. See QUESTION 5.
- Kingpin: OK.

## White (trading)
- Haggle: OK. Cross: Midas.
- Buy Low: OK. The cap is 2 per round number.
- Pawn: QUESTION 10 (Cory's play: in round I it can't sell). FIXED meanwhile: it skipped the sale silently. It now logs "Pawn: P1 has no followers to sell yet (only followers you bought or won can be sold)." Guards: `cards-skips-b.test.js` (Pawn) and `Pawn in round I with nothing bought or won`. Cross: an Echo copy redoes Pawn, because a sale is a trade.
- Sell High: OK. It only sells won or bought followers. Its no-sale line now gives the same reason as Pawn's (see QUESTION 10).
- Cash In: FIXED. With no white, the trade part was skipped silently; it now logs it.
- Boom: OK. You can keep your white.
- Shopkeeper: OK.
- Dealer: FIXED. It was silent: White's `sell()` ran the hook outside the engine's trace. It now runs through `ctx.asMember`. Guard: `Dealer: … (named)`. Cross: a Doppelganger copy gives +1 more each.
- Pawnbroker: FIXED (log form). The line now reads "P1's Pawnbroker: sold 1 follower for 3 white." With nothing to sell, it says why. It's back each round. Cross: with Reinvestor, the sale makes the next member 2 cheaper.
- Safety Net: OK.
- Tipster: OK.
- Lender: FIXED (display): the game-end part printed "Lender +-1". Guard: `Lender: …`. Cross: a stolen Lender doesn't pay again, and a Doppelganger copy pays +5 at turn end.
- Magnate: OK. It's rare with bots, about 1 fire in 13 holds, but it fires.
- Heiress: OK.
- Bulk Buyer: OK. Buying 3 adds 1; buying 1 adds nothing.
- Broker: OK on Cash In. See QUESTION 6.
- Exporter: OK.
- Liquidator: FIXED. Its sale line didn't name it. Guard: `Liquidator: … (named)`. See QUESTION 7.
- Reinvestor: FIXED. Its line "P1's next member costs N less" didn't name it. Guard: `Reinvestor: … (named)`. At the doubled costs, 2 sold makes Tycoon 4 cheaper.
- Raider: OK. See QUESTION 7.

## Green (echo)
- Hum, Chant, Encore, Recall, Eternity: OK.
- Echo: OK. Cross: copying a Pickpocket makes the copier steal. Copying a Hideout gives you your own Hideout, and it can't take from the first one's holder.
- Evergreen: OK.
- Choir, Muse, Choirmaster, Tuning Fork: FIXED. They were silent: echo.js `heard()` gave the green with no line naming them. Each now runs through `ctx.asMember`. Guards: each card's `(named)` test. Cross: a Doppelganger copying Choir gives +2.
- Fan: OK.
- Groupie: OK.
- Translator: FIXED. It was silent. The copy line now says "as green by P1's Translator". Switched off, the copy keeps its color. Guard: `Translator: …`. Cross: Midas then turns the green into gold. See QUESTION 8.
- Wallflower: FIXED. It was silent. The copy line now says "doubled by P1's Wallflower". It doesn't double when you aren't last. Guard: `Wallflower: …`. See QUESTION 8.
- Keepsake: FIXED. Its copy line didn't name it ("P1's Keepsake: P1 copied …"). Guard: `Keepsake: … (named)`.
- Afterimage: FIXED. It was silent, same cause. Guard: `Afterimage: … (named)`.
- Mirror: OK.
- Hourglass: OK. Its copy line now names it too. Cross: an Hourglass used this round stays used after a Heist.
- Déjà Vu: OK. Its copy lines now name it too.
- Chronicler: OK.

## Gate: a skipped printed part says so
`src/test/engine/v4/cards-skips-b.test.js` checks all 23 Blue, Magenta, White and Green actions; Hum is the opener in its positions.
- **Barren position:** with only an opening Hum on the board, each action must ask a question, change a number, or log a line after "took".
- **Rich vs barren:** if an action asks its taker a question in a rich position, it must log a line saying why when it skips that question in the barren position.
- **What it caught:** Pawn's silent no-sale and Price Check's silent zero. The same review fixed Showroom's zero and Cash In's empty trade.

## Questions for Cory
1. **Price Check:** "gain blue equal to half the cost of your priciest member." The text doesn't say how to round, and odd costs exist (Jackpot 11). [Round down, as coded. Print "(rounded down)" the way Clearance does.]
2. **Spree through Straggler:** Straggler moves a worker after the last placement, so it isn't anyone's turn. Spree still queues 2 extra buys for that player before the contests; I ran this in a scene. "This turn you buy 3 times." [No extra buys outside your own turn.]
3. **Ransom paid from a Hideout:** the holder may still pay to keep the member. Is that payment a steal, so that Lookout and Robin Hood react? [No. It's a payment the Hideout doesn't stop, and no steal reactions fire. That's the current fix.]
4. **Sticky Fingers and Desperado on member steals:** do "your steals" include Cutpurse, Mole, Accomplice, Grifter, Lookout, Extortionist and Big Score? Today only action steals grow (Pickpocket, Tip-off, Hideout, Rob, Gold's Steal). [Actions only.]
5. **Big Score:** when the rival with the most magenta is in the Hideout, it takes from the next one down. [Keep that. The alternative is that it finds nothing.]
6. **Broker on Buy Low:** "whenever a White action gives you followers, +1 more." Buy Low gives followers one trade at a time, so Broker pays +1 per resource traded (2 trades gives +2). Cash In pays it once. [Once per action use.]
7. **"Up to" with no choice:** Liquidator ("sell up to 5") and Raider ("buy up to 3") always take the most they can. [Let the player choose how many.]
8. **Translator and Wallflower on "do it yourself" copies:** a copy of a space that took or traded (Steal, Pawn, Bargain) redoes the action, and neither card applies. [Keep: they change resources a copy hands over, not an action you redo.]
9. **Doppelganger copying a when-recruited member:** copying Accomplice, Grifter, Double Agent, Keepsake or Mirror does nothing, because copies skip "when recruited". Lender was ruled a full copy. [Fire the copied effect once when the copy is made, like Lender.]
10. **Pawn, and selling in general:** only followers you bought or won can be sold, so Pawn's sale does nothing in round I. Cory hit this in play. Not changed here; it's his open call. [Any follower can be sold, down to a floor of 1. That's the recommendation; the foreman sends it if Cory says yes.]

## Counts
82 cards checked (Crew and Shareholder are plain):
- OK: 43
- FIXED: 33
- QUESTION only: 4 (Pawn, Broker, Big Score, Raider)
- DEAD-BY-DESIGN for bots or the gate: 2 (Social Climber, Watchdog)

Some cards carry both FIXED and a question (Price Check, Ransom, Liquidator, Translator, Wallflower, Sticky Fingers, Desperado). Spree is OK with a question.
