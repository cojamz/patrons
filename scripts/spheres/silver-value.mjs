// Causal member value for Silver: hand one member to one seat at the start of round II, compare with the same games without it.
// Usage: node scripts/spheres/silver-value.mjs [gamesPerMember=120] [only=key1,key2] [quadrants=gold,red,blue,silver]
import { createGame, applyMove, chooseBotMove, followers } from '../../src/engine/v4/index.js';
import { seededRandom } from '../../src/engine/v4/rng.js';
import { defById, registerQuadrant, quadrant } from '../../src/engine/v4/content/index.js';
import silver from '../../src/engine/v4/content/silver.js';
registerQuadrant(silver);

const N = Number(process.argv[2] || 120), SEATS = 4;
const quadrants = (process.argv[4] || 'gold,red,blue,silver').split(',');
function play(seed, giveDef, seat) {
  const rand = seededRandom(seed * 7919 + 13);
  let s = createGame({ seats: Array.from({ length: SEATS }, () => ({ kind: 'bot' })), seed, quadrants });
  let given = !giveDef;
  while (!s.over) {
    if (!given && s.round === 2 && s.pending?.kind === 'place') {
      s = structuredClone(s);
      const card = Object.values(s.cards).find(c => c.def === giveDef);
      const uid = card.uid;
      for (const p of s.players) p.members = p.members.filter(u => u !== uid);
      s.shop = s.shop.filter(u => u !== uid); s.pile = s.pile.filter(u => u !== uid);
      while (s.shop.length < 6 && s.pile.length) s.shop.push(s.pile.shift());
      s.players[seat].members.push(uid);
      // one-shot recruit effects, done by hand (the member is handed over, not recruited)
      const me = s.players[seat], rivals = s.players.filter(o => o !== me);
      if (giveDef === 'silver.confidant') card.target = rivals.reduce((a, b) => (b.members.length > a.members.length ? b : a)).id;
      if (giveDef === 'silver.spoon') me.res.silver += Math.max(0, ...rivals.map(o => o.res.silver));
      if (giveDef === 'silver.retinue') for (const o of rivals) o.res.silver += 1;
      given = true;
    }
    s = applyMove(s, chooseBotMove(s, rand));
  }
  return s;
}
const only = process.argv[3] && process.argv[3] !== 'all' ? process.argv[3].split(',') : null;
const ids0 = [...quadrant('silver').members, ...quadrant('gold').members, ...quadrant('red').members].map(d => d.id);
const ids = only ? ids0.filter(i => only.some(o => i === o || i.endsWith('.' + o))) : ids0.filter(i => i.startsWith('silver.'));
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
console.log(`Silver member value, handed over at the start of round II (${N} games each, 4 greedy bots, ${quadrants.join('/')}). Baseline win 25%.`);
console.log('name'.padEnd(14), 'cost', ' +followers', ' win%');
for (const r of rows) console.log(r.name.padEnd(14), r.cost.padStart(4), r.gain.toFixed(1).padStart(11), (r.win * 100).toFixed(0).padStart(5));
