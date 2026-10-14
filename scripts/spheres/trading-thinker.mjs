// One thinking seat vs greedy bots on a White table. Does planning pay with White on the wheel?
// Usage: node scripts/spheres/trading-thinker.mjs [games=24] [rollouts=4] [quadrants=gold,red,blue,trading]
import { createGame, applyMove, chooseBotMove, followers, actionAt } from '../../src/engine/v4/index.js';
import { chooseThinkerMove } from '../../src/engine/v4/thinker.js';
import { seededRandom } from '../../src/engine/v4/rng.js';
import { install, SELL_HIGH, PAWN, BOTS, BOOM } from '../../src/engine/v4/content/trading.js';
install();
// experiments: SELL_EACH=2 PAWN_EACH=1 node scripts/spheres/trading-thinker.mjs …
if (process.env.SELL_EACH) SELL_HIGH.each = Number(process.env.SELL_EACH);
if (process.env.BOOM_PER) BOOM.per = Number(process.env.BOOM_PER);
if (process.env.NOSELL) BOTS.sell = false;
if (process.env.PAWN_EACH) PAWN.each = Number(process.env.PAWN_EACH);
const N = Number(process.argv[2] || 24), R = Number(process.argv[3] || 4);
const quadrants = (process.argv[4] || 'gold,red,blue,trading').split(',');
const wq = quadrants.indexOf('trading');
let wins = 0, margin = 0, tW = 0, tAll = 0, bW = 0, bAll = 0, tWM = 0, bWM = 0, tSold = 0, tBoom = [], tF = 0, gF = 0, tFirst3 = 0;
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
      const w = o.q === wq;
      if (me) { tAll++; if (w) { tW++; const a = `${actionAt(s, o.q, o.i).name} r${s.round}`; tTakes[a] = (tTakes[a] || 0) + 1; } } else { bAll++; if (w) bW++; }
    }
    const next = applyMove(s, m);
    for (const l of next.log) {
      const mm = l.match(/^(P\d) (sold|pawned)[^\d]*(\d+) follower/);
      if (mm && Number(mm[1].slice(1)) - 1 === thinker) tSold += Number(mm[3]);
      const bm = l.match(/^(P\d)'s Boom: (\d+) resources/);
      const rf = l.match(/^Round III begins\. (P\d) picks first/);
      if (rf && Number(rf[1].slice(1)) - 1 === thinker) tFirst3++;
      if (bm && Number(bm[1].slice(1)) - 1 === thinker) tBoom.push(Number(bm[2]));
    }
    next.log = []; // the engine caps the log; read new lines only
    s = next;
  }
  if (s.ranking[0] === thinker) wins++;
  const mine = followers(s, s.players[thinker]);
  tF += mine; gF += s.players.filter(p => p.id !== thinker).reduce((a, p) => a + followers(s, p), 0) / 3;
  margin += mine - Math.max(...s.players.filter(p => p.id !== thinker).map(p => followers(s, p)));
  const wm = p => p.members.filter(u => s.cards[u].def.startsWith('trading.')).length;
  tWM += wm(s.players[thinker]); bWM += s.players.filter(p => p.id !== thinker).reduce((a, p) => a + wm(p), 0) / 3;
  console.error(`${g}/${N}: thinker wins ${wins}`);
}
console.log(`${quadrants.join('/')}: thinker win ${(100 * wins / N).toFixed(0)}% over ${N} games (25% = no edge); avg margin ${(margin / N).toFixed(1)}; thinker ends with ${(tF / N).toFixed(1)} followers vs greedy ${(gF / N).toFixed(1)}`);
if (wq >= 0) console.log(`share of placements on White: thinker ${(100 * tW / tAll).toFixed(0)}% vs greedy ${(100 * bW / bAll).toFixed(0)}% · white members: thinker ${(tWM / N).toFixed(1)} vs greedy ${(bWM / N).toFixed(1)} · followers the thinker sold per game ${(tSold / N).toFixed(1)} · thinker Boomed ${tBoom.length}x on avg ${(tBoom.reduce((a, b) => a + b, 0) / Math.max(1, tBoom.length)).toFixed(1)} resources · thinker picked first in round III ${tFirst3}/${N} · thinker's White picks ${JSON.stringify(tTakes)}`);
