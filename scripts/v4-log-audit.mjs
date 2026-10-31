// Log audit: seeded bot games on mixed tables. After every move, anything that changed for a player (resources,
// followers, members, minions, discount, flags) must be named by a new log line that names that player.
// Cory's rule: every game-state change and why, in the log. Prints the silent changes grouped by what changed.
//   node scripts/v4-log-audit.mjs [games=40]
import { auditLog } from '../src/test/engine/v4/log-audit-runner.js';
const games = Number(process.argv[2] || 40);
const { crashes, gaps, moves } = auditLog({ games });
console.log(`games ${games}, moves ${moves}, crashes ${crashes.length}`);
crashes.slice(0, 5).forEach(e => console.log(' ', e));
const rows = Object.entries(gaps).sort((a, b) => b[1].n - a[1].n);
for (const [k, e] of rows) console.log(`${String(e.n).padStart(5)}  ${k}\n        e.g. ${e.ex}`);
process.exit(rows.length || crashes.length ? 1 : 0);
