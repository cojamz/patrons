// Game records as regression tests. Drop a record (the app's "Copy game record", or window.patronsRecord() in
// devtools) into src/test/v4/records/<name>.json and records.test.js replays it on every gate run:
// - every move must be legal and nothing may throw;
// - optional `expect` in the file: { over: true, moves: 161, followers: [12, 9, 7] } (checked when the record was
//   made on this build's rules content).
// A record made on older content that now hits an illegal move is skipped with a note (the cards changed under it,
// so it no longer describes a reachable game); an exception always fails. Debug one with scripts/v4-replay.mjs.
import { readdirSync, readFileSync } from 'node:fs';
import { it, expect } from 'vitest';
import { replayRecord, parseRecord, CONTENT_HASH } from '../../v4/session/record.js';
import { followers } from '../../engine/v4/index.js';

export const RECORDS_DIR = new URL('./records/', import.meta.url);

/** Replays one record (object or JSON text) and asserts it; returns the replay result. `ctx` is the vitest context. */
export function checkRecord(input, { ctx, name = 'record' } = {}) {
  const rec = parseRecord(input);
  const r = replayRecord(rec);
  if (r.failure) {
    const at = r.failure.state ? ` (round ${r.failure.state.round}, ${r.failure.state.pending?.kind || 'no'} decision)` : '';
    if (!r.sameContent && r.failure.reason === 'illegal' && ctx) {
      ctx.skip(`${name}: made on older rules content (${rec.build?.content || 'unstamped'}, now ${CONTENT_HASH}); ${r.failure.message}`);
      return r;
    }
    throw new Error(`${name}: ${r.failure.message}${at}${r.failure.stack ? `\n${r.failure.stack}` : ''}`);
  }
  const want = rec.expect;
  if (want && r.sameContent) {
    if (want.over !== undefined) expect(!!r.state.over, `${name}: game over`).toBe(want.over);
    if (want.moves !== undefined) expect(r.state.moves, `${name}: moves`).toBe(want.moves);
    if (want.followers) expect(r.state.players.map(p => followers(r.state, p)), `${name}: followers`).toEqual(want.followers);
  }
  return r;
}

/** One test per *.json file in `dir` (default src/test/v4/records/). */
export function recordTests(dir = RECORDS_DIR) {
  const files = readdirSync(dir).filter(f => f.endsWith('.json')).sort();
  for (const f of files) it(`replays ${f}`, ctx => { checkRecord(readFileSync(new URL(f, dir), 'utf8'), { ctx, name: f }); });
  if (!files.length) it.skip('no records yet', () => {});
  return files;
}
