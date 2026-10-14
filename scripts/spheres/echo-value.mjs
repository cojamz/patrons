// Causal member value for Green: hand one member to one seat at the start of round II (as a free recruit, so
// "when recruited" effects fire), compare against the same games where nobody got it.
// Usage: node scripts/spheres/echo-value.mjs [gamesPerMember=120] [only=key,key]
import { createGame, applyMove, chooseBotMove, followers } from '../../src/engine/v4/index.js';
import { resume, contextFor } from '../../src/engine/v4/core.js';
import { seededRandom } from '../../src/engine/v4/rng.js';
import { defById } from '../../src/engine/v4/content/index.js';
import echo, { install, VARIANT } from '../../src/engine/v4/content/echo.js';
install();
if (process.env.PLUS) VARIANT.plus = Number(process.env.PLUS);

const N = Number(process.argv[2] || 120), SEATS = 4, QUADS = ['gold', 'red', 'blue', 'echo'];
function play(seed, giveDef, seat) {
  const rand = seededRandom(seed * 7919 + 13);
  let s = createGame({ seats: Array.from({ length: SEATS }, () => ({ kind: 'bot' })), seed, quadrants: QUADS });
  let given = !giveDef;
  while (!s.over) {
    // "when recruited" copies need a space taken this round: hand those over at the seat's first buy of round II
    const mid = giveDef === 'echo.keepsake' || giveDef === 'echo.understudy';
    if (!given && s.round === 2 && (mid ? s.pending?.kind === 'buy' && s.pending.player === seat : s.pending?.kind === 'place')) {
      s = structuredClone(s);
      const uid = Object.values(s.cards).find(c => c.def === giveDef).uid;
      for (const p of s.players) p.members = p.members.filter(u => u !== uid);
      s.shop = s.shop.filter(u => u !== uid); s.pile = s.pile.filter(u => u !== uid);
      s.shop.push(uid);
      contextFor(s).recruit(s.players[seat], uid, { free: true });
      while (s.shop.length > 6) s.pile.unshift(s.shop.pop());
      s = resume(s);
      given = true;
    }
    s = applyMove(s, chooseBotMove(s, rand));
  }
  return s;
}
const only = process.argv[3] ? process.argv[3].split(',') : null;
// reference cards from the priced spheres, to read the scale against (member-costs.md)
const REF = (process.env.REF ?? 'gold.banker,gold.speculator,gold.tycoon,red.host').split(',').filter(Boolean);
const ids = [...echo.members.map(d => d.id).filter(i => !only || only.some(o => i.endsWith('.' + o))), ...(only && !process.env.REF ? [] : REF)];
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
  console.error(`${d.name} done`);
}
rows.sort((a, b) => b.gain - a.gain);
console.log(`Green member value when handed over at the start of round II (${N} games each, 4 bots, ${QUADS.join('/')}). Baseline win rate 25%.`);
console.log('name'.padEnd(14), 'cost', ' +followers', ' win%');
for (const r of rows) console.log(r.name.padEnd(14), r.cost.padStart(4), r.gain.toFixed(1).padStart(11), (r.win * 100).toFixed(0).padStart(5));
