import { createGame, applyMove } from '../src/engine/v4/core.js';
import { quadrant, guestMembers } from '../src/engine/v4/content/index.js';
import { chooseBotMove } from '../src/engine/v4/bots.js';
import { seededRandom } from '../src/engine/v4/rng.js';
import { makeTables } from '../src/test/engine/v4/fuzz-tables-runner.js';
const { tables } = makeTables(7, 6); const N = Number(process.argv[2] || 240);
const st = {}; let crashes = 0, errs = [];
const S = n => (st[n] ||= { seen: 0, rec: 0, fire: 0, games: 0 });
for (let g = 0; g < N; g++) {
  const quads = tables[g % tables.length];
  let s;
  try {
    s = createGame({ seats: [0,1,2,3].map(i => ({ kind: 'bot' })), seed: 1000 + g, quadrants: quads });
    const rand = seededRandom(g + 9);
    let k = 0; const full = [];
    full.push(...s.log);
    while (!s.over && k++ < 8000) { const last = s.log[s.log.length - 1]; s = applyMove(s, chooseBotMove(s, rand)); full.push(...s.log.slice(s.log.lastIndexOf(last) + 1)); }
    if (!s.over) throw new Error('did not finish');
    const names = [...quads.flatMap(q => quadrant(q).members.map(m => m.name)), ...guestMembers().map(m => m.name)];
    const text = full.join('\n') + '\n' + s.players.map(p => (p.final?.parts || []).join('\n')).join('\n');
    for (const n of names) {
      const e = S(n); e.games++;
      const lines = text.split('\n').filter(l => l.includes(n));
      const rec = lines.filter(l => / recruited | took .* free|joins|comes over|swap/.test(l) && !/'s /.test(l)).length;
      e.rec += lines.some(l => /recruited/.test(l)) ? 1 : 0;
      e.fire += lines.some(l => l.includes(`'s ${n}`) || l.includes(`${n} +`) || l.includes(`uses ${n}`) || l.includes(`(${n})`)) ? 1 : 0;
    }
  } catch (e) { crashes++; errs.push(`${quads.join(',')} seed ${1000+g}: ${e.message}`); }
}
console.log(`games ${N}, crashes ${crashes}`); errs.slice(0,5).forEach(e => console.log(' ', e));
const rows = Object.entries(st).filter(([, e]) => e.rec > 0).map(([n, e]) => [n, e.rec, e.fire, (e.fire / e.rec)]).sort((a, b) => a[3] - b[3]);
console.log('recruited-in-games / fired-in-games, lowest fire ratio first:');
rows.slice(0, 30).forEach(r => console.log(`  ${r[0].padEnd(18)} rec ${String(r[1]).padStart(3)}  fired ${String(r[2]).padStart(3)}  ${(r[3]*100).toFixed(0)}%`));
console.log('never recruited:', Object.entries(st).filter(([, e]) => !e.rec).map(([n]) => n).join(', '));
