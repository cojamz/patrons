# Cull to 10 members per sphere (historical, built 2026-10-15)

Green was superseded by the agreed twelve-member redesign on October 18: [current Green spec](green-redesign-2026-10-18.md). Other colors retain the cull below.

Cory: "cull member piles down to the best existing 10, per our principles and balance tests." Only existing cards are used here. Each cut was judged against the rework principles in sphere-brief.md and against the bench (claude/cults-bench c768aba, Normal bots, 440 seeds; "fair" is the price at which recruiting the card breaks even, against its printed price). Prices and texts come from the fix branch (claude/project-thread-hysli4, after balance pass 3). Mark it by sphere, or say "all good".

## The cull
1. **Gold.** Keep Banker, Prospector, Tax Collector, Merchant, Penny Pincher, Underdog, Tinker (as Alchemist), Speculator, Tycoon and Treasurer. Cut Midas (a switch to manage), Investor (remembers gold across the round), Hustler (your call: a choice to remember), Lottery Winner (your call) and Middleman (a +1 trickle that duplicates Prospector).
2. **Red.** Keep Twins, Big Family, Volunteer, Mentor & Protégé, Proselytizer, Mob, Recruiter, Host, Sponsor and Patriarch. Cut Intern and Benchwarmer (both "No effect", the same card as Volunteer), Pied Piper (a fiddly combo for +2), Crowd-Pleaser (a +1 trickle) and Doppelganger (moves to Green, your call).
3. **Green.** Keep Busker, Muse, Understudy, Ensemble, Impressionist, Mime (with your reservation), Stunt Double, Tribute Band, Chronicler and Doppelganger (moved in from Red). Cut Sleepwalker (your call: hard to track), Translator (a switch; bench fair −1 at 4), Wallflower (pays you for being last, then switches itself off), Groupie (a +1 trickle; fair 2 at 8) and Choir (Impressionist's twin at a higher price).
4. **Blue.** Keep Stylist, Connoisseur, Planner, Underbidder, Minimalist, Social Climber, Sommelier, Patroness, Snob and Recluse. Cut Reseller (the same card as Yellow's Go-Between, which covers your "Reseller goes Yellow"), Onlooker and Auctioneer (both Stylist again, on rivals' turns), Curator (fair 0.1) and Talent Scout (peeking at hidden cards; fair below 0).
5. **Purple** (the fix branch is still changing its spaces). Keep Go-Getter, Late Riser, Courier, Overseer, Bookkeeper, Clockmaker, Lamplighter, Night Owl, Timekeeper and Shift Crew. Cut Errand Runner (Go-Getter does it better at the same price), Foreman and Apprentice (the same "whenever you take an extra turn" as Courier), Taskmaster (fair 2 at 6) and Corner-Cutter (it halves purple costs for extra turns, which purple spaces no longer charge).
6. **Silver.** Keep Guest, Benefactor, Majordomo, Retinue, Revelers, Heir, Upstart, Debutante, Grand Host and Patron Saint. Cut Silversmith and Toastmaster (Majordomo's "take a Silver space" trigger twice more), Caterer (a +1 trickle), Dowager (a plain "worth 3", which Retinue already covers) and Steward (a second round-start silver card after Benefactor).
7. **Yellow.** Keep Peddler, Admirer, Go-Between, Dyer, Late Bloomer, Rainmaker (priced up, your call), Pilgrim, Weaver, Explorer and Feastmaker. Cut Harmonist (fair 0.1), Sower (remembers what was planted; Investor's twin), Farmer (Prospector's twin; fair 1.9 at 6), Gardener (fair 1.6) and Gleaner (a fiddly "2+ at once" trigger).
8. **Magenta.** Keep Cutpurse, Grifter, Sticky Fingers, Desperado, Robin Hood, Extortionist, Bodyguard, Crew, Double Agent and Kingpin. Cut Accomplice (Cutpurse's job at twice the price), Mole (Cutpurse's twin), Light Fingers (the cost cutoff you cut from Blue), Safecracker (the pile it halves is always thin) and Lookout (fires on rivals' turns).
9. **White.** Keep Shopkeeper, Rich Uncle, Magnate, Shareholder, Heiress, Bulk Buyer, Broker, Exporter, Reinvestor and Raider. Cut Lender (your call: hard to track), Tipster (the same card as your new Tax Collector), Dealer (fair below 0), Pawnbroker and Liquidator (both sell "loose followers", the word you flagged).
10. **Neutral.** No placeholders (Cory). Kept: Straggler, Squatter, Freelancer, Extra Hand, Front-runner. Cut: Big Spender and Insider (Cory).

Built as a deck rule in src/engine/v4/content/cull.js. Doppelganger moved to Green (Cory, 20:43), so every sphere deals 10; its rename and pick-at-recruit wait for his redesign. Fixes 11–13 are built; 14–18 wait.

## Small fixes from your verdicts (to build; redesigns stay out)
11. Tinker becomes Alchemist: "Whenever an action gains you another color, +1 gold."
12. Tax Collector: "Whenever a rival buys followers, +1 gold."
13. Tycoon: "Game end: +1 follower per 2 gold."
14. Prices: Banker comes down (it barely pays for itself), Underdog goes to 2 gold + 4 any (pending your answer on whether that price was Underdog's), and Rainmaker goes up. Each one is measured on the bench before it lands.
15. New Faces: "+2 blue, and discard 3 face-up members; 3 new ones come out" (instead of sweeping the whole row).
16. Echo: "Copy the last action taken."
17. Doppelganger: "When recruited: pick one of your members. This copies its ability for good, even if it changes hands."
18. Catch Up as you described it (1, 2 or 3 for your 1st, 2nd or 3rd minion) is word for word Purple's Roll Call: "+1 purple per minion you have on the board, this one included." Keep Roll Call and drop Catch Up?

Left as notes for your redesign, not built: Overtime, Shake Down, Sell High, Royal Family, Kickback's theme, and Squatter's strength in round III.
