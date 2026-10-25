// Members left out of the deck (Cory, 2026-10-15: "cull member piles down to the best existing 10, per our
// principles and balance tests"; the list and why each went: design/spheres/cull-10.md). The cards stay
// defined, so old records and the card tests still read them; a table with rules.cull off deals them again.
export const CUT = new Set([
  'gold.midas', 'gold.investor', 'gold.hustler', 'gold.jackpot', 'gold.coinpurse',
  'red.intern', 'red.reserve', 'red.drive', 'red.crowd', 'red.bigfamily', 'red.sponsor',
  'echo.afterimage', 'echo.translator', 'echo.wallflower', 'echo.groupie', 'echo.choir', 'echo.understudy', 'echo.mirror',
  'market.reseller', 'market.onlooker', 'market.auctioneer', 'market.curator', 'market.blackmarket',
  'market.climber', // Cory, 2026-10-18: cut (dead while Release is off); its fill-in is his call
  'market.planner', 'market.underbidder', 'market.sommelier', // concept branch: cost cuts out (Cory, 2026-10-18)
  'market.minimalist', 'market.recluse', // Cory, 2026-10-21: Minimalist no; Recluse to another color
  'purple.errand', 'purple.foreman', 'purple.apprentice', 'purple.taskmaster', 'purple.doubletime',
  'purple.overseer', // Cory, 2026-10-18: cut; its replacement is his call
  'purple.bookkeeper', 'purple.lamplighter', 'purple.patience', // Cory, 2026-10-22: his Purple set of 12
  'silver.silversmith', 'silver.toastmaster', 'silver.caterer', 'silver.dowager', 'silver.steward',
  'yellow.harmonist', 'yellow.sower', 'yellow.farmer', 'yellow.gardener', 'yellow.gleaner',
  'thieves.accomplice', 'thieves.mole', 'thieves.lightfingers', 'thieves.bigscore', 'thieves.lookout',
  'trading.lender', 'trading.tipster', 'trading.dealer', 'trading.pawnbroker', 'trading.liquidator',
  'trading.safetynet', 'trading.magnate', 'trading.shareholder', 'trading.reinvestor', // Cory, 2026-10-22: his White set of 12
  'benders.bigspender', 'benders.insider',
  'trading.bulkbuyer', 'trading.appraiser', 'market.makeover', // Cory, 2026-10-24: thinning ("I like Closer rest can go"); Restocker replaces Makeover
]);

// The card and scenario tests pin seeded decks and deal cut cards by id, so the test setup deals the full deck through
// this switch (src/test/setup.js); it stays out of DEFAULT_RULES so the build's content stamp sees the real table.
export const FULL_DECK = { tests: false };
