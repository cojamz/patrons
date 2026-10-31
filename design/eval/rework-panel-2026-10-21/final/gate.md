# Gate: last check before Cory (rework panel, 2026-10-21)

Read: brief.md, cory-judge.md (rubric v3), pitch-ledger.md, the six finals, live core.js and content/*.js. Engine facts checked: the board clears at round start (core.js startRound sets `state.slots = {}`), so Purple's Closing Time can read round III minions at game end; a tied contest halves the prize; a member given into a rival's cult is an arrival and does not fire its On Recruit (core.js `joinNow` comment), so Silver's Regift claim holds; live Tithe and Treasurer count bodies (`memberCount`), live Potluck counts bodies (`countMembersOfColor`); live Rainmaker is "raise each of your colors to match your yellow" at 3+1; live Snob 3+2 counts blue bodies; Recluse is live in market.js (Blue).

## Cross-file conflicts (resolve before any one color goes to Cory)
1. **Recluse** is claimed by Silver (pick 5) and White direction 2 (pick 5); Blue drops it. One pick for Cory, asked once: Silver, unless White's catch-up direction wins.
2. **Cards vs bodies.** Yellow (every space) and Silver (Patron Saint) want to count member cards; Gold (Tithe, Treasurer), Blue (Snob) and Recluse count bodies, which is Cory's rule ("worth N counts as N members"). Two counting rules in one game fails "interesting but not complicated". Gate default: keep bodies everywhere and cap instead (Bumper Crop "at most 10", Patron Saint priced for bodies at 3+4). One pick, not two.
3. **Tithe vs Potluck vs Harvest.** Tithe ("+1 gold per member") and Potluck ("each member brings 1 of its color") are siblings in different currencies; acceptable. Yellow's new Harvest ("+1 yellow per member card, at most 3") is Tithe in yellow, a slight variation (ledger ❌ shallow-pitch). Harvest must change, not Tithe.
4. **Kickback vs Silver.** Cory called Kickback's gift "too close to Silver's theme" (Oct 15), and Silver's final is all gifts. If Silver's direction is approved, Kickback drops the gift ("+2 gold" plus the +1). Not optional.
5. **Boomtown vs Purple.** Gold's flag is stale: Purple's final cuts Rush Hour. Purple's Catch Up and Plan Ahead count your own minions, Boomtown counts minions on Gold spaces. No conflict.
6. **Rainmaker vs "match".** Gold's final dropped Gold Standard, so Yellow's flag is stale. The live overlap is White direction 1's Draw Level and Spoiler ("gain enough of it to tie its leader"), a second "raise a color to a number" verb. Rainmaker is his liked card and stays; White's tie verb is the one Cory may call a variation.
7. **Catch-up stacking.** Silver aims four cards at "the rival with the fewest followers", White direction 2 is all catch-up, and Crunch Time plus the snake already help the trailer. If both ship, two colors work the same axis. Silver's trailer rule needs a tiebreak either way (below).
8. **Contests to "most held".** Purple, White and Blue each ask, buried inside other picks. Ask once for all three.
9. **Followers straight off a space or card, not from members:** Silver's High Tide (up to 10), Yellow's Feast (per member card, acceptable), White's Small Wins ("+1 follower × round", feeds buy-followers-only directly), Last Laugh and Fresh Blood (gated on a member buy, acceptable). Small Wins must go.

## Gold
1. Broken: Treasurer ("gain gold equal to your member count") is uncapped and every other per-member gain prints a cap; Red multi-body cults reach 12–15 bodies in round III. Add "(at most 10)". Tycoon ("+1 follower per 2 gold") uncapped: softer, a 20-gold hoard scores 10, watch it. Caps applying after Underdog is an engine change (caps sit in resolve before modifyGain today); flag for the build.
2. Kickback stays 3/3/3 in every round: "kinda don't scale" risk, and the gift collides with Silver (conflict 4).
3. Followers: Double Down widened gives up to +10 of any color in round III, which a hoarder turns into a 10-pack. The cap holds it; no member bypass beyond that.
4. Picks: 1 is two questions in one; rewrite. 3 (Penny Pincher "card only") has no live alternative left since Splurge was cut: drop. 2, 4, 5 fine.
5. Verdict: changed, 55%. It's mostly his Gold; the widened Double Down is the part he'll argue.

Rewritten picks:
1. Double Down becomes "Double one of your colors (at most +10)", so anyone can use it in round III [yes]. (Jackpot as a separate line only if he asks for a new Gold.)
2. Collect Debts ("Take up to 3 gold from rivals") stays in Gold as the only check on piles at the Gold and Red table [stays].
3. Midas ("Your gains from actions come as gold") leaves the deck [leaves].
4. Boomtown replaces Intro Offer: "+1 gold per other minion on Gold spaces" [yes].
5. Kickback drops its gift ("+1 gold to a rival you choose") since Silver now owns gifts [drop it].

## Purple
1. Broken: Closing Time ("+2 followers per purple space you're on") has no cap; Crunch Time plus Night Owl can sit on 5–6 purple spaces, 10–12. Add "(at most 10)". Overnight needs a space round-end hook (new engine work); its round III version only scores the contest: fine, plain. Fast Forward and Alarm Clock re-fire any color's income members (Banker, Benefactor, Allowance), capped at 6: holds.
2. Plan Ahead (3/2/1) and Catch Up (1/2/3) are exact mirrors on the same ring; Cory listed "Catch up, plan ahead, rush hour" together (#92). Real risk of "same thing". Latecomer adds a third "per minion placed" count.
3. Followers: Latecomer and Closing Time are members. No bypass. Buy-followers-only gets 2–4 from round I spaces, nothing more.
4. Picks: 1 bundles three changes and the contest; rewrite. 5 (Latecomer) is a card yes/no: keep, it's new. Contest goes to cross pick 8.
5. Verdict: changed, 55%. He'll like fewer turn jumps and Catch Up being his; Overnight may read as "Gather with a delay".

Rewritten picks:
1. Purple stays the color of when: Crunch Time kept, round II "Your members' round-start income comes again now, up to 6" and "+1 purple now, +4 at round end" [yes].
2. Only Crunch Time and Night Owl move turns; Late Riser ("at round start, if you have the fewest followers, take an extra turn") and the other turn cards go [yes].
3. Round I is your Catch Up ("+1 purple per minion you've placed this round"), its mirror Plan Ahead ("per minion you have left"), and Clock In 2/3/4 [yes, but tell us if the mirror feels like the same space].
4. New scorer "Game end: +2 followers per purple space you're on (at most 10)" replaces Timekeeper [yes].
5. Latecomer: "When recruited: +1 follower per minion you've placed this round" [yes].

## Silver
1. Broken: "the rival with the fewest followers" has no tiebreak, and in round I everyone is tied, so Care Package, Good Deed and Benefactor have no target on the first turns. Fix with the game's own order: "ties: whoever picks earlier this round". Care Package's round I is 3–4 plus a free member to a rival; it outclasses Toast and Good Deed (2) in the same ring (rubric 6): drop its round I cap to 2 or its gain to half the cost. Fruitcake needs a new "leaves your cult" hook; no loop (each exit costs a placement or a rival's action).
2. Followers: High Tide pays up to 10 followers straight off the space, skipping members (conflict 9). Keep it as his pick; the trade-off (you concede the silver contest) is real.
3. Pick 3 offers "or put it under the pile for its cost", which is Release with a refund ("Release needs to go entirely"): drop the pick. Pick 5 goes to cross pick 1. Patron Saint's card count goes to cross pick 2.
4. Verdict: yes, 60%. Built on his words (Rising Tide, "get rid of members", Patron Saint, Retinue); High Tide followers vs silver is where he'll change it.

Rewritten picks:
1. Silver as the generous host: every space gives the table something first, then pays you off the richest rival, and Regift ("Give one of your members to the rival with the fewest followers, gain silver equal to its cost, up to 6") lets you give members away [yes].
2. High Tide: "Everyone else +3 silver. Then gain 1 follower per silver the richest rival holds, up to 10", or the same count in silver [followers].
3. Silver's gifts always go to the rival with the fewest followers, ties to whoever picks earlier, not a rival you choose [yes].

## Yellow
1. Broken: Bumper Crop ("each of your member cards brings you 2 of its color") is uncapped; 5–6 cards is 11–13, and a Blue-buying cult with 8 is 16. Print "(at most 10)". Harvest repeats Tithe (conflict 3); five spaces and cards now count members (Harvest, Potluck, Feast, Bumper Crop, Chefs), which is "three variations of one verb" territory ("not thinking broadly enough", Oct 18). Harvest is the one to replace.
2. Followers: Feast ("+1 follower per member card that isn't yellow") skips the buy but is paid by members. Acceptable; it's the pick that answers "Yellow doesn't want members".
3. Convert ("pick a color: it's a member of that color") needs a token on the card; it plays into every color counter (Snob, Patron Saint, Mob). Keep but note the screen cost. Rainmaker one-color at 6 rewrites a card he liked; that's a fair pick.
4. Picks: 2 goes to cross pick 2. 4 (Chefs at 7) is his call already: drop.
5. Verdict: changed, 50%. Direction fits his "doesn't want members" note; he'll trim the counters.

Rewritten picks:
1. Yellow becomes "your members bring their colors": round III "Each of your members brings you 2 of its color (at most 10)", or repainting resources (Dye) [members].
2. Feast, new round II: "+1 follower per member you have that isn't yellow" [yes].
3. Rainmaker: "Raise one of your colors to match your yellow" at 6, or keep "raise each of your colors" at 9 [one color].
4. Convert: "When recruited, pick a color: it's a member of that color" [yes].

## White
1. Broken (direction 2): Small Wins ("+1 follower × round") is followers off a space and exactly what buy-followers-only wants: cut. Last Laugh pays the hoarder who stays behind all game (hold, take +10 in round III, buy big): the "sandbag" line the file names is real; the member-buy gate is what holds it. "The leader" needs a tie rule (two tied leaders).
2. Broken (direction 1): Top Dog ("+2 white per contest you lead") pays whoever is already ahead on contests: win-more (ledger tag). Swap for "+1 white × round" or cut. "Take a prize early" is a new base-rule state on every rim, the kind he called "too much redesign" (Oct 9) and "new base rules come from him".
3. Followers: direction 1 moves prizes, adds none. Draw Level is up to +5 of any color in round II, top of the band.
4. Picks: 2 (closes vs scores again) and 3 ("up to two" vs every contest) are details Claude should settle: drop. 5 goes to cross pick 1.
5. Verdict: direction 1 changed or no, 50% (base-rule change); direction 2 changed, 50% (his note, but stacks catch-up). Overall: he picks one and rebuilds half of it.

Rewritten picks:
1. White's direction: "take a contest's prize early" (that contest won't score at round end), or "pay whoever is behind on followers, up to drawing level, only when they buy a member" [early prize].
2. Either way, White drops follower trading (Sell High, Dividend, All In, Cheap Seats, the loose follower rule) [drop].

## Blue members
1. Broken: nothing loops. Plus-One ("Recruit: buy again this turn") re-fires on a swap, bounded. Personal Shopper ("+1 follower per member you buy after your first buy") must say whether a free recruit counts; "pay for" in the text fixes it. Window Dresser is a Blue round I space on a card, the same objection the file used to rank deck B second; it's Panel's shape, so it survives.
2. Followers: Shopaholic ("You can always buy twice") lets a hoarder buy two 10-packs a turn in round III. It's his words, so flag it in one line, don't restrict it.
3. Contest goes to cross pick 8. Pick 5 (bring back Insider, default no) is a question with a no answer: drop. Pick 3 stays: "+1 follower per" may read to him as a drip.
4. Verdict: yes, 65%. Two cards are his own ("you can always buy twice", "one-time activate"); prices are where he'll change it.

Rewritten picks:
1. Blue's members as "every extra buy pays": Plus-One, Entourage, Window Dresser, Allowance, Personal Shopper, Snob, Shopaholic, 3 slots open [yes].
2. Personal Shopper: "+1 follower per member you pay for after your first buy each turn" at 5 [yes].
3. Shopaholic, "You can always buy twice", at 9 [9].

## Cross picks (ask once, not per color)
1. Recluse ("+2 followers per rival with more members than you") moves to Silver, or to White if White becomes catch-up [Silver].
2. Every "per member" card counts bodies as today (a worth-3 member counts 3), with caps, instead of Yellow and Patron Saint counting cards [bodies].
3. Purple, White and Blue score "most held at round end" like the reworked colors [yes].
