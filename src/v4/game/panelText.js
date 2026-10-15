// What a space's panel says (Cory, 2026-10-15: "simplify the visual language everywhere … remove the pixel images
// from the actions … a hierarchy of +resource / secondary effect / clarification"). Three lines at most, no pictures:
//   main   the gain, biggest: a number and a resource dot ("+3 gold"), or followers ("+1 @f"); absent when the space
//          gains nothing directly
//   second the secondary effect in plain words, medium ("swap a member", "copy a rival")
//   note   a clarification, small and quiet ("a rival gets 1", or { byRound } for "2 · 4 · 6 by round")
// The only marks are the resource dot (a resource word right after a number) and the follower mark (@f). No names:
// the name opens with the hover. A space with no entry here prints its pips-first yield (shorts.js) as main and note.
import { pipEffect } from '../shorts.js';

const byRound = (a, b, c) => ({ byRound: [a, b, c] });
const P = {
  gold: {
    jv: { main: '+3 gold', note: 'a rival gets 1' },
    rush: r => ({ main: `+${2 * r} gold`, note: byRound(2, 4, 6) }),
    discount: { second: '4 off a member', note: 'your next one' },
    steal: { main: '+3 gold', note: 'taken from rivals' },
    windfall: { main: '+1 gold', second: 'per member' },
    strike: { main: '×2 gold', note: 'doubles what you hold' },
  },
  red: {
    evenswap: { main: '+1 red', second: 'swap a member', note: 'with a rival, equal cost' },
    turnout: { main: '+1 red', second: 'per recruit', note: 'this round, by anyone' },
    hire: { second: 'free recruit', note: 'the cheapest one' },
    hireup: { second: 'free recruit', note: 'costing 4 or less' },
    trade: { second: 'swap a member', note: 'theirs may cost 2 more' },
    take: { second: 'free recruit', note: 'any face-up member' },
  },
  market: {
    bargain: { main: '+2 blue', second: 'recruit now', note: 'in any colors' },
    restock: { main: '+2 blue', second: 'fresh row', note: 'new members come out' },
    showroom: { main: '+1 blue', second: '+1 per blue member', note: 'face up in the shop' },
    clearance: { second: 'half-price recruit', note: 'as your buy' },
    pricecheck: { second: 'half your priciest', note: 'member’s cost, as blue' },
    spree: { second: 'buy 3 times', note: 'this turn' },
  },
  purple: {
    hourly: r => ({ main: `+${3 + r} purple`, note: byRound(4, 5, 6) }),
    catchup: { main: '+1 purple', second: '+2 per rival', note: 'with more minions out' },
    windup: { main: '+1 purple', second: 'per minion out', note: 'this one too' },
    planahead: { main: '+1 purple', second: 'per minion left', note: 'to place this round' },
    overtime: { second: '2 extra turns', note: 'pay 8 purple, or +3' },
    rally: { second: 'spend all purple', note: '1 turn per 4, plus 1' },
  },
  silver: {
    toast: r => ({ main: `+${3 * r} silver`, note: 'everyone else +1' }),
    gift: { main: '+2 silver', second: '+2 of a color', note: 'everyone else 1 of it' },
    alms: { main: '+4 silver', note: 'a rival gets 2' },
    tongue: { main: '+4 silver', second: 'swap your silver', note: 'everyone else +1' },
    tide: { second: 'half the richest', note: 'rival’s silver' },
    jubilee: { main: '+1 @f', second: 'per 2 silver', note: 'everyone else +2' },
  },
  yellow: {
    harvest: { main: '+1 yellow', second: '+1 per color', note: 'other colors you hold' },
    bloom: { second: '+1 of your fewest', note: 'each, if tied' },
    transmute: { main: '+1 yellow', second: 'swap up to 3', note: 'for other colors' },
    prism: { second: '+1 each color', note: 'per 3 yellow you hold' },
    gather: { second: '+1 per member', note: 'in its color' },
    flourish: { second: '+1 each color', note: 'per full set' },
  },
  thieves: {
    pickpocket: r => ({ main: `+${r + 1} magenta`, note: 'taken from rivals' }),
    tipoff: { second: 'take 1 from each', note: 'rival richer than you' },
    hideout: { main: '+1 magenta', second: 'safe this round', note: 'taken from a rival' },
    rob: { main: '+3 magenta', note: 'from rivals, 1 each' },
    ransom: { second: 'ransom a member', note: 'costing 4 or less' },
    heist: { second: 'take a member', note: 'from any rival' },
  },
  trading: {
    haggle: { main: '+2 white', second: '+1 per player', note: 'with more followers' },
    buylow: r => ({ second: `buy up to ${2 * r} @f`, note: '1 resource each' }),
    pawn: r => ({ main: `+${r} @f`, second: `or +${2 * r} white` }),
    sellhigh: { main: '+6 white', second: 'sell 2 @f', note: 'loose ones, 3 each' },
    dividend: { main: '+1 white', second: 'per loose @f' },
    boom: { second: 'all to @f', note: '1 for 1, keep white' },
  },
  echo: {
    chant: r => ({ main: `+${2 * r} green`, note: byRound(2, 4, 6) }),
    echo: { second: 'copy a rival', note: 'a space since your turn' },
    encore: { second: 'copy a space', note: 'taken this round' },
    refrain: { main: '+2 green', second: 'copy yours', note: 'from this round' },
    eternity: { second: 'copy all yours', note: 'from this round' },
  },
};

/** { main, second, note } for a space this round (each may be null; note may be { byRound: [a, b, c] }). */
export function panelText(qid, action, round = 1) {
  const r = Math.max(1, Math.min(3, round));
  let v = P[qid] && P[qid][action.key];
  if (typeof v === 'function') v = v(r);
  if (v) return { main: v.main || null, second: v.second || null, note: v.note || null };
  const [main, ...rest] = String(pipEffect(qid, action, r)).split(' · ');
  return { main, second: null, note: rest.length ? rest.join(', ') : null };
}

/** A line as plain text (for measuring): "2 · 4 · 6 by round". */
export const lineText = line => (!line ? '' : typeof line === 'string' ? line : `${line.byRound.join(' · ')} by round`);
