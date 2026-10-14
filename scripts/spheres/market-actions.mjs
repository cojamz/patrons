// Action value on the Blue table: force one seat's first placement of a round onto an action, compare with
// the same games where the bot chose freely. Blue's actions are read against Cory's anchors on the same ring.
// Usage: node scripts/spheres/market-actions.mjs [games=160] [scoring=pricey|value]
import { install, setScoring } from '../../src/engine/v4/content/market.js';
import { createGame, applyMove, chooseBotMove, followers, actionAt } from '../../src/engine/v4/index.js';
import { seededRandom } from '../../src/engine/v4/rng.js';
install();
setScoring(process.argv[3] || 'pricey');
const N = Number(process.argv[2] || 160);
const QUADS = ['gold', 'red', 'market', 'green'];
const LIST = [
  ['Joint Venture', 1], ['Rush', 1], ['Discount', 1], ['Hire', 1], ['Scout', 1], ['Bargain', 1], ['Restock', 1], ['Showroom', 1],
  ['Steal', 2], ['Windfall', 2], ['Hire Up', 2], ['Clearance', 2], ['Price Check', 2],
  ['Strike', 3], ['Take', 3], ['Spree', 3],
];
function play(seed, force) {
  const rand = seededRandom(seed * 104729 + 7);
  let s = createGame({ seats: [0, 1, 2, 3].map(() => ({ kind: 'bot' })), seed, quadrants: QUADS });
  let done = !force, ok = !force;
  const seat = seed % 4;
  while (!s.over) {
    let mv = chooseBotMove(s, rand);
    if (!done && s.round === force[1] && s.pending.kind === 'place' && s.pending.player === seat) {
      const o = s.pending.options.find(x => actionAt(s, x.q, x.i).name === force[0]);
      done = true;
      if (o) { mv = { player: seat, option: o.id }; ok = true; }
    }
    s = applyMove(s, mv);
  }
  return { s, ok, seat };
}
const ctl = [];
for (let g = 0; g < N; g++) ctl.push(play(5000 + g, null));
console.log(`Forced first placement of the round, ${N} games each, 4 greedy bots, ${QUADS.join('/')}. +followers vs free choice.`);
for (const f of LIST) {
  let d = 0, k = 0, w = 0;
  for (let g = 0; g < N; g++) {
    const r = play(5000 + g, f);
    if (!r.ok) continue;
    const c = ctl[g].s;
    d += followers(r.s, r.s.players[r.seat]) - followers(c, c.players[r.seat]); k++;
    if (r.s.ranking[0] === r.seat) w++;
  }
  console.log(`${f[0].padEnd(14)} ring ${f[1]}  ${(d / k).toFixed(1).padStart(5)}  win ${(100 * w / k).toFixed(0)}%  (n=${k})`);
}
