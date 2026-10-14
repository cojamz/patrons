// What a space does, in a few words, printed on the space itself so the board reads without hovering (Cory,
// 2026-10-14: "actions readable without hover"). Resource words become symbols via <Rich>. The full text and the
// exact "you'd get" stay in the hover card. A value that grows by round is shown for the current round.
// Keys are "<sphere id>.<action key>". A space with no entry here falls back to its first clause (shortEffect).
const S = {
  gold: {
    jv: '+3 gold · gift 1', rush: r => `+${2 * r} gold`, discount: '−4 cost', steal: 'steal 3 gold', windfall: '+1 gold/member', strike: 'double gold',
  },
  red: {
    scout: '+2 red · bury 1', turnout: '+1 red/recruit', hire: 'cheapest, free', hireup: '+2 red · cheapest', trade: 'swap a member', take: 'any member, free',
  },
  blue: { a1: '+3 blue', a2: '+2 blue +1 red', a3: '+2 blue +1 green', a4: '+5 blue', a5: '+4 blue +1 gold', a6: '+8 blue' },
  green: { a1: '+3 green', a2: '+2 green +1 gold', a3: '+2 green +1 blue', a4: '+5 green', a5: '+4 green +1 red', a6: '+8 green' },
  purple: {
    hourly: r => `+${3 + r} purple`, catchup: '+1 purple, +2/rival', windup: '+1 purple/minion', planahead: '+2 purple/left', overtime: 'pay 8: 2 turns', rally: 'purple → turns',
  },
  silver: {
    toast: r => `+${3 * r} silver · all +1`, gift: '+2 silver +2 · share', alms: '+4 silver · give 2', tongue: '+4 silver · swap', tide: 'half the richest', jubilee: 'silver → followers',
  },
  yellow: {
    harvest: '+1 yellow/color', bloom: '+1 each missing', transmute: 'swap 3 · +1 yellow', prism: '+1 each/3 yellow', gather: '1 per member', flourish: '+1 each/set',
  },
  market: {
    bargain: '+2 blue · recruit', restock: '+2 blue · new row', showroom: '+1 blue/badged', clearance: 'half-price buy', pricecheck: 'blue = ½ priciest', spree: 'buy 3 times',
  },
  thieves: {
    pickpocket: r => `steal ${r + 1}`, tipoff: 'steal 1 each richer', hideout: 'steal 1 · safe', rob: 'steal 3', ransom: 'ransom a member', heist: 'steal a member',
  },
  trading: {
    haggle: '+2 white +1/leader', buylow: r => `${2 * r} → followers`, pawn: r => `${r} follower or +${2 * r} white`, sellhigh: 'sell 2 for 6 white', dividend: '+1 white/loose follower', boom: 'all → followers',
  },
  echo: { hum: '+3 green', chant: r => `+${2 * r} green`, echo: 'copy a rival', encore: 'copy any', refrain: '+2 green · copy yours', eternity: 'copy all yours' },
};

/** The few words printed on a space. `round` is the current round (1–3). */
export function shortEffect(qid, action, round = 1) {
  const v = S[qid] && S[qid][action.key];
  if (typeof v === 'function') return v(Math.max(1, Math.min(3, round)));
  if (typeof v === 'string') return v;
  if (action.short) return action.short;
  // fallback: the first clause, at most 4 words
  return String(action.text || action.name).split(/[,.;:]/)[0].split(/\s+/).slice(0, 4).join(' ');
}
