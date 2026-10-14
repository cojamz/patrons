// Causal member value: hand one member to one seat at the start of round II, compare against games where nobody got it.
// Usage: node scripts/v4-member-value.mjs [gamesPerMember=160]
import { createGame, applyMove, chooseBotMove, followers } from '../src/engine/v4/index.js';
import { seededRandom } from '../src/engine/v4/rng.js';
import { defById } from '../src/engine/v4/content/index.js';

const N = Number(process.argv[2] || 160), SEATS = 4;
function play(seed, giveDef, seat) {
  const rand = seededRandom(seed * 7919 + 13);
  let s = createGame({ seats: Array.from({ length: SEATS }, () => ({ kind: 'bot' })), seed });
  let given = !giveDef;
  while (!s.over) {
    if (!given && s.round === 2 && s.pending?.kind === 'place') {
      // move the card (from wherever it is) into the chosen seat's hand
      s = structuredClone(s);
      const uid = Object.values(s.cards).find(c => c.def === giveDef).uid;
      for (const p of s.players) p.members = p.members.filter(u => u !== uid);
      s.shop = s.shop.filter(u => u !== uid); s.pile = s.pile.filter(u => u !== uid);
      while (s.shop.length < 6 && s.pile.length) s.shop.push(s.pile.shift());
      s.players[seat].members.push(uid);
      given = true;
    }
    s = applyMove(s, chooseBotMove(s, rand));
  }
  return s;
}
const only = process.argv[3] ? process.argv[3].split(',') : null;
const ids0 = Object.values((await import('../src/engine/v4/content/index.js')).quadrant('gold').members).map(d => d.id)
  .concat((await import('../src/engine/v4/content/index.js')).quadrant('red').members.map(d => d.id));
const ids = only ? ids0.filter(i => only.some(o => i.endsWith('.' + o))) : ids0;
// control: same seeds, nobody gets anything
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
  rows.push({ id, name: d.name, cost: d.s + d.w, f: d.f, gain: dF / N, win: wins / N });
}
rows.sort((a, b) => b.gain - a.gain);
console.log(`member value when handed over at the start of round II (${N} games each, 4 bots). Baseline win rate 25%.`);
console.log('name'.padEnd(20), 'cost', ' +followers', ' win%');
for (const r of rows) console.log(r.name.padEnd(20), String(r.cost).padStart(4), r.gain.toFixed(1).padStart(11), (r.win * 100).toFixed(0).padStart(5));
