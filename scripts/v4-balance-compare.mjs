// Compare v4-balance-report.mjs --json files round by round. Usage: node scripts/v4-balance-compare.mjs <r0.json> <r1.json> ... [--cards=Tiebreaker,Heiress]
// Prints, per card, lift ±1 SE and how often a bot owned it when it showed, for each round; then the buy-followers-only seat.
import { readFileSync } from 'node:fs';
const args = process.argv.slice(2), files = args.filter(a => !a.startsWith('--'));
const cards = (args.find(a => a.startsWith('--cards=')) || '--cards=').slice(8).split(',').filter(Boolean);
const R = files.map(f => JSON.parse(readFileSync(f, 'utf8')));
const pct = x => `${Math.round(x * 100)}%`, pts = x => `${x >= 0 ? '+' : ''}${Math.round(x * 100)}`;
const want = cards.length ? cards : [...new Set(R.flatMap(r => r.memberTable.map(m => m.k)))];
for (const c of want) {
  const cells = R.map(r => { const m = r.memberTable.find(x => x.k.toLowerCase().startsWith(c.toLowerCase())); return m ? `${pts(m.lift)}±${Math.round(m.err * 100)} (own ${pct(m.buyRate)}, n${m.n})` : '-'; });
  console.log(`${c.padEnd(20)} ${cells.join('  →  ')}`);
}
console.log('buy-followers-only  ' + R.map(r => Object.entries(r.bySeats).map(([n, s]) => `${n}p ${pct(s.buyer.w / (s.buyer.n || 1))}`).join(' ')).join('  →  '));
