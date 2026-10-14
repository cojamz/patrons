// One thinking seat vs greedy bots on a Silver table. Does planning pay with Silver on the wheel?
// Usage: node scripts/spheres/silver-thinker.mjs [games=24] [rollouts=4] [quadrants=gold,red,blue,silver]
import { createGame, applyMove, chooseBotMove, followers, actionAt } from '../../src/engine/v4/index.js';
import { chooseThinkerMove } from '../../src/engine/v4/thinker.js';
import { seededRandom } from '../../src/engine/v4/rng.js';
import { registerQuadrant } from '../../src/engine/v4/content/index.js';
import silver from '../../src/engine/v4/content/silver.js';
registerQuadrant(silver);
const N = Number(process.argv[2] || 24), R = Number(process.argv[3] || 4);
const quadrants = (process.argv[4] || 'gold,red,blue,silver').split(',');
const yq = quadrants.indexOf('silver');
let wins = 0, margin = 0, tSilver = 0, tAll = 0, bSilver = 0, bAll = 0, tYM = 0, bYM = 0;
const tTakes = {};
for (let g = 1; g <= N; g++) {
  const rand = seededRandom(g * 7 + 1);
  const thinker = g % 4;
  let s = createGame({ seats: [0, 1, 2, 3].map(() => ({ kind: 'bot' })), seed: 7000 + g, quadrants });
  while (!s.over) {
    const me = s.pending.player === thinker;
    const m = me ? chooseThinkerMove(s, rand, { rollouts: R }) : chooseBotMove(s, rand);
    const o = s.pending.options.find(x => x.id === m.option);
    if (o?.kind === 'slot') {
      const y = o.q === yq;
      if (me) { tAll++; if (y) { tSilver++; const a = actionAt(s, o.q, o.i).name; tTakes[a] = (tTakes[a] || 0) + 1; } } else { bAll++; if (y) bSilver++; }
    }
    s = applyMove(s, m);
  }
  if (s.ranking[0] === thinker) wins++;
  const mine = followers(s, s.players[thinker]);
  margin += mine - Math.max(...s.players.filter(p => p.id !== thinker).map(p => followers(s, p)));
  const ym = p => p.members.filter(u => s.cards[u].def.startsWith('silver.')).length;
  tYM += ym(s.players[thinker]); bYM += s.players.filter(p => p.id !== thinker).reduce((a, p) => a + ym(p), 0) / 3;
  console.error(`${g}/${N}: thinker wins ${wins}`);
}
console.log(`${quadrants.join('/')}: thinker win ${(100 * wins / N).toFixed(0)}% over ${N} games (25% = no edge); avg margin ${(margin / N).toFixed(1)}`);
if (yq >= 0) console.log(`share of placements on Silver: thinker ${(100 * tSilver / tAll).toFixed(0)}% vs greedy ${(100 * bSilver / bAll).toFixed(0)}% · silver members: thinker ${(tYM / N).toFixed(1)} vs greedy ${(bYM / N).toFixed(1)} · thinker's Silver picks ${JSON.stringify(tTakes)}`);
