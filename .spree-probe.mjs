// Spree usage on the Blue test table, with Even Swap as it is, and with Red's old Scout put back in its slot.
import { createGame, applyMove } from './src/engine/v4/core.js';
import { chooseBotMove } from './src/engine/v4/bots.js';
import { seededRandom } from './src/engine/v4/rng.js';
import { quadrant } from './src/engine/v4/content/index.js';
import { setBadge } from './src/engine/v4/content/market.js';
setBadge(8);
const Q = ['gold', 'red', 'market', 'green'];
const N = Number(process.argv[2] || 200);
function run() {
  let used = 0;
  for (let g = 1; g <= N; g++) {
    const rand = seededRandom(g * 131);
    let s = createGame({ seats: [0, 1, 2, 3].map(() => ({ kind: 'bot' })), seed: g, quadrants: Q });
    while (!s.over) s = applyMove(s, chooseBotMove(s, rand));
    if (s.log.some(l => l.includes('goes on a spree'))) used++;
  }
  return used;
}
const now = run();
const red = quadrant('red');
const cost = c => c.def.s + c.def.w;
const scout = {
  key: 'scout', ring: 1, name: 'Scout', id: 'red.scout', text: '+2 red, and put a face-up member at the bottom of the pile.',
  estimate: () => 2.2,
  resolve(ctx, p) {
    ctx.gain(p, 'red', 2, { fromAction: true });
    const shop = ctx.shopCards();
    if (!shop.length) return;
    ctx.choose(p, 'Scout?', shop.map(c => ({ id: `card:${c.uid}`, label: c.def.name, kind: 'card', value: c.uid, hint: cost(c) })), 'red.bury');
  },
};
const { handlerById } = await import('./src/engine/v4/content/index.js');
const saved = red.actions[0];
red.actions[0] = scout;
// re-add the bury handler under its id
const idx = await import('./src/engine/v4/content/index.js');
red.handlers.bury = (ctx, p, uid) => { ctx.buryFromShop(uid); };
idx.registerQuadrant(red);
const before = run();
red.actions[0] = saved;
console.log(`spree used: Even Swap ${now}/${N}, Scout ${before}/${N} (test wants > ${N * 0.75})`);
