// Black member value: hand one member to one seat at the start of round II, compare against the same games without it.
// Usage: node scripts/spheres/thieves-value.mjs [gamesPerMember=120] [mode=loot] [only=key,key]
import { install, setScoring, releaseLoot } from '../../src/engine/v4/content/thieves.js';
import { createGame, applyMove, chooseBotMove, followers, quadrant, defById } from '../../src/engine/v4/index.js';
import { contextFor, resume } from '../../src/engine/v4/core.js';
import { seededRandom } from '../../src/engine/v4/rng.js';

install();
const N = Number(process.argv[2] || 120), SEATS = 4, MODE = process.argv[3] || 'loot';
setScoring(MODE);
const QUADS = ['gold', 'red', 'blue', 'thieves'];
function play(seed, giveDef, seat) {
  const rand = seededRandom(seed * 7919 + 13);
  let s = createGame({ seats: Array.from({ length: SEATS }, () => ({ kind: 'bot' })), seed, quadrants: QUADS });
  let given = !giveDef, last = s.round;
  while (!s.over) {
    if (!given && s.round === 2 && s.pending?.kind === 'place') {
      s = structuredClone(s);
      const uid = Object.values(s.cards).find(c => c.def === giveDef).uid;
      for (const p of s.players) p.members = p.members.filter(u => u !== uid);
      s.shop = s.shop.filter(u => u !== uid); s.pile = s.pile.filter(u => u !== uid);
      while (s.shop.length < 6 && s.pile.length) s.shop.push(s.pile.shift());
      // recruit it for free so "when recruited" effects fire (Accomplice, Double Agent)
      s.shop.push(uid);
      contextFor(s).recruit(s.players[seat], uid, { free: true });
      for (const t of s.queue) delete t._fresh;
      resume(s);
      given = true;
    }
    s = applyMove(s, chooseBotMove(s, rand));
    if (MODE === 'loot' && s.round !== last) { s = structuredClone(s); releaseLoot(s); last = s.round; }
  }
  return s;
}
const only = process.argv[4] ? process.argv[4].split(',') : null;
const ids = quadrant('thieves').members.map(d => d.id).filter(i => !only || only.some(o => i.endsWith('.' + o)));
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
  rows.push({ name: d.name, cost: d.s + d.w, sw: `${d.s}+${d.w}`, gain: dF / N, win: wins / N });
}
rows.sort((a, b) => b.gain - a.gain);
console.log(`Black member value, handed over at the start of round II (${N} games each, 4 bots, scoring ${MODE}). Baseline win rate 25%.`);
console.log('name'.padEnd(16), 'cost', ' +followers', ' win%');
for (const r of rows) console.log(r.name.padEnd(16), r.sw.padStart(4), r.gain.toFixed(1).padStart(11), (r.win * 100).toFixed(0).padStart(5));
