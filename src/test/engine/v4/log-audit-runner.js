// Log audit: after every move, every change to a player must come with a new log line naming that player.
// Used by log-audit.test.js (the gate) and scripts/v4-log-audit.mjs (the report).
import { createGame, applyMove } from '../../../engine/v4/core.js';
import { chooseBotMove } from '../../../engine/v4/bots.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import { makeTables } from './fuzz-tables-runner.js';

// bookkeeping a player never sees as a change of their own (turn counters, per-turn scratch)
const QUIET = new Set(['turnRecruits', 'final', 'contest', 'bought', 'turnBuys', 'workers', 'peekReach', 'perSpend', 'gatherFollowers']);

function snap(p) { return JSON.parse(JSON.stringify(p)); }
function changed(a, b) {
  const out = [];
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (QUIET.has(k)) continue;
    if (JSON.stringify(a[k] ?? null) === JSON.stringify(b[k] ?? null)) continue;
    if (k === 'res') { for (const r of new Set([...Object.keys(a.res), ...Object.keys(b.res)])) if ((a.res[r] || 0) !== (b.res[r] || 0)) out.push('res'); continue; }
    out.push(k);
  }
  return [...new Set(out)];
}

export function auditLog({ games = 40, seed = 7, levels = ['easy', 'normal', 'hard', 'normal'] } = {}) {
  const { tables } = makeTables(seed, 6);
  const gaps = {};
  const crashes = [];
  let moves = 0;
  for (let g = 0; g < games; g++) {
    const quads = tables[g % tables.length];
    try {
      let s = createGame({ seats: [0, 1, 2, 3].map(() => ({ kind: 'bot' })), seed: 2000 + g, quadrants: quads });
      levels.forEach((l, i) => { s.players[i].bot = l; });
      const rand = seededRandom(g + 11);
      let k = 0;
      while (!s.over && k++ < 8000) {
        const len = s.log.length, last = s.log[len - 1];
        const before = s.players.map(snap);
        const prompt = s.pending?.prompt || s.pending?.kind || '';
        const mv = chooseBotMove(s, rand);
        s = applyMove(s, mv);
        moves++;
        const fresh = s.log.length > len ? s.log.slice(len) : s.log.slice(s.log.lastIndexOf(last) + 1);
        s.players.forEach((p, i) => {
          const what = changed(before[i], p);
          if (!what.length) return;
          if (fresh.some(l => l.includes(p.name) || /everyone|each player|all players|Round [IVX]+ (begins|ends)/i.test(l))) return;
          const key = `${what.join('+')} after "${String(prompt).replace(/P\d/g, 'P#').replace(/\(.*\)/g, '(…)').slice(0, 60)}"`;
          const e = (gaps[key] ||= { n: 0, ex: '' });
          e.n++;
          if (!e.ex) e.ex = `${quads.join(',')} seed ${2000 + g} move ${s.moves}: ${p.name} ${what.map(w => `${w} ${JSON.stringify(before[i][w])}→${JSON.stringify(p[w])}`).join('; ')} | lines: ${fresh.join(' / ') || '(none)'}`;
        });
      }
      if (!s.over) throw new Error('did not finish');
    } catch (e) { crashes.push(`${quads.join(',')} seed ${2000 + g}: ${e.stack}`); }
  }
  return { games, crashes, gaps, moves };
}
