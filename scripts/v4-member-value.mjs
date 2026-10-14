// Causal member value: hand one member to one seat at the start of round II, compare against games where nobody got it.
// Usage: node scripts/v4-member-value.mjs [gamesPerMember=160] [names,comma,separated] [--level=normal] [--no-release] [--quadrants=gold,red,blue,green]
// Names match member keys in Gold, Red and the rule-benders (guest members), e.g. "banker,squatter".
import { createGame, applyMove, chooseBotMove, followers } from '../src/engine/v4/index.js';
import { seededRandom } from '../src/engine/v4/rng.js';
import { defById, quadrant, guestMembers } from '../src/engine/v4/content/index.js';

const flags = Object.fromEntries(process.argv.slice(2).filter(a => a.startsWith('--')).map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const N = Number(args[0] || 160), SEATS = 4;
const level = flags.level || 'normal';
const rules = { release: !flags['no-release'] };
const quadrants = flags.quadrants ? flags.quadrants.split(',') : undefined;
function play(seed, giveDef, seat) {
  const rand = seededRandom(seed * 7919 + 13);
  let s = createGame({ seats: Array.from({ length: SEATS }, () => ({ kind: 'bot' })), seed, rules, ...(quadrants ? { quadrants } : {}) });
  let given = !giveDef;
  while (!s.over) {
    if (!given && s.round === 2 && s.pending?.kind === 'place') {
      // move the card (from wherever it is) into the chosen seat's hand
      s = structuredClone(s);
      const uid = Object.values(s.cards).find(c => c.def === giveDef).uid;
      for (const p of s.players) p.members = p.members.filter(u => u !== uid);
      s.shop = s.shop.filter(u => u !== uid); s.pile = s.pile.filter(u => u !== uid);
      s.cards[uid] = { uid, def: giveDef };
      while (s.shop.length < 6 && s.pile.length) s.shop.push(s.pile.shift());
      s.players[seat].members.push(uid);
      given = true;
    }
    s = applyMove(s, chooseBotMove(s, rand, { level }));
  }
  return s;
}
const only = args[1] ? args[1].split(',') : null;
const ids0 = quadrant('gold').members.map(d => d.id).concat(quadrant('red').members.map(d => d.id), guestMembers().map(d => d.id));
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
console.log(`member value when handed over at the start of round II (${N} games each, 4 ${level} bots, release ${rules.release ? 'on' : 'off'}). Baseline win rate 25%.`);
console.log('name'.padEnd(20), 'cost', ' +followers', ' win%');
for (const r of rows) console.log(r.name.padEnd(20), String(r.cost).padStart(4), r.gain.toFixed(1).padStart(11), (r.win * 100).toFixed(0).padStart(5));
