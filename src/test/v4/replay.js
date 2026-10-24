// Game records as regression tests. Drop a record (the app's "Copy game record", or window.patronsRecord() in
// devtools) into src/test/v4/records/<name>.json and records.test.js replays it on every gate run:
// - every move must be legal and nothing may throw;
// - optional `expect` in the file: { over: true, moves: 161, followers: [12, 9, 7] } must hold at the end.
// When the rules change under a record (an illegal move, or a different ending), the test fails and says so:
// `npm run records:refresh` re-records it from its seed on this build (scripts/v4-records-refresh.mjs). A record
// is skipped only when its seed can't even be set up (its table names a sphere this build doesn't have), and the
// gate fails when every kept record is skipped, so the corpus can't go quietly inert. Debug one with
// scripts/v4-replay.mjs.
import { readdirSync, readFileSync } from 'node:fs';
import { it, expect } from 'vitest';
import { replayRecord, parseRecord, CONTENT_HASH } from '../../v4/session/record.js';
import { followers } from '../../engine/v4/index.js';

export const RECORDS_DIR = new URL('./records/', import.meta.url);
export const REFRESH = 'npm run records:refresh';

/** Replays one record (object or JSON text) and asserts it; returns the replay result. `ctx` is the vitest context. */
export function checkRecord(input, { ctx, name = 'record' } = {}) {
  const rec = parseRecord(input);
  const r = replayRecord(rec);
  const made = rec.build?.content || 'unstamped';
  const why = r.sameContent
    ? `same rules content (${CONTENT_HASH}): an effect changed, or replay stopped being deterministic`
    : `made on older rules content (${made}, now ${CONTENT_HASH})`;
  if (r.failure) {
    if (r.failure.index === -1 && ctx) {
      ctx.skip(`${name}: its seed can't be replayed on this build: ${r.failure.message}`);
      return r;
    }
    const at = r.failure.state ? ` (round ${r.failure.state.round}, ${r.failure.state.pending?.kind || 'no'} decision)` : '';
    const hint = r.failure.reason === 'illegal' ? `\n${name} was ${why}. Re-record it from its seed: ${REFRESH}` : '';
    throw new Error(`${name}: ${r.failure.message}${at}${r.failure.stack ? `\n${r.failure.stack}` : ''}${hint}`);
  }
  const want = rec.expect;
  if (want) {
    const hint = `${name}, ${why}; if the change is intended: ${REFRESH}`;
    if (want.over !== undefined) expect(!!r.state.over, `${hint}: game over`).toBe(want.over);
    if (want.moves !== undefined) expect(r.state.moves, `${hint}: moves`).toBe(want.moves);
    if (want.followers) expect(r.state.players.map(p => followers(r.state, p)), `${hint}: followers`).toEqual(want.followers);
  }
  return r;
}

/** One test per *.json file in `dir` (default src/test/v4/records/), then one that fails if none of them replayed. */
export function recordTests(dir = RECORDS_DIR) {
  const files = readdirSync(dir).filter(f => f.endsWith('.json')).sort();
  const skipped = [];
  for (const f of files) {
    it(`replays ${f}`, ctx => {
      const skip = ctx.skip.bind(ctx);
      checkRecord(readFileSync(new URL(f, dir), 'utf8'), { ctx: { skip: msg => { skipped.push(f); skip(msg); } }, name: f });
    });
  }
  it('at least one kept record replays (the corpus is not inert)', () => {
    expect(files.length, `no records in ${dir.pathname ?? dir}`).toBeGreaterThan(0);
    expect(skipped.length, `every kept record was skipped (${skipped.join(', ')}): re-make them on this build`).toBeLessThan(files.length);
  });
  return files;
}
