// What a space does, in a few words, printed on the space itself so the board reads without hovering (Cory,
// 2026-10-14: "actions readable without hover"). Resource words become symbols via <Rich>. The full text and the
// exact "you'd get" stay in the hover card. A value that grows by round is shown for the current round.
// Keys are "<sphere id>.<action key>". A space with no entry here falls back to its first clause (shortEffect).
const S = {
  gold: {
    jv: '+3 gold · gift 1', rush: r => `+${2 * r} gold`, discount: '−4 cost', steal: 'steal 3 gold', windfall: '+1 gold per member', strike: 'double gold',
  },
  red: {
    evenswap: '+1 red · swap', turnout: '+1 red per recruit', hire: 'cheapest, free', hireup: 'member up to 4, free', trade: 'swap a member', take: 'any member, free',
  },
  blue: { a1: '+3 blue', a2: '+2 blue +1 red', a3: '+2 blue +1 green', a4: '+5 blue', a5: '+4 blue +1 gold', a6: '+8 blue' },
  green: { a1: '+3 green', a2: '+2 green +1 gold', a3: '+2 green +1 blue', a4: '+5 green', a5: '+4 green +1 red', a6: '+8 green' },
  purple: {
    hourly: r => `+${3 + r} purple`, catchup: '+1 purple, +2 per rival', windup: '+1 purple per minion', planahead: '+1 purple per minion left', overtime: 'pay 8 for 2 turns', rally: 'purple for turns',
  },
  silver: {
    toast: r => `+${3 * r} silver · all +1`, gift: '+2 silver +2 · share', alms: '+4 silver · give 2', tongue: '+4 silver · swap', tide: 'half the richest', jubilee: 'silver for followers',
  },
  yellow: {
    harvest: '+1 yellow per color', bloom: '+1 each missing', transmute: 'swap 3 · +1 yellow', prism: '+1 each per 3 yellow', gather: '1 per member', flourish: '+1 each per set',
  },
  market: {
    bargain: '+2 blue · recruit', restock: '+2 blue · new row', showroom: '+1 blue, +1 per face-up blue', clearance: 'half-price buy', pricecheck: 'half your priciest', spree: 'buy 3 times',
  },
  thieves: {
    pickpocket: r => `steal ${r + 1}`, tipoff: 'steal 1 each richer', hideout: 'steal 1 · safe', rob: 'steal 3', ransom: 'ransom a member', heist: 'steal a member',
  },
  trading: {
    haggle: '+2 white, +1 per leader', buylow: r => `${2 * r} for followers`, pawn: r => `${r} follower or +${2 * r} white`, sellhigh: 'sell 2 for 6 white', dividend: '+1 white per loose follower', boom: 'all for followers',
  },
  echo: { hum: '+3 green', chant: r => `+${2 * r} green`, echo: 'copy a rival', encore: 'copy any', refrain: '+2 green · copy yours', eternity: 'copy all yours' },
};

// The shortest form, for the inner rings. Two symbols only (Cory, 2026-10-15: "just simplify visual language
// everywhere"): resource words become dots and "N followers" the follower mark; everything else is a plain word.
const PIPS = {
  gold: { steal: 'steal 3 gold', windfall: '+1 gold per member', strike: 'double gold' },
  red: { hireup: 'member up to 4, free', trade: 'swap a member', take: 'any member, free' },
  purple: { overtime: 'pay 8 for 2 turns' },
  silver: { tide: 'half the richest', jubilee: 'silver for followers' },
  yellow: { gather: '+1 per member' },
  market: { clearance: 'half price', spree: 'buy 3 times' },
  thieves: { rob: 'take 3 any', ransom: 'ransom a member', heist: 'take a rival’s member' },
  trading: { sellhigh: 'sell 2 for 6 white', dividend: '+1 white per follower', boom: 'all for followers' },
  echo: { refrain: '+2 green · copy', eternity: 'copy all' },
};
/** The pips-first form of a space's yield (falls back to the few words). */
export function pipEffect(qid, action, round = 1) {
  const v = PIPS[qid] && PIPS[qid][action.key];
  if (typeof v === 'function') return v(Math.max(1, Math.min(3, round)));
  return typeof v === 'string' ? v : shortEffect(qid, action, round);
}

/** The few words printed on a space. `round` is the current round (1–3). */
export function shortEffect(qid, action, round = 1) {
  const v = S[qid] && S[qid][action.key];
  if (typeof v === 'function') return v(Math.max(1, Math.min(3, round)));
  if (typeof v === 'string') return v;
  if (action.short) return action.short;
  // fallback: the first clause, at most 4 words
  return String(action.text || action.name).split(/[,.;:]/)[0].split(/\s+/).slice(0, 4).join(' ');
}
