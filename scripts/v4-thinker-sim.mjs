// One thinking seat vs greedy bots. Usage: node scripts/v4-thinker-sim.mjs [games=60] [rollouts=6]
import { createGame, applyMove, chooseBotMove, followers } from '../src/engine/v4/index.js';
import { chooseThinkerMove } from '../src/engine/v4/thinker.js';
import { seededRandom } from '../src/engine/v4/rng.js';
const N = Number(process.argv[2] || 60), R = Number(process.argv[3] || 6), OFF = Number(process.argv[4] || 0);
let wins = 0, turnoutTakes = { total: 0, byPos: [0, 0, 0, 0] }, posWins = [0, 0, 0, 0];
for (let g = 1; g <= N; g++) {
  const rand = seededRandom(g * 7);
  const thinker = g % 4;
  let s = createGame({ seats: [0, 1, 2, 3].map(() => ({ kind: 'bot' })), seed: 5000 + OFF + g });
  let r1 = null;
  while (!s.over) {
    const m = s.pending.player === thinker ? chooseThinkerMove(s, rand, { rollouts: R }) : chooseBotMove(s, rand);
    const opt = s.pending.options.find(o => o.id === m.option);
    if (s.pending.player === thinker && s.round === 1 && opt?.kind === 'slot' && opt.label === 'Bandwagon') turnoutTakes.total++;
    s = applyMove(s, m);
    if (!r1 && s.round === 1 && s.order.length) r1 = s.order.slice(0, 4);
  }
  if (s.ranking[0] === thinker) wins++;
  posWins[r1.indexOf(s.ranking[0])]++;
  if (g % 10 === 0) console.error(`${g}/${N}: thinker wins ${wins}`);
}
console.log(`thinker win rate ${(100 * wins / N).toFixed(0)}% over ${N} games (25% = no better than greedy); round-I Bandwagon taken by thinker ${turnoutTakes.total}x; wins by round-I position ${posWins.join('/')}`);
