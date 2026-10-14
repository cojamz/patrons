// One thinking seat vs greedy bots on a Purple table. Does planning pay with Purple on the wheel?
// Usage: node scripts/spheres/purple-thinker.mjs [games=24] [rollouts=4] [quadrants=gold,red,purple,green]
import { createGame, applyMove, chooseBotMove, followers, actionAt } from '../../src/engine/v4/index.js';
import { chooseThinkerMove } from '../../src/engine/v4/thinker.js';
import { seededRandom } from '../../src/engine/v4/rng.js';
import { registerQuadrant } from '../../src/engine/v4/content/index.js';
import purple, { restingOf } from '../../src/engine/v4/content/purple.js';
import { contextFor } from '../../src/engine/v4/core.js';
registerQuadrant(purple);
const N = Number(process.argv[2] || 24), R = Number(process.argv[3] || 4);
const quadrants = (process.argv[4] || 'gold,red,purple,green').split(',');
const pq = quadrants.indexOf('purple');
let wins = 0, margin = 0, tP = 0, tAll = 0, bP = 0, bAll = 0, tRest = 0, bRest = 0, rounds = 0;
const tTakes = {};
for (let g = 1; g <= N; g++) {
  const rand = seededRandom(g * 7 + 1);
  const thinker = g % 4;
  let s = createGame({ seats: [0, 1, 2, 3].map(() => ({ kind: 'bot' })), seed: 7000 + g, quadrants });
  while (!s.over) {
    const me = s.pending.player === thinker;
    const m = me ? chooseThinkerMove(s, rand, { rollouts: R }) : chooseBotMove(s, rand);
    const o = s.pending.options.find(x => x.id === m.option);
    if (o?.kind === 'slot' && s.pending.kind === 'place') {
      const y = o.q === pq;
      if (me) { tAll++; if (y) { tP++; const a = actionAt(s, o.q, o.i).name + ' r' + s.round; tTakes[a] = (tTakes[a] || 0) + 1; } } else { bAll++; if (y) bP++; }
    }
    const r0 = s.round;
    const ctx = contextFor(s);
    const restNow = s.players.map(p => restingOf(ctx, p));
    const next = applyMove(s, m);
    if (next.round !== r0 || next.over) { rounds++; tRest += restNow[thinker]; bRest += restNow.filter((_, i) => i !== thinker).reduce((a, b) => a + b, 0) / 3; }
    s = next;
  }
  if (s.ranking[0] === thinker) wins++;
  margin += followers(s, s.players[thinker]) - Math.max(...s.players.filter(p => p.id !== thinker).map(p => followers(s, p)));
  console.error(`${g}/${N}: thinker wins ${wins}`);
}
console.log(`${quadrants.join('/')}: thinker win ${(100 * wins / N).toFixed(0)}% over ${N} games (25% = no edge); avg margin ${(margin / N).toFixed(1)}`);
if (pq >= 0) console.log(`share of placements on Purple: thinker ${(100 * tP / tAll).toFixed(0)}% vs greedy ${(100 * bP / bAll).toFixed(0)}% · resting at round end: thinker ${(tRest / rounds).toFixed(2)} vs greedy ${(bRest / rounds).toFixed(2)} · thinker's Purple picks ${JSON.stringify(tTakes)}`);
