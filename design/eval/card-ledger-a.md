# Card ledger A: Gold, Red, Purple, Silver, Yellow, guest members

Card-by-card check (2026-10-14). Each card has a scenario test that plays it through real moves, checks the printed numbers, and checks that a log line names the card whenever it changes a number. Most cards also get one cross-sphere case. Plain cards ("Worth N followers", "No effect") are skipped.

- **Tests:** `src/test/engine/v4/cards-{gold,red,purple,silver,yellow,benders}.test.js`, with helpers in `cards-helpers.js`.
- **Gate:** the second block of `src/test/engine/v4/fire-audit.test.js`, run through `fire-audit-runner.js`. It plays 140 seeded easy-bot games on mixed tables and takes about 25s. Every member with an effect that gets recruited must be named acting at least once.
- **Report:** `node scripts/v4-fire-audit.mjs [games] [levels] [spheres]`. It exits 1 if any member stays silent.

Status key:
- **OK:** text and code agree and the card leaves a trace.
- **FIXED:** it was silent or wrong; the guarding test is named.
- **QUESTION:** for Cory; the current behavior is shown in [brackets].
- **DEAD-BY-DESIGN:** it can't fire in some setups.

## Engine fixes that cover many cards
- **F1, core `traceChanges`:** a hook's trace used to be dropped whenever *any* line was logged while it ran. So Underdog's "gold gain 3 → 6" hid Banker's +6. Now only a new line that names the card counts as the hook saying so itself. The check also runs only when a number actually changed. Guarded by: cards-gold "Banker × Underdog", "Tax Collector … Underdog doubles it", "Seed Money × Underdog".
- **F2, core `recruit`:** when-recruited effects now leave a trace like other hooks. They used to be silent. Guarded by: Seed Money, Retinue, Feast Hall, Silver Spoon, Pilgrim tests.
- **F3, core `use`:** activated members are traced too. All of them already named themselves, so this is a safety net.
- **F4, purple `fire()`:** onExtraTurn and onRivalExtraTurn now run through `ctx.asMember` (the twin agent's helper). Foreman, Courier, Apprentice and Overseer were silent.
- **F5, silver `giveTo`/`afterGive`:** these now run through `ctx.asMember`. Guest and Caterer were silent.
- **F6, core logs for rule-benders:**
  - The round's opening line now names Front-runner ("P1's Front-runner: always picks first") and Extra Hand ("P1's Extra Hand: +1 worker").
  - The recruit line names Insider ("from the pile with P1's Insider").
  - It also names Freelancer when a colored part was paid in other colors.

## Gold
- Joint Venture: **FIXED.** Its gift now goes through Silver's `give()`, so the giver's Caterer fires too (+1 silver). Guest already got +1 from the interactions agent's fix. Test: cards-silver "Caterer × Joint Venture".
- Rush, Discount, Steal, Windfall, Strike: **OK.**
- Midas: **OK.** Converts action gains to gold and names itself; with Prospector it adds +1, and Tinker stays quiet.
- Banker: **FIXED (F1).** It was unnamed whenever Underdog doubled it.
- Prospector: **OK.** A Doppelganger copy adds another +1.
- Tax Collector: **FIXED (F1).**
- Merchant: **OK.** A gold-leaning guest (Big Spender) counts as a gold member.
- Thrift: **OK.** The recruit note reads "Thrift: gold counts double". The old audit's regex just missed it.
- Coin Purse: **OK.** A free Hire counts.
- Underdog: **OK.** Names itself; a tie doesn't count. See Q2, Q3 and Q6.
- Tinker: **OK.** See Q2.
- Investor: **OK.** onLeave was added by the interactions agent, per Cory's ruling.
- Jackpot, Speculator: **OK.** Speculator × Underdog quadruples (see Q3).
- Tycoon: **OK.** Appears in the final parts.
- Seed Money: **FIXED (F2).**
- Hustler: **OK.** Pays again on a Straggler move or a Squatter join in its color.

## Red
- Scout, Turnout, Hire, Hire Up, Take: **OK.**
- Trade: **OK.** The limit is the rival's cost ≤ yours + 2, as printed.
- Mentor & Protégé: **FIXED.** It now logs "P1's Mentor & Protégé: the cheapest face-up member comes along free". The protégé counts as a second recruit for Recruiter and Recruiting Drive.
- Proselytizer, Recruiter, Host, Crowd-Pleaser: **OK.**
- Recruiting Drive: **OK.** A Big Spender second buy triggers it.
- Sponsor: **OK.** The note reads "Sponsor saves 2"; it stacks with Discount.
- Mob, Patriarch: **OK.** A Doppelganger copying Mob pays a second Mob part.
- Doppelganger: **OK.** See Q1 and the dead-by-design entry below.

## Purple
- Hourly, Catch Up, Wind-up, Linger, Overtime, Rally: **OK.**
- Second Wind: **FIXED.** It now logs "P1's Second Wind: P1 takes an extra turn".
- Errand Runner: **FIXED (same).** A rival's Overseer and Relay react to its turn, and both are named.
- Taskmaster: **FIXED.** It now logs "P1's Taskmaster: pays 5 purple …".
- Late Riser: **OK.** It goes before a rival's Front-runner.
- Foreman, Courier, Apprentice, Overseer: **FIXED (F4).**
- Double Time: **FIXED.** Prices now read "(Double Time: 6 → 3)" on Overtime, Rally, Taskmaster and Relay. A Doppelganger copy doesn't halve again.
- Relay: **FIXED.** It now logs "P2's Relay: pays 3 purple for a turn right after P1".
- Bookkeeper, Clockmaker, Patience: **OK.**
- Lamplighter: **OK.** See Q4.

## Silver
- Toast, Gift, Alms, Silver Tongue, Rising Tide, Jubilee: **OK.**
- Guest: **FIXED (F5).** Joint Venture's gold counts as a gift.
- Benefactor: **OK.** A rival's Guest gets +1 more.
- Caterer: **FIXED (F5, plus the Joint Venture fix).**
- Majordomo, Toastmaster: **OK.** A Straggler move onto a Silver space counts as taking it.
- Silversmith: **OK.** With Grand Host it still adds just +1.
- Steward, Heir: **OK.**
- Retinue, Feast Hall, Silver Spoon: **FIXED (F2).**
- Gala: **FIXED.** The log was "threw a Gala"; it now reads "P1's Gala: …". A rival's Guest gets +1 more.
- Grand Host: **FIXED.** It now logs "P1's Grand Host: the space's 3 silver comes as 6". Before, Toast's own line claimed +3 and nothing explained the 6. A Doppelganger copy gives ×4.
- Patron Saint: **OK.**

## Yellow
- Harvest, Bloom, Transmute, Prism, Gather, Flourish: **OK.**
- Gardener, Peddler, Dyer, Late Bloomer, Farmer, Weaver, Explorer, Feastmaker: **OK.** Midas leaves member income alone. A Doppelganger copy of Farmer adds +1. A Straggler move counts for Explorer.
- Gleaner: **OK.** A Midas-converted gain of 2 gold counts as "another color".
- Admirer: **OK.** A gold-leaning guest counts as gold.
- Go-Between: **OK.** A guest leaning to a sphere that isn't on the table gives nothing.
- Sower: **FIXED.** If it left mid-round (released, stolen or swapped), the planted yellow vanished silently. Now it comes back unharvested, matching Cory's Investor ruling. Test: cards-yellow "Sower × Release". Please confirm (Q5).
- Harmonist: **OK.** The unit test passes. Normal bots rarely end the game holding a full set, so it seldom fires in sims.
- Pilgrim: **FIXED (F2).**
- Rainmaker: **OK.** See Q3.

## Guest members (benders.js)
- Squatter, Big Spender, Straggler: **OK.**
- Freelancer, Insider, Extra Hand, Front-runner: **FIXED (F6).** In the old audit, Front-runner was recruited in 77 games and named in none.

## Dead by design
- **Doppelganger recruited as your first member:** it has nothing to copy and never can, so it's a 1-follower card. The twin's gate flagged it once.

## Questions for Cory
1. **Doppelganger and when-recruited members.** When Doppelganger copies a member whose only effect is "when recruited" (Seed Money, Pilgrim, Feast Hall, Silver Spoon, Mentor, Errand Runner, Retinue's gift), does that effect fire for the copy? [No: the copy gets nothing. Bots still value such copies a little.]
2. **What counts as a gold gain for Underdog.** Underdog doubles "every gold gain". Do bonus golds that skip the gain step count? These are Prospector's +1, Tinker's half, Hustler's +1 per round number, and Investor's doubled return. [No: only real gains are doubled.]
3. **Underdog with other doublers.** Underdog doubles Rainmaker's gold, so it goes past "match your yellow". It also doubles Speculator's doubling, which quadruples. [Yes to both, since it's "every gold gain".]
4. **Lamplighter.** It says "+1 purple per worker you get this round (3 / 4 / 5)". Does Extra Hand's extra worker count? [No: it pays the printed 3 / 4 / 5.]
5. **Sower leaving mid-round.** Planted yellow now comes back unharvested, mirroring your Investor call. Is that right? [Yes, it comes back.]
6. **Two Underdogs.** A Doppelganger copying Underdog doubles only once (no ×4), while a copied Grand Host gives ×4. [Once.]
7. **Linger and extra turns.** Linger counts as "an extra turn" for Foreman, Courier, Apprentice, Overseer and Relay. That's a house rule in purple.md, but no card says so. Should Linger's card text print it? [Yes, print it on Linger.]
