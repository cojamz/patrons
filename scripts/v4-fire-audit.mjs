// Fire audit report: which recruited members leave a log line naming them, over seeded mixed-table bot games.
// Cory's rule: every number on the table traces to a log line. A member recruited often and never named is silent or dead.
//   node scripts/v4-fire-audit.mjs [games=200] [levels=normal,normal,normal,normal] [spheres=all]
// Exits 1 when a member with an effect was recruited and never named (the fast gate is src/test/engine/v4/fire-audit.test.js).
import { runFireAudit, silentMembers, hasEffect } from '../src/test/engine/v4/fire-audit-runner.js';
import { allQuadrantIds, defById } from '../src/engine/v4/content/index.js';

const games = Number(process.argv[2] || 200);
const levels = (process.argv[3] || 'normal,normal,normal,normal').split(',');
const spheres = process.argv[4] && process.argv[4] !== 'all' ? process.argv[4].split(',') : null;
const t0 = Date.now();
const { crashes, stats } = runFireAudit({ games, levels, spheres });
console.log(`games ${games} (${levels.join(',')}), ${((Date.now() - t0) / 1000).toFixed(0)}s, crashes ${crashes.length}`);
crashes.slice(0, 5).forEach(e => console.log(' ', e));
const rows = Object.values(stats).filter(e => hasEffect(defById(e.def))).sort((a, b) => a.fired / a.rec - b.fired / b.rec || b.rec - a.rec);
console.log('members with an effect, games recruited / games named acting, lowest first:');
rows.slice(0, 30).forEach(e => console.log(`  ${e.name.padEnd(20)} rec ${String(e.rec).padStart(3)}  named ${String(e.fired).padStart(3)}  ${((e.fired / e.rec) * 100).toFixed(0)}%`));
const silent = silentMembers(stats, [...(spheres || allQuadrantIds()), 'benders']);
console.log(silent.length ? `SILENT: ${silent.map(e => `${e.name} (${e.rec})`).join(', ')}` : 'silent: none');
process.exit(silent.length || crashes.length ? 1 : 0);
