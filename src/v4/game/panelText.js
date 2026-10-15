// What a space's panel says, for a first-time player who hasn't read the rulebook (Cory, 2026-10-15: "we tried to get
// too cute with the action visual language. now it's hard to decipher"). Three lines at most, no pictures:
//   main   line 1, biggest: the gain as a number and its resource dot ("+3 gold"), or followers ("+1 @f")
//   verb   line 1 instead when the space gains nothing directly: the verb in plain words ("Copy a space")
//   second line 2: the rest as a short, complete plain phrase that makes sense alone ("a rival you pick gets 1")
//   note   line 3, small and only if needed: a clarification ("2 · 4 · 6 by round" as { byRound })
// The only marks are the resource dot (a resource word right after a number) and the follower mark (@f). The
// space's name opens with its hover. design/eval/rollout/r2-decipher.md checks every line against the real rule.
import { pipEffect } from '../shorts.js';

const byRound = (a, b, c) => ({ byRound: [a, b, c] });
const P = {
  gold: {
    jv: { main: '+3 gold', second: 'a rival you pick gets 1' },
    rush: r => ({ main: `+${2 * r} gold`, note: byRound(2, 4, 6) }),
    discount: { verb: 'Save 4', second: 'on your next member' },
    steal: { main: '+3 gold', second: 'taken from rivals' },
    windfall: { main: '+1 gold', second: 'per member you have' },
    strike: { verb: 'Double your gold' },
  },
  red: {
    evenswap: { main: '+1 red', second: 'and swap a member with a rival', note: 'of equal cost' },
    turnout: { main: '+1 red', second: 'per member recruited', note: 'this round, by anyone' },
    hire: { verb: 'Free recruit', second: 'the cheapest member' },
    hireup: { verb: 'Free recruit', second: 'a member costing 4 or less' },
    trade: { verb: 'Swap a member', second: 'for a rival’s', note: 'theirs can cost 2 more' },
    take: { verb: 'Free recruit', second: 'any member' },
  },
  market: {
    bargain: { main: '+2 blue', second: 'then recruit a member', note: 'in any colors' },
    restock: { main: '+2 blue', second: 'and refresh the shop' },
    showroom: { main: '+1 blue', second: '+1 per blue member in the shop' },
    clearance: { verb: 'Recruit at half price', second: 'as your buy' },
    pricecheck: { verb: 'Gain blue', second: 'half your priciest member’s cost' },
    spree: { verb: 'Buy 3 times', second: 'this turn' },
  },
  purple: {
    hourly: r => ({ main: `+${3 + r} purple`, note: byRound(4, 5, 6) }),
    catchup: { main: '+1 purple', second: '+2 per rival with more minions out' },
    windup: { main: '+1 purple', second: 'per minion you have out' },
    planahead: { main: '+1 purple', second: 'per minion still to place' },
    overtime: { verb: '2 extra turns', second: 'for 8 purple', note: 'can’t pay? +3 purple' },
    rally: { verb: 'Extra turns', second: 'spend all your purple', note: '1 per 4, plus 1, up to 2' },
  },
  silver: {
    toast: r => ({ main: `+${3 * r} silver`, second: 'everyone else gets 1', note: byRound(3, 6, 9) }),
    gift: { main: '+2 silver', second: '+2 of another color', note: 'everyone else gets 1 of it' },
    alms: { main: '+4 silver', second: 'a rival you pick gets 2' },
    tongue: { main: '+4 silver', second: 'then trade silver for a color', note: 'everyone else gets 1 silver' },
    tide: { verb: 'Gain silver', second: 'half the richest rival’s', note: 'everyone else gets 1' },
    jubilee: { main: '+1 @f', second: 'per 2 silver you hold', note: 'everyone else gets 2 silver' },
  },
  yellow: {
    harvest: { main: '+1 yellow', second: '+1 per other color you hold' },
    bloom: { verb: 'Top up', second: '+1 of each color you hold least' },
    transmute: { main: '+1 yellow', second: 'and swap up to 3 resources', note: 'for other colors' },
    prism: { verb: 'Gain each color', second: 'one per 3 yellow you hold' },
    gather: { verb: 'Members pay out', second: 'each gives 1 of its color' },
    flourish: { verb: 'Gain each color', second: 'one per full set you hold' },
  },
  thieves: {
    pickpocket: r => ({ main: `+${r + 1} magenta`, second: 'stolen from rivals', note: byRound(2, 3, 4) }),
    tipoff: { verb: 'Steal 1 each', second: 'from rivals richer than you' },
    hideout: { main: '+1 magenta', second: 'stolen from a rival', note: 'then no one can steal from you' },
    rob: { main: '+3 magenta', second: 'stolen from rivals', note: 'at least 1 from each' },
    ransom: { verb: 'Ransom a member', second: 'a rival pays its cost or loses it', note: 'costing 4 or less' },
    heist: { verb: 'Take a member', second: 'from any rival', note: 'they get a free recruit' },
  },
  trading: {
    haggle: { main: '+2 white', second: '+1 per player with more followers' },
    buylow: r => ({ verb: 'Buy followers', second: `1 resource each, up to ${2 * r}` }),
    pawn: r => ({ main: `+${r} @f`, second: `or +${2 * r} white instead` }),
    sellhigh: { verb: 'Sell followers', second: 'up to 2, for 3 white each' },
    dividend: { main: '+1 white', second: 'per loose follower' },
    boom: { verb: 'Cash in', second: 'all your resources for followers', note: '1 for 1, white optional' },
  },
  echo: {
    chant: r => ({ main: `+${2 * r} green`, note: byRound(2, 4, 6) }),
    echo: { verb: 'Copy a space', second: 'a rival took since your turn' },
    encore: { verb: 'Copy a space', second: 'anyone took this round' },
    refrain: { main: '+2 green', second: 'then copy a space of yours', note: 'from this round' },
    eternity: { verb: 'Copy all your spaces', second: 'from this round' },
  },
};

/** { main, verb, second, note } for a space this round (any may be null; note may be { byRound: [a, b, c] }). */
export function panelText(qid, action, round = 1) {
  const r = Math.max(1, Math.min(3, round));
  let v = P[qid] && P[qid][action.key];
  if (typeof v === 'function') v = v(r);
  if (v) return { main: v.main || null, verb: v.main ? null : v.verb || null, second: v.second || null, note: v.note || null };
  // the plain spheres: "+2 blue +1 red" is the gain, a clause a line when the panel is narrow
  const [main, ...rest] = String(pipEffect(qid, action, r)).split(' · ');
  return { main, verb: null, second: rest.length ? rest.join(', ') : null, note: null };
}

/** Every entry, for the decipher table and the tests: [qid, key, lines] (round 2). */
export const panelEntries = () => Object.entries(P).flatMap(([qid, m]) => Object.keys(m).map(key => [qid, key, panelText(qid, { key }, 2)]));

/** A line as plain text (for measuring): "2 · 4 · 6 by round". */
export const lineText = line => (!line ? '' : typeof line === 'string' ? line : `${line.byRound.join(' · ')} by round`);
