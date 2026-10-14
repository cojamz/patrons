// Quick smoke: N seeded bot games with Blue (market) in place of the blue stand-in.
import { createGame, applyMove, chooseBotMove, followers } from '../../src/engine/v4/index.js';
import { seededRandom } from '../../src/engine/v4/rng.js';
import { registerQuadrant } from '../../src/engine/v4/content/index.js';
import market, { install } from '../../src/engine/v4/content/market.js';
install();
const N = Number(process.argv[2] || 200);
let bad = 0, moves = 0;
for (let g = 1; g <= N; g++) {
  try {
    const rand = seededRandom(g * 31 + 5);
    let s = createGame({ seats: [0, 1, 2, 3].map(() => ({ kind: 'bot' })), seed: g, quadrants: ['gold', 'red', 'market', 'green'] });
    let k = 0;
    while (!s.over) { s = applyMove(s, chooseBotMove(s, rand)); if (++k > 3000) throw new Error('stuck'); }
    moves += k;
    for (const p of s.players) for (const r in p.res) if (p.res[r] < 0) throw new Error('negative ' + r);
  } catch (e) { bad++; console.log('game', g, e.message); }
}
console.log(`${N} games, ${bad} errors, avg moves ${(moves / N).toFixed(0)}`);
