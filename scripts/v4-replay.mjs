// Replays a Patrons v4 game record ("Copy game record" in the app, or window.patronsRecord() in devtools) move by
// move and reports the first illegal move or exception, with the state at that point.
//
// Usage: node scripts/v4-replay.mjs <record.json | -> [--upto N] [--log N] [--state out.json] [--quiet]
//   -            read the record from stdin
//   --upto N     stop after N moves (print where the game stands, write --state if given)
//   --log N      print the last N log lines at the stop point (default 12)
//   --state F    write the state at the stop point (failure, --upto, or the end) to F as JSON
// Exit code: 0 replayed cleanly, 1 an illegal move or exception, 2 bad input.
// To keep a record as a regression test, save it under src/test/v4/records/ (see src/test/v4/replay.js).
import { readFileSync, writeFileSync } from 'node:fs';
import { replayRecord, parseRecord, CONTENT_HASH } from '../src/v4/session/record.js';
import { followers } from '../src/engine/v4/index.js';

const args = process.argv.slice(2);
const flag = (name, dflt) => { const i = args.indexOf(name); if (i < 0) return dflt; const v = args[i + 1]; args.splice(i, 2); return v; };
const upTo = Number(flag('--upto', Infinity));
const logN = Number(flag('--log', 12));
const stateOut = flag('--state', null);
const quiet = args.includes('--quiet') && args.splice(args.indexOf('--quiet'), 1);
const src = args[0];
if (!src) { console.error('Usage: node scripts/v4-replay.mjs <record.json | -> [--upto N] [--log N] [--state out.json]'); process.exit(2); }

let rec;
try {
  rec = parseRecord(readFileSync(src === '-' ? 0 : src, 'utf8'));
} catch (err) {
  console.error(`Can't read the record: ${err.message}`);
  process.exit(2);
}

const say = (...a) => { if (!quiet) console.log(...a); };
const made = rec.build?.content;
say(`Record: ${rec.seats.map(s => `${s.name} (${s.kind})`).join(', ')} · table ${rec.quadrants.join(',')} · seed ${rec.seed} · ${rec.moves.length} moves`);
say(`Content: record ${made || '(unstamped)'} · this build ${CONTENT_HASH}${made === CONTENT_HASH ? ' (same)' : ' (DIFFERENT: cards or rules changed since this game; divergence is expected)'}`);
if (rec.build?.id) say(`Played on build ${rec.build.id}`);

const t0 = Date.now();
const r = replayRecord(rec, { upTo });
const ms = Date.now() - t0;
const st = r.failure ? r.failure.state : r.state;

const where = s => (s ? `round ${s.round}, move ${s.moves}${s.over ? ', game over' : ''}` : 'no state');
const pendingText = s => {
  const p = s?.pending;
  if (!p) return '(no decision pending)';
  const opts = p.options.map(o => o.id);
  return `P${p.player + 1} ${s.players[p.player]?.name} · ${p.kind}: ${p.prompt || ''}\n  options (${opts.length}): ${opts.slice(0, 30).join('  ')}${opts.length > 30 ? ' …' : ''}`;
};

if (r.failure) {
  console.log(`\nFAIL at move ${r.failure.index + 1} of ${r.total} (${r.failure.reason}) after ${ms} ms`);
  console.log(r.failure.message);
  if (r.failure.stack) console.log(r.failure.stack.split('\n').slice(1, 8).join('\n'));
} else {
  say(`\nOK: replayed ${r.played} of ${r.total} moves in ${ms} ms`);
}
if (st) {
  say(`\nAt: ${where(st)}`);
  say(`Pending: ${pendingText(st)}`);
  say(`Players: ${st.players.map(p => `${p.name} ${followers(st, p)}f ${Object.entries(p.res).filter(([, v]) => v).map(([k, v]) => `${v}${k[0]}`).join('') || '-'} m${p.members.length}`).join(' · ')}`);
  if (logN > 0) say(`Log (last ${logN}):\n  ${st.log.slice(-logN).join('\n  ')}`);
  if (st.over && st.ranking) say(`Ranking: ${JSON.stringify(st.ranking)}`);
}
if (stateOut && st) { writeFileSync(stateOut, JSON.stringify(st, null, 1)); say(`State written to ${stateOut}`); }
process.exit(r.failure ? 1 : 0);
