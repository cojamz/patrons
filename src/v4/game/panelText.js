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
// Line 2 stays within about 16 letters: at 1270×700 a narrow panel holds two short lines of it (Cory: "cut words or
// step the size down. Never clip and never abbreviate into code"). A condition that decides the gain never sits only in
// line 3 (it's dropped when the ring has no room), and on the center ring, where line 2 can drop too, it sits in line 1
// (w2b #2/#24: "Gain each color" gave nothing without its "per full set"; "Take a member" hid that it's a rival's).
const P = {
  gold: {
    jv: { main: '+3 gold', second: 'pick who gets 1' },
    rush: r => ({ main: `+${2 * r} gold`, note: byRound(2, 4, 6) }),
    discount: { verb: 'Save 4', second: 'on next member' },
    steal: { main: '+3 gold', second: 'from rivals' },
    windfall: { main: '+1 gold', second: 'per member' },
    strike: { verb: 'Double your gold' },
  },
  red: {
    evenswap: { main: '+1 red', second: 'swap, equal cost', note: 'a member with a rival' },
    turnout: { main: '+1 red', second: 'per recruit by all', note: 'this round' },
    hire: { verb: 'Free recruit', second: 'the cheapest' },
    hireup: { verb: 'Free recruit', second: 'cost 4 or less' },
    trade: { verb: 'Swap a member', second: 'with a rival', note: 'theirs can cost 2 more' },
    take: { verb: 'Free recruit', second: 'any member' },
  },
  market: {
    bargain: { main: '+2 blue', second: 'then recruit', note: 'in any colors' },
    restock: { main: '+2 blue', second: 'refresh the shop' },
    showroom: { main: '+1 blue', second: '+1 per blue on sale', note: 'members in the shop' },
    clearance: { verb: 'Half-price recruit', second: 'as your buy' },
    pricecheck: { verb: 'Gain blue', second: 'half your priciest', note: 'member’s cost' },
    spree: { verb: 'Buy 3 times', second: 'this turn' },
  },
  purple: {
    hourly: r => ({ main: `+${3 + r} purple`, note: byRound(4, 5, 6) }),
    catchup: { main: '+1 purple', second: '+2 per rival with more minions', note: 'on the board' },
    windup: { main: '+1 purple', second: 'per minion out' },
    planahead: { main: '+1 purple', second: 'per minion left' },
    overtime: { verb: '2 extra turns', second: 'for 8 purple', note: 'can’t pay? +3 purple' },
    rally: { verb: 'Extra turns for all purple', second: '1 per 4, plus 1' },
  },
  silver: {
    toast: r => ({ main: `+${3 * r} silver`, second: 'others get 1', note: byRound(3, 6, 9) }),
    gift: { main: '+2 silver', second: '+2 of a color', note: 'others get 1 of it' },
    alms: { main: '+4 silver', second: 'a rival gets 2' },
    tongue: { main: '+4 silver', second: 'trade silver', note: 'others get 1 silver' },
    tide: { verb: 'Gain silver', second: 'half the richest', note: 'others get 1' },
    jubilee: { main: '+1 @f', second: 'per 2 silver', note: 'others get 2 silver' },
  },
  yellow: {
    harvest: { main: '+1 yellow', second: '+1 per other color', note: 'you hold' },
    bloom: { verb: 'Top up', second: '+1 of your fewest' },
    transmute: { main: '+1 yellow', second: 'swap up to 3', note: 'for other colors' },
    prism: { verb: '+1 each other color', second: 'per 3 yellow' },
    gather: { verb: 'Members pay out', second: '1 of their color' },
    flourish: { verb: '+1 each per full set', second: 'other colors' },
  },
  thieves: {
    pickpocket: r => ({ main: `+${r + 1} magenta`, second: 'from rivals', note: byRound(2, 3, 4) }),
    tipoff: { verb: 'Steal 1 each', second: 'from richer rivals' },
    hideout: { verb: 'Steal 1', second: 'then you’re safe', note: 'from steals this round' },
    rob: { main: '+3 magenta', second: 'from rivals', note: 'at least 1 each' },
    ransom: { verb: 'Ransom a member', second: 'they pay or lose it', note: 'costing 4 or less' },
    heist: { verb: 'Take a rival’s member', second: 'they recruit free' },
  },
  trading: {
    haggle: { main: '+2 white', second: '+1 per higher score', note: 'players with more @f' },
    buylow: r => ({ verb: 'Trade for followers', second: `1 for 1, up to ${2 * r}`, note: byRound(2, 4, 6) }),
    pawn: r => ({ main: `+${r} @f`, second: `or +${2 * r} white`, note: byRound(1, 2, 3) }),
    sellhigh: { verb: 'Sell followers', second: '3 white each', note: 'up to 2' },
    dividend: { main: '+1 white', second: 'per loose @f' },
    boom: { verb: 'All for followers', second: '1 for 1' },
  },
  echo: {
    chant: r => ({ main: `+${2 * r} green`, note: byRound(2, 4, 6) }),
    echo: { verb: 'Copy a space', second: 'a rival just took' },
    encore: { verb: 'Copy a space', second: 'taken this round' },
    refrain: { main: '+2 green', second: 'and redo a space', note: 'one you took this round' },
    eternity: { verb: 'Redo all your spaces', second: 'from this round' },
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
