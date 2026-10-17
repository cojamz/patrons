import { quadrant } from '../engine/v4/index.js';

/**
 * A contest's rule as the rim and the round's cards say it: a rule that counts a resource names it as one ("Most
 * purple" → "Most purple resources"). "Most purple" beside "Most magenta members" left "most what?" (live panel r1).
 */
export function ruleWords(qid, rule) {
  let q = null;
  try { q = quadrant(qid); } catch { return rule; }
  const held = q && q.scoring && /^the \w+ you hold when the round ends$/.test(q.scoring.counts || '');
  return held && String(rule).trim().toLowerCase() === `most ${q.resource}` ? `${rule} resources` : rule;
}

// What a space does, in a few words, printed on the space itself so the board reads without hovering (Cory,
// 2026-10-14: "actions readable without hover"). Resource words become symbols via <Rich>. The full text and the
// exact "you'd get" stay in the hover card. A value that grows by round is shown for the current round.
// Keys are "<sphere id>.<action key>". A space with no entry here falls back to its first clause (shortEffect).
const S = {
  gold: {
    jv: '+3 gold · 1 gold to a rival', rush: '+2 gold × round', discount: '−4 cost', steal: 'steal 3 gold', windfall: '+1 gold per member', strike: 'double gold',
  },
  red: {
    evenswap: '+1 red · swap', turnout: '+1 red per recruit', hire: 'cheapest, free', hireup: 'member up to 4, free', trade: 'swap a member', take: 'any member, free',
  },
  blue: { a1: '+3 blue', a2: '+2 blue +1 red', a3: '+2 blue +1 green', a4: '+5 blue', a5: '+4 blue +1 gold', a6: '+8 blue' },
  green: { a1: '+3 green', a2: '+2 green +1 gold', a3: '+2 green +1 blue', a4: '+5 green', a5: '+4 green +1 red', a6: '+8 green' },
  purple: {
    hourly: r => `+${3 + r} purple`, catchup: '+1 purple, +1 per rival who placed more', windup: '+1 purple per minion you placed', planahead: '+1 purple per minion left', overtime: '1 extra turn', rally: 'your next 2 turns, now',
  },
  silver: {
    toast: r => `+${3 * r} silver · others +${r} silver`, gift: '+2 silver +2 · share', alms: '+4 silver · give 2', tongue: '+4 silver · swap', tide: 'half the top rival’s', jubilee: 'silver for followers',
  },
  yellow: {
    harvest: '+1 yellow per color', bloom: '+1 of your fewest', transmute: '+2 yellow · then swap up to 3', prism: '+1 each per 3 yellow', gather: '1 per member', flourish: '+1 each per set',
  },
  market: {
    bargain: '+2 blue · may pay for an extra member', restock: '+2 blue · new row', showroom: '+1 blue, +1 per face-up blue', clearance: 'half-price buy', pricecheck: 'half your priciest member’s cost', spree: 'buy 3 times',
  },
  thieves: {
    pickpocket: r => `steal ${r + 1}`, tipoff: 'steal 1 each richer', hideout: 'steal 1 · safe', rob: 'steal 3', ransom: 'ransom a member', heist: 'steal a member',
  },
  trading: {
    haggle: '+2 white, +1 per leader', buylow: '+1 follower per 3 white', pawn: r => `${r} follower · may take 2 white each instead`, sellhigh: 'sell 2 for 6 white', dividend: '+1 white per follower bought or won', boom: 'all for followers',
  },
  echo: { hum: '+3 green', chant: '+2 green × round', echo: 'copy previous', encore: 'copy any taken', refrain: 'copy yours', eternity: 'copy all yours' },
};

// The shortest form, for the inner rings. Two symbols only (Cory, 2026-10-15: "just simplify visual language
// everywhere"): resource words become dots and "N followers" the follower mark; everything else is a plain word.
const PIPS = {
  gold: { steal: 'steal 3 gold', windfall: '+1 gold per member', strike: 'double gold' },
  red: { hireup: 'member up to 4, free', trade: 'swap a member', take: 'any member, free' },
  purple: { rushhour: '+1 purple per 2 minions' },
  silver: { tide: 'half the top rival’s', jubilee: 'silver for followers' },
  yellow: { gather: '+1 per member' },
  market: { clearance: 'half price', spree: 'buy 3 times' },
  thieves: { rob: 'take 3 any', ransom: 'ransom a member', heist: 'take a rival’s member' },
  trading: { sellhigh: 'sell 2 for 6 white', dividend: '+1 white per follower', boom: 'all for followers' },
  echo: { refrain: 'copy yours', eternity: 'copy all' },
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
