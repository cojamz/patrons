// Causal member value for Blue (market): hand one member to one seat at the start of round II,
// compare with the same games without it.
// Usage: node scripts/spheres/market-value.mjs [gamesPerMember=120] [only=key1,key2|all] [quadrants=gold,red,market,green]
import { createGame, applyMove, chooseBotMove, followers } from '../../src/engine/v4/index.js';
import { seededRandom } from '../../src/engine/v4/rng.js';
import { defById, registerQuadrant, quadrant } from '../../src/engine/v4/content/index.js';
import { contextFor } from '../../src/engine/v4/core.js';
import market, { install } from '../../src/engine/v4/content/market.js';
install();

const N = Number(process.argv[2] || 120), SEATS = 4;
const quadrants = (process.argv[4] || 'gold,red,market,green').split(',');
function play(seed, giveDef, seat) {
  const rand = seededRandom(seed * 7919 + 13);
  let s = createGame({ seats: Array.from({ length: SEATS }, () => ({ kind: 'bot' })), seed, quadrants });
  let given = !giveDef;
  while (!s.over) {
    if (!given && s.round === 2 && s.pending?.kind === 'place') {
      s = structuredClone(s);
      const uid = Object.values(s.cards).find(c => c.def === giveDef).uid;
      for (const p of s.players) p.members = p.members.filter(u => u !== uid);
      s.shop = s.shop.filter(u => u !== uid); s.pile = s.pile.filter(u => u !== uid);
      while (s.shop.length < 6 && s.pile.length) s.shop.push(s.pile.shift());
      s.players[seat].members.push(uid);
      // round-start members missed their round-II start: run it once, as the engine would have
      const d = defById(giveDef);
      if (d.onRoundStart && !d.activate) d.onRoundStart(contextFor(s), s.players[seat], s.cards[uid]);
      given = true;
    }
    s = applyMove(s, chooseBotMove(s, rand));
  }
  return s;
}
const only = process.argv[3] && process.argv[3] !== 'all' ? process.argv[3].split(',') : null;
const ids0 = [...quadrant('market').members, ...quadrant('gold').members, ...quadrant('red').members].map(d => d.id);
const ids = only ? ids0.filter(i => only.some(o => i === o || i.endsWith('.' + o))) : ids0.filter(i => i.startsWith('market.'));
const control = [];
for (let g = 0; g < N; g++) control.push(play(1000 + g));
const rows = [];
for (const id of ids) {
  let dF = 0, wins = 0;
  for (let g = 0; g < N; g++) {
    const seat = g % SEATS;
    const s = play(1000 + g, id, seat), c = control[g];
    dF += followers(s, s.players[seat]) - followers(c, c.players[seat]);
    if (s.ranking[0] === seat) wins++;
  }
  const d = defById(id);
  rows.push({ name: d.name, cost: `${d.s}+${d.w}`, gain: dF / N, win: wins / N });
}
rows.sort((a, b) => b.gain - a.gain);
console.log(`Member value, handed over at the start of round II (${N} games each, 4 greedy bots, ${quadrants.join('/')}). Baseline win 25%.`);
console.log('name'.padEnd(18), 'cost', ' +followers', ' win%');
for (const r of rows) console.log(r.name.padEnd(18), r.cost.padStart(4), r.gain.toFixed(1).padStart(11), (r.win * 100).toFixed(0).padStart(5));
