// One thinking seat vs greedy bots on a Green table. Does planning pay with Green on the wheel?
// Usage: node scripts/spheres/echo-thinker.mjs [games=24] [rollouts=4] [quadrants=gold,red,blue,echo]
import { createGame, applyMove, chooseBotMove, followers, actionAt } from '../../src/engine/v4/index.js';
import { chooseThinkerMove } from '../../src/engine/v4/thinker.js';
import { seededRandom } from '../../src/engine/v4/rng.js';
import { install } from '../../src/engine/v4/content/echo.js';
install();
const N = Number(process.argv[2] || 24), R = Number(process.argv[3] || 4);
const quadrants = (process.argv[4] || 'gold,red,blue,echo').split(',');
const gq = quadrants.indexOf('echo');
let wins = 0, margin = 0, tG = 0, tAll = 0, bG = 0, bAll = 0, tGM = 0, bGM = 0, tLeft = 0, bLeft = 0;
const tTakes = {}, bTakes = {};
const tot = p => Object.values(p.res).reduce((a, b) => a + b, 0);
for (let g = 1; g <= N; g++) {
  const rand = seededRandom(g * 7 + 1);
  const thinker = g % 4;
  let s = createGame({ seats: [0, 1, 2, 3].map(() => ({ kind: 'bot' })), seed: 7000 + g, quadrants });
  while (!s.over) {
    const me = s.pending.player === thinker;
    const m = me ? chooseThinkerMove(s, rand, { rollouts: R }) : chooseBotMove(s, rand);
    const o = s.pending.options.find(x => x.id === m.option);
    if (o?.kind === 'slot') {
      const gr = o.q === gq, k = `${actionAt(s, o.q, o.i).name} r${s.round}`;
      if (me) { tAll++; if (gr) { tG++; tTakes[k] = (tTakes[k] || 0) + 1; } } else { bAll++; if (gr) { bG++; bTakes[k] = (bTakes[k] || 0) + 1; } }
    }
    s = applyMove(s, m);
  }
  if (s.ranking[0] === thinker) wins++;
  margin += followers(s, s.players[thinker]) - Math.max(...s.players.filter(p => p.id !== thinker).map(p => followers(s, p)));
  const gm = p => p.members.filter(u => s.cards[u].def.startsWith('echo.')).length;
  tGM += gm(s.players[thinker]); bGM += s.players.filter(p => p.id !== thinker).reduce((a, p) => a + gm(p), 0) / 3;
  tLeft += tot(s.players[thinker]); bLeft += s.players.filter(p => p.id !== thinker).reduce((a, p) => a + tot(p), 0) / 3;
  console.error(`${g}/${N}: thinker wins ${wins}`);
}
console.log(`${quadrants.join('/')}: thinker win ${(100 * wins / N).toFixed(0)}% over ${N} games (25% = no edge); avg margin ${(margin / N).toFixed(1)}`);
console.log(`share of placements on Green: thinker ${(100 * tG / tAll).toFixed(0)}% vs greedy ${(100 * bG / bAll).toFixed(0)}% · green members: thinker ${(tGM / N).toFixed(1)} vs greedy ${(bGM / N).toFixed(1)} · resources left: thinker ${(tLeft / N).toFixed(1)} vs greedy ${(bLeft / N).toFixed(1)}`);
const per = (t, n) => Object.entries(t).sort().map(([k, v]) => `${k} ${(v / n).toFixed(2)}`).join(' · ');
console.log(`thinker's Green picks per game: ${per(tTakes, N)}`);
console.log(`a greedy seat's Green picks per game: ${per(bTakes, 3 * N)}`);
