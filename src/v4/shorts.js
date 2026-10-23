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
    evenswap: 'swap any 2 equal-cost members; +1 red', turnout: r => `+${r + 1} red`, hire: 'recruit cheapest, free; +1 red', hireup: 'promote: shop costs up to 2 more; +1 red', trade: 'demote: shop costs at least 2 less; +1 red', take: 'recruit any shop member, free; +1 red',
  },
  blue: { a1: '+3 blue', a2: '+2 blue +1 red', a3: '+2 blue +1 green', a4: '+5 blue', a5: '+4 blue +1 gold', a6: '+8 blue' },
  green: { a1: '+3 green', a2: '+2 green +1 gold', a3: '+2 green +1 blue', a4: '+5 green', a5: '+4 green +1 red', a6: '+8 green' },
  purple: {
    hourly: r => `+${3 + r} purple`, catchup: '+1 purple, +1 per rival who placed more', windup: '+1 purple per minion you placed', planahead: '+1 purple per minion left', overtime: '1 extra turn', skip: '+4 purple, skip your next turn', holdup: r => `+${r} purple, the next turn is skipped`, crowdin: '+2 purple, place on taken spaces', rally: '+1 purple, two turns after this one', again: r => `+${r} purple, another turn after this one`,
  },
  silver: {
    toast: r => `+${3 * r} silver · others +${r} silver`, gift: '+2 silver +2 · share', alms: '+4 silver · give 2', tongue: '+4 silver · swap', tide: 'half the top rival’s', jubilee: 'followers from the top rival’s silver',
  },
  yellow: {
    harvest: '+1 yellow per color', bloom: r => `+${r} yellow · +1 of your fewest`, transmute: '+2 yellow · then swap up to 3', prism: '+1 each per 3 yellow', gather: '1 per member', flourish: '+1 each per set',
  },
  market: {
    bargain: r => `send 3 to the bottom; +${r + 1} blue`, restock: 'one color to the bottom; +1 blue each, +1', showroom: 'peek at 4, may recruit one; +1 blue', clearance: 'recruit twice; +1 blue', pricecheck: 'bury one, half its cost in blue; +1', spree: 'recruit 3 times; +3 blue',
  },
  thieves: {
    pickpocket: r => `steal ${r}; +${r} followers; +1 magenta`, tipoff: 'steal 1 per already occupied magenta action; +1 magenta', hideout: r => `steal ${r}; safe from steals this round; +1 magenta`, rob: 'steal half a rival’s one-color pile, round down; +1 magenta', ransom: 'rival pays member’s cost or loses it; cost 5 or less; +1 magenta', heist: 'take a rival’s member; +1 magenta',
  },
  trading: {
    stipend: r => `+${r} followers +${r + 1} white`, splurge: '+1 follower per 2 spent on your recruit; +1 white', exchange: r => `turn ${r} into ${2 * r} followers; +1 white`, farewell: 'bury a member for its cost in followers; +1 white', estatesale: 'bury a member for its cost in white; +1 white', cashin: 'all your white into followers; +1 white',
    haggle: '+2 white, +1 per leader', buylow: '+1 follower per 3 white', pawn: r => `${r} follower · may take 2 white each instead`, sellhigh: 'sell 2 for 6 white', dividend: '+1 white per follower bought or won', boom: 'all for followers',
  },
  echo: { hum: '+1 green per other occupied green action; +1 green', chant: r => `+${r + 1} green`, echo: 'copy previous; +1 green', encore: 'copy a rival’s action; +1 green', refrain: 'copy your action; +1 green', eternity: 'copy all your actions; +1 green' },
};

// The shortest form, for the inner rings. Two symbols only (Cory, 2026-10-15: "just simplify visual language
// everywhere"): resource words become dots and "N followers" the follower mark; everything else is a plain word.
const PIPS = {
  gold: { steal: 'steal 3 gold', windfall: '+1 gold per member', strike: 'double gold' },
  red: { hireup: 'promote a member', trade: 'demote a member', take: 'recruit any member, free' },
  purple: { lastcall: '+2 followers per minion left, rest go last' },
  silver: { tide: 'half the top rival’s', jubilee: 'followers from the top rival’s silver' },
  yellow: { gather: '+1 per member' },
  market: { clearance: 'recruit twice', pricecheck: 'bury for half its cost', spree: 'recruit 3 times' },
  thieves: { rob: 'steal half a one-color pile', ransom: 'rival pays or loses member', heist: 'take a rival’s member' },
  trading: { stipend: r => `+${r} followers +${r + 1} white`, splurge: '+1 follower per 2 spent', exchange: r => `${r} into ${2 * r} followers`, farewell: 'bury one for followers', estatesale: 'bury one for white', cashin: 'all white for followers', sellhigh: 'sell 2 for 6 white', dividend: '+1 white per follower', boom: 'all for followers' },
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
