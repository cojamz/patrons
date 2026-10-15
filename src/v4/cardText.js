// A member card's two printed lines (plate 1b, design/prototypes/language/grammar.md): a short plain-word "when"
// ("When you recruit", "Round start"), at most two lines on the shop card, sitting right on the effect, in the
// grammar's form: the number first, the shared marks inline. The full sentence stays in the card's hover.
//
// Most cards split themselves (TRIGGERS, then compact()). SHORT holds every hand-made wording, one map: a when-line
// that won't fit two lines at the shop card's width, or an effect that needs the marks to read at a glance. Never
// truncate: a line that doesn't fit gets a shorter wording here (src/test/v4/ui/card-text.test.js measures them all).
//
// Effect tokens (drawn by Info.jsx <Marks>): @m a member, @r a rival, @f a follower, @t an extra turn, -> becomes,
// " / " per, "×" times. Resource words ("gold", "any") become their dots (Rich).

/** Hand-made lines by member id: { when?, eff? } (a key left out keeps the automatic one; when: '' means none). */
export const SHORT = {
  'gold.midas': { when: 'Action gains', eff: 'all -> gold' },
  'gold.prospector': { when: 'When an action gains you gold', eff: '+1 gold' },
  'gold.taxman': { when: 'When the leader buys @f', eff: '+1 gold' },
  'gold.merchant': { when: 'When anyone recruits gold @m', eff: '+1 gold' },
  'gold.thrift': { when: 'Gold spent on @m', eff: '×2 gold' },
  'gold.coinpurse': { when: 'When you recruit a non-gold @m', eff: '+1 gold' },
  'gold.underdog': { when: 'While anyone has more gold', eff: '×2 gold gains' },
  'gold.tinker': { when: 'When an action gains you a color', eff: '+½ as gold' },
  'gold.investor': { when: 'Round start → end', eff: 'gold ×2' },
  'gold.jackpot': { eff: '+gold = richest @r' },
  'gold.speculator': { eff: '×2 gold' },
  'gold.tycoon': { eff: '+1 @f / 3 gold' },
  'gold.seed': { eff: '+1 gold / @m' },
  'gold.hustler': { when: 'Pick a color: its actions', eff: '+1 gold / round' },
  'red.volunteer': { when: 'Free', eff: '' },
  'red.mentor': { eff: 'cheapest @m free' },
  'red.proselytizer': { eff: '+1 @f' },
  'red.mob': { eff: '+1 @f / red @m' },
  'red.drive': { when: 'Recruit 2+ in one turn', eff: '+2 red' },
  'red.host': { eff: '+1 red / 2 @m' },
  'red.sponsor': { when: 'Your members cost', eff: '−2' },
  'red.crowd': { when: 'When you buy @f', eff: '+1 red' },
  'red.doppel': { eff: 'copy your @m' },
  'red.patriarch': { eff: '+1 @f / 2 @m' },
  'purple.secondwind': { eff: '+1 @t' },
  'purple.errand': { eff: '+1 @t' },
  'purple.taskmaster': { eff: '5 purple -> @t' },
  'purple.lateriser': { when: 'Round start, if fewest @f', eff: '+1 @t first' },
  'purple.foreman': { when: 'When you take an extra turn', eff: '+1 purple / minion' },
  'purple.courier': { when: 'When you take an extra turn', eff: '+1 each other' },
  'purple.apprentice': { when: 'When you take an extra turn', eff: '@m −4' },
  'purple.overseer': { when: 'When a rival takes an extra turn', eff: '+½ purple' },
  'purple.doubletime': { when: 'Extra turns you pay for', eff: '½ price' },
  'purple.bookkeeper': { when: 'At your last minion', eff: '+1 purple / 2 minions' },
  'purple.clockmaker': { eff: '+1 purple / 2 purple' },
  'purple.lamplighter': { eff: '+1 purple / minion' },
  'purple.nightowl': { when: 'After your last minion', eff: '+1 @t' },
  'purple.patience': { eff: '+1 @f / 3 purple' },
  'silver.guest': { when: 'When you’re given something', eff: '+1 more' },
  'silver.benefactor': { eff: '+3 silver, @r +1' },
  'silver.caterer': { when: 'When you give to others', eff: '+1 silver' },
  'silver.majordomo': { when: 'When you take a Silver space', eff: '+2 silver' },
  'silver.silversmith': { when: 'When a rival takes a Silver space', eff: '+1 silver' },
  'silver.steward': { eff: '+1 silver / 3 silver' },
  'silver.retinue': { when: 'When recruited: others', eff: '+1 silver' },
  'silver.revelers': { when: 'Counts as', eff: '3 @m' },
  'silver.heir': { when: 'Now + round III start', eff: '+1 silver / @m' },
  'silver.spoon': { eff: '+½ richest’s silver' },
  'silver.toastmaster': { when: 'When you take a Silver space', eff: '+1 @f' },
  'silver.gala': { eff: '×2 silver' },
  'silver.grandhost': { when: 'Silver spaces give you', eff: '×2 silver' },
  'silver.saint': { eff: '+1 @f / 2 silver @m' },
  'yellow.gardener': { eff: '+1 each missing' },
  'yellow.peddler': { eff: '+1 each other' },
  'yellow.gleaner': { when: 'When an action gains you 2+ of a color', eff: '+1 yellow' },
  'yellow.admirer': { when: 'When a rival recruits a color you lack', eff: '+1 of it' },
  'yellow.gobetween': { when: 'When you recruit a non-yellow @m', eff: '+1 of its color' },
  'yellow.dyer': { eff: '+1 yellow / color' },
  'yellow.latebloomer': { when: 'Round start, if fewest @f', eff: '+1 each' },
  'yellow.sower': { when: 'Round start → end', eff: 'plant yellow' },
  'yellow.harmonist': { eff: '+1 @f / set' },
  'yellow.rainmaker': { eff: 'all = yellow' },
  'yellow.pilgrim': { eff: '+1 each' },
  'yellow.farmer': { when: 'When an action gains you yellow', eff: '+1 yellow' },
  'yellow.weaver': { when: 'When you buy 6+ @f', eff: '+1 each' },
  'yellow.explorer': { when: 'When you take a space outside Yellow', eff: '+1 yellow' },
  'yellow.feastmaker': { eff: '+1 each / round' },
  'market.stylist': { when: 'When anyone recruits blue @m', eff: '+1 blue' },
  'market.onlooker': { when: 'When a rival recruits blue @m', eff: '+2 blue' },
  'market.connoisseur': { when: 'When you recruit blue @m', eff: '+2 blue' },
  'market.reseller': { eff: '+1 of its color' },
  'market.curator': { eff: '+1 blue / other blue @m' },
  'market.planner': { eff: '@m −2 / round' },
  'market.underbidder': { eff: '@m −2 / @r with more @m' },
  'market.minimalist': { eff: '+1 blue / @r with more @m' },
  'market.climber': { when: 'When you release a @m', eff: '+2 any' },
  'market.auctioneer': { when: 'When a rival recruits non-blue @m', eff: '+1 blue' },
  'market.sommelier': { when: 'When you recruit blue @m', eff: '@m −2' },
  'market.patroness': { when: 'When you recruit blue @m', eff: '+1 @f' },
  'market.blackmarket': { when: 'Once a game, your turn', eff: 'recruit from top 5' },
  'market.snob': { eff: '+1 @f / blue @m' },
  'market.recluse': { eff: '+2 @f / @r with more @m' },
  'thieves.cutpurse': { eff: 'take 1 from richest' },
  'thieves.mole': { eff: 'take 1 / @r ahead' },
  'thieves.accomplice': { eff: 'take 1 / @r' },
  'thieves.grifter': { eff: 'take 1 / 2 @m' },
  'thieves.sticky': { when: 'Your steals', eff: '+1 more' },
  'thieves.desperado': { when: 'While you have the fewest @f, steals', eff: '×2' },
  'thieves.robinhood': { when: 'When you steal from the leader', eff: '+1 @f' },
  'thieves.lookout': { when: 'Once a round, when a rival steals', eff: 'take 1 back' },
  'thieves.lightfingers': { when: 'When a rival recruits an 8+ @m', eff: 'take 1' },
  'thieves.extortionist': { when: 'When a rival buys 6+ @f', eff: 'take 2' },
  'thieves.watchdog': { when: 'Rivals can’t take', eff: 'your @m' },
  'thieves.doubleagent': { eff: 'swap for @r’s @m' },
  'thieves.bigscore': { eff: 'take ½ top magenta' },
  'thieves.kingpin': { eff: '+1 @f / 2 magenta' },
  'trading.dealer': { when: 'When you sell @f', eff: '+1 white each' },
  'trading.pawnbroker': { eff: '1 @f -> 3 white' },
  'trading.safetynet': { when: 'Now + round start, if no white', eff: '+3 white' },
  'trading.tipster': { when: 'When a rival buys @f', eff: '+1 white' },
  'trading.lender': { when: 'Now, then −2 @f at game end', eff: '+5 white' },
  'trading.magnate': { eff: '+1 @f / 3 white' },
  'trading.heiress': { eff: '+1 white / @m' },
  'trading.bulkbuyer': { when: 'When you buy 3+ @f', eff: '+1 @f' },
  'trading.broker': { when: 'When a White action gives you @f', eff: '+1 @f' },
  'trading.exporter': { when: 'When you recruit a non-white @m', eff: '+1 white' },
  'trading.liquidator': { eff: '≤5 @f -> 2 white each' },
  'trading.reinvestor': { when: 'When you sell @f', eff: '@m −2 / @f' },
  'trading.raider': { eff: '≤3 @f from leader' },
  'echo.choir': { when: 'When you copy a space', eff: '+1 green' },
  'echo.muse': { when: 'When a rival copies your space', eff: '+2 green' },
  'echo.understudy': { eff: 'copy a @r’s space' },
  'echo.ensemble': { when: 'When you copy a rival’s space', eff: '+1 @f' },
  'echo.groupie': { when: 'When anyone recruits green @m', eff: '+1 green' },
  'echo.translator': { when: 'What you copy', eff: '-> green' },
  'echo.tuningfork': { when: 'When you copy a space', eff: '+1 of its color' },
  'echo.wallflower': { when: 'While you have the fewest @f, copies', eff: '×2' },
  'echo.mirror': { eff: 'green = top @r’s' },
  'echo.afterimage': { eff: 'copy a space of yours' },
  'echo.hourglass': { eff: 'copy your space' },
  'echo.dejavu': { eff: 'copy all yours' },
  'echo.chronicler': { eff: '+1 @f / 2 green' },
  'benders.squatter': { eff: 'join a taken space' },
  'benders.bigspender': { eff: '2 buys' },
  'benders.freelancer': { when: 'Pay colored parts in', eff: 'any' },
  'benders.insider': { when: 'You may also recruit from', eff: 'top 3' },
  'benders.extrahand': { when: 'Round III', eff: '+1 minion' },
  'benders.frontrunner': { when: 'Every round', eff: 'pick first' },
  'benders.straggler': { when: 'Once a round, after the last minion', eff: 'move yours' },
};

// The opening clause that says when a card acts, and its plain-word when-line.
const TRIGGERS = [
  [/^Now and at round start[,:]\s*/i, 'Now + round start'],
  [/^Now and at the start of round III[,:]\s*/i, 'Now + round III start'],
  [/^(?:At )?round start[,:]\s*/i, 'Round start'],
  [/^(?:At )?round end[,:]\s*/i, 'Round end'],
  [/^Game end[,:]\s*/i, 'Game end'],
  [/^Once per game[,:]\s*/i, 'Once a game'],
  [/^Once per round[,:]\s*/i, 'Once a round'],
  [/^When (?:recruited|it joins you)[,:]\s*/i, 'When recruited'],
  [/^(Whenever|When|While) ([^,]+),\s*/i, m => `${/^while/i.test(m[1]) ? 'While' : 'When'} ${m[2]}`],
];

/** An effect clause in the grammar's form: number first, marks for the nouns that have one. */
export function compact(text) {
  let t = String(text || '').trim().replace(/\.$/, '');
  t = t.replace(/\btake an extra turn right after this one\b/gi, '+1 @t');
  t = t.replace(/\byour next member costs (\d+) less\b/gi, '@m −$1');
  t = t.replace(/(\d+) followers?\b/g, '$1 @f');
  t = t.replace(/ per member you have\b/g, ' / @m').replace(/ per (\d+) members\b/g, ' / $1 @m');
  t = t.replace(/ per round number\b/g, ' / round');
  t = t.replace(/ per (\d+) ([a-z]+)\b/g, ' / $1 $2');
  t = t.replace(/^double your (\w+)$/i, '×2 $1');
  t = t.replace(/^gain /i, '+');
  return t;
}

const WORTH = /^Worth (\d+) followers?\.\s*/i;
/** { when, eff } for a member def: the shop card's two lines (eff '' when the card does nothing but count). */
export function cardLines(def) {
  const hand = SHORT[def.id] || {};
  let rest = String(def.text || '').replace(WORTH, '').trim();
  if (/^no effect\.?$/i.test(rest)) rest = '';
  let when = '', eff = rest;
  for (const [re, label] of TRIGGERS) {
    const m = rest.match(re);
    if (m) { when = typeof label === 'function' ? label(m) : label; eff = rest.slice(m[0].length); break; }
  }
  eff = compact(eff);
  // a card that only counts: its worth is the effect ("5 👤")
  if (!rest) { when = ''; eff = `${def.f} @f`; }
  return {
    when: hand.when != null ? hand.when : when,
    eff: hand.eff != null ? hand.eff : eff,
  };
}

/** How wide a line reads, in ems of its type (marks and dots count as a glyph): the shop card picks the effect's size by it. */
export function effSize(eff) {
  const s = String(eff || '');
  const glyphs = (s.match(/@[mrft]|\b(?:gold|red|blue|green|magenta|silver|yellow|purple|white|any)\b/g) || []).length;
  const plain = s.replace(/@[mrft]|\b(?:gold|red|blue|green|magenta|silver|yellow|purple|white|any)\b/g, '').replace(/\s+/g, ' ').trim().length;
  const ems = plain * 0.5 + glyphs * 0.9;
  return ems <= 5.2 ? 'l' : ems <= 8.4 ? 'm' : 's';
}
