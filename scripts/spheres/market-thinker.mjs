// One thinking seat vs greedy bots on a Blue table. Does planning pay with Blue on the wheel?
// Usage: node scripts/spheres/market-thinker.mjs [games=24] [rollouts=4] [quadrants=gold,red,market,green]
import { createGame, applyMove, chooseBotMove, followers, actionAt } from '../../src/engine/v4/index.js';
import { chooseThinkerMove } from '../../src/engine/v4/thinker.js';
import { seededRandom } from '../../src/engine/v4/rng.js';
import { contextFor } from '../../src/engine/v4/core.js';
import { install, memberValue, setScoring } from '../../src/engine/v4/content/market.js';
install();
setScoring(process.argv[5] || 'pricey');
const N = Number(process.argv[2] || 24), R = Number(process.argv[3] || 4);
const quadrants = (process.argv[4] || 'gold,red,market,green').split(',');
const bq = quadrants.indexOf('market');
let wins = 0, margin = 0, tB = 0, tAll = 0, bB = 0, bAll = 0, tBM = 0, bBM = 0, tVal = 0, bVal = 0, tUse = 0;
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
      const b = o.q === bq;
      if (me) { tAll++; if (b) { tB++; const a = actionAt(s, o.q, o.i).name; tTakes[`${a} r${s.round}`] = (tTakes[`${a} r${s.round}`] || 0) + 1; } } else { bAll++; if (b) bB++; }
    }
    if (me && o?.kind === 'use') tUse++;
    s = applyMove(s, m);
  }
  if (s.ranking[0] === thinker) wins++;
  margin += followers(s, s.players[thinker]) - Math.max(...s.players.filter(p => p.id !== thinker).map(p => followers(s, p)));
  const ctx = contextFor(s);
  const bm = p => p.members.filter(u => s.cards[u].def.startsWith('market.')).length;
  tBM += bm(s.players[thinker]); bBM += s.players.filter(p => p.id !== thinker).reduce((a, p) => a + bm(p), 0) / 3;
  tVal += memberValue(ctx, s.players[thinker]); bVal += s.players.filter(p => p.id !== thinker).reduce((a, p) => a + memberValue(ctx, p), 0) / 3;
  console.error(`${g}/${N}: thinker wins ${wins}`);
}
console.log(`${quadrants.join('/')}: thinker win ${(100 * wins / N).toFixed(0)}% over ${N} games (25% = no edge); avg margin ${(margin / N).toFixed(1)}`);
console.log(`share of placements on Blue: thinker ${(100 * tB / tAll).toFixed(0)}% vs greedy ${(100 * bB / bAll).toFixed(0)}% · blue members: thinker ${(tBM / N).toFixed(1)} vs greedy ${(bBM / N).toFixed(1)} · member value: thinker ${(tVal / N).toFixed(1)} vs greedy ${(bVal / N).toFixed(1)} · thinker activations/game ${(tUse / N).toFixed(1)}`);
console.log(`thinker's Blue picks: ${JSON.stringify(tTakes)}`);
