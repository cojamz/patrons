// Re-records the kept game records (src/test/v4/records/*.json) on this build, so a rules change never leaves the
// records gate stale or inert. npm run records:refresh [-- <record.json>... ] [--check]
//
// For each record:
// - it still replays to its expected ending: left as is;
// - the rules changed under it (an illegal move, or another ending): re-recorded from its seed. The moves that are
//   still legal are kept (a bug report keeps its path as far as it can), bots play every seat from there to the end
//   (each seat at its own bot level, Normal for a human seat; the bots' dice are seeded from the record's seed), and
//   `expect` becomes this build's ending. `refreshed` notes the old content and how many moves were kept;
// - its seed can't be set up on this build (a sphere gone from the table): left as is (records.test.js skips it);
// - a move throws: left as is, and the exit code is 1 (a crash is a bug to fix, not to re-record away).
// --check reports what would change and writes nothing (exit 1 if anything is stale).
import './v4-node-stamp.mjs'; // first: record.js must see the rules-source hash, as in the built app
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { replayRecord, parseRecord, gameRecord, recordText, step, CONTENT_HASH } from '../src/v4/session/record.js';
import { chooseBotMove, followers } from '../src/engine/v4/index.js';
import { seededRandom } from '../src/engine/v4/rng.js';

const DIR = 'src/test/v4/records';
const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const files = args.filter(a => !a.startsWith('--'));
const paths = files.length ? files : readdirSync(DIR).filter(f => f.endsWith('.json')).sort().map(f => join(DIR, f));
const MAX_MOVES = 5000;

const ending = st => ({ over: !!st.over, moves: st.moves, followers: st.players.map(p => followers(st, p)) });
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Does the replay reach the record's expected ending? (No `expect`: a clean replay to the end is enough.) */
function holds(rec, st) {
  const want = rec.expect;
  if (!want) return true;
  const got = ending(st);
  return (want.over === undefined || want.over === got.over) && (want.moves === undefined || want.moves === got.moves)
    && (!want.followers || same(want.followers, got.followers));
}

/** Plays the record's kept moves, then bots to the end. Returns { rec } or { error }. */
function rerecord(rec, kept) {
  const base = replayRecord(rec, { upTo: kept });
  if (!base.ok) return { error: base.failure.message };
  let st = base.state;
  const rand = seededRandom(Number(rec.seed) || 1);
  for (let k = 0; !st.over && st.pending; k++) {
    if (k > MAX_MOVES) return { error: `no game over after ${MAX_MOVES} bot moves` };
    let move;
    try { move = chooseBotMove(st, rand); st = step(st, move); } catch (err) { return { error: `bot move ${st.moves + 1} (${move ? move.option : '?'}) threw: ${err?.message || err}` }; }
  }
  const keep = Object.fromEntries(Object.entries(rec).filter(([k]) => ['note'].includes(k)));
  const out = gameRecord(st, { ...keep, expect: ending(st), refreshed: { from: rec.build?.content || 'unstamped', kept, of: rec.moves.length } });
  // the new record must pass the very check the gate runs
  const again = replayRecord(out);
  if (!again.ok || !holds(out, again.state)) return { error: `the re-recorded game doesn't replay to its own ending (${again.failure?.message || 'different ending'})` };
  return { rec: out };
}

let crashed = 0, stale = 0;
for (const path of paths) {
  const name = basename(path);
  let rec;
  try { rec = parseRecord(readFileSync(path, 'utf8')); } catch (err) { console.log(`?? ${name}: can't read it (${err.message})`); crashed++; continue; }
  const r = replayRecord(rec);
  if (r.failure && r.failure.index === -1) { console.log(`-- ${name}: its seed can't be set up on this build, left as is (${r.failure.message})`); continue; }
  if (r.failure && r.failure.reason === 'exception') { console.log(`!! ${name}: ${r.failure.message}\n   a crash: fix the bug, don't re-record it away. Debug: node scripts/v4-replay.mjs ${path}`); crashed++; continue; }
  if (!r.failure && holds(rec, r.state)) { console.log(`ok ${name}: replays to its ending (${r.played} moves${r.sameContent ? '' : `, content ${rec.build?.content || 'unstamped'} → ${CONTENT_HASH}, same game`})`); continue; }
  stale++;
  const kept = r.failure ? r.failure.index : r.played;
  const why = r.failure ? r.failure.message : `ending changed: expected ${JSON.stringify(rec.expect)}, got ${JSON.stringify(ending(r.state))}`;
  if (checkOnly) { console.log(`stale ${name}: ${why}`); continue; }
  const t0 = Date.now();
  const { rec: out, error } = rerecord(rec, kept);
  if (error) { console.log(`!! ${name}: couldn't re-record (${error})`); crashed++; continue; }
  writeFileSync(path, recordText(out) + '\n');
  console.log(`re ${name}: ${why}\n   re-recorded on ${CONTENT_HASH}: kept ${kept} of ${rec.moves.length} moves, bots played ${out.moves.length - kept} more; ending ${JSON.stringify(out.expect)} (${Date.now() - t0} ms)`);
}
process.exit(crashed || (checkOnly && stale) ? 1 : 0);
