// Game records: sessions keep the seed, table, rules and every move (option ids), so any game, local or online, can be
// copied as JSON and replayed exactly; a replay reports the first illegal move or exception with the state there.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createLocalSession, createRoom, joinRoom, createMemoryStore, createMemoryTransport } from '../../../v4/session/index.js';
import { newGame, step, gameRecord, replayRecord, parseRecord, recordText, CONTENT_HASH } from '../../../v4/session/record.js';
import { registerQuadrant } from '../../../engine/v4/content/index.js';
import { chooseBotMove } from '../../../engine/v4/index.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import { checkRecord } from '../replay.js';
import { untilFake, autoPlay } from './helpers.js';

afterEach(() => { vi.useRealTimers(); });

const same = (a, b) => expect(JSON.stringify(a)).toBe(JSON.stringify(b));

describe('sessions record every move', () => {
  it('local: history is the move list at every step (bots and humans), and the record replays to the identical state', async () => {
    vi.useFakeTimers();
    const s = createLocalSession({ seats: [{ name: 'Ana' }, { name: 'Bo', kind: 'bot' }, { name: 'Cy', kind: 'bot' }], seed: 31, botDelayMs: 5, quadrants: ['gold', 'red', 'thieves', 'echo'] });
    const bad = [];
    s.subscribe(st => { if (st.history.length !== st.moves) bad.push(st.moves); });
    const stop = autoPlay(s, { seed: 2 });
    await untilFake(() => s.getState().over, { label: 'game over' });
    stop();
    const end = s.getState();
    expect(bad).toEqual([]);
    expect(end.history.length).toBe(end.moves);
    const rec = parseRecord(recordText(gameRecord(end))); // through the clipboard text
    expect(rec).toMatchObject({ seed: 31, quadrants: ['gold', 'red', 'thieves', 'echo'], build: { content: CONTENT_HASH } });
    const r = replayRecord(rec);
    expect(r.ok).toBe(true);
    same(r.state, end);
    s.destroy();
  });

  it('local: undo takes its move back out of the record', async () => {
    const s = createLocalSession({ seats: [{ name: 'A' }, { name: 'B' }], seed: 21, botDelayMs: 0 });
    for (let i = 0; i < 200 && s.getState().pending.kind !== 'place'; i++) await s.submit(chooseBotMove(s.getState()));
    const pre = s.getState();
    await s.submit({ option: pre.pending.options[0].id });
    expect(s.getState().history.length).toBe(pre.moves + 1);
    expect(s.undo()).toBe(true);
    expect(s.getState().history).toEqual(pre.history);
    same(replayRecord(gameRecord(s.getState())).state, pre);
    s.destroy();
  });

  it('online: every client’s state carries the record, and it replays to the host’s final state', async () => {
    vi.useFakeTimers();
    const store = createMemoryStore();
    const host = await createRoom({ name: 'Host', transport: createMemoryTransport(store), seed: 8, botDelayMs: 5 });
    const guest = await joinRoom({ code: host.code, name: 'G', transport: createMemoryTransport(store), botDelayMs: 5 });
    await host.lobby.addBot();
    const ss = [new Promise(r => host.lobby.onStart(r)), new Promise(r => guest.lobby.onStart(r))];
    await host.lobby.start();
    const [hs, gs] = await Promise.all(ss);
    const stops = [autoPlay(hs, { seed: 1 }), autoPlay(gs, { seed: 2 })];
    await untilFake(() => hs.getState()?.over && gs.getState()?.over, { label: 'game over everywhere' });
    stops.forEach(f => f());
    same(gs.getState(), hs.getState());
    const r = replayRecord(gameRecord(gs.getState()));
    expect(r.ok).toBe(true);
    same(r.state, hs.getState());
    host.lobby.destroy(); guest.lobby.destroy();
  });
});

/** A short bot game as a record. */
function botRecord(seed = 4, n = 60) {
  let st = newGame({ seats: [{ name: 'A', kind: 'bot' }, { name: 'B', kind: 'bot' }], seed });
  const rand = seededRandom(seed);
  for (let i = 0; i < n && !st.over; i++) st = step(st, chooseBotMove(st, rand));
  return { rec: gameRecord(st), st };
}

describe('replayRecord', () => {
  it('stops at the first illegal move and hands back the state it was offered to', () => {
    const { rec } = botRecord();
    rec.moves[40] = [rec.moves[40][0], 'slot:9-9'];
    const r = replayRecord(rec);
    expect(r.ok).toBe(false);
    expect(r.failure).toMatchObject({ index: 40, reason: 'illegal', move: { option: 'slot:9-9' } });
    expect(r.failure.message).toMatch(/^Move 41 \(P\d slot:9-9\) is illegal/);
    expect(r.failure.state.moves).toBe(40);
    expect(r.played).toBe(40);
  });

  it('reports an exception inside a move with the state before it', () => {
    // a test-only sphere whose one space throws when taken
    registerQuadrant({
      id: 'boomtest', name: 'Boom', resource: 'boomtest', scoring: { label: 'Most boom', score: (ctx, p) => p.res.boomtest || 0 },
      actions: [{ key: 'bang', ring: 1, name: 'Bang', text: 'Throws.', estimate: () => 0, resolve() { throw new Error('bang!'); } }],
      handlers: {}, members: [],
    });
    let st = newGame({ seats: [{ name: 'A', kind: 'bot' }, { name: 'B', kind: 'bot' }], seed: 3, quadrants: ['gold', 'red', 'blue', 'boomtest'] });
    const rand = seededRandom(3);
    while (!st.pending.options.some(o => o.id === 'slot:3-0')) st = step(st, chooseBotMove(st, rand));
    const rec = gameRecord(st);
    rec.moves.push([st.pending.player, 'slot:3-0']);
    const r = replayRecord(rec);
    expect(r.failure).toMatchObject({ index: st.moves, reason: 'exception' });
    expect(r.failure.message).toMatch(/threw: bang!/);
    same(r.failure.state, st);
  });

  it('a record that can’t even set up says so', () => {
    const { rec } = botRecord(5, 3);
    rec.quadrants[3] = 'nosuchsphere';
    expect(replayRecord(rec).failure).toMatchObject({ index: -1, reason: 'exception' });
    expect(() => parseRecord('{"kind":"other"}')).toThrow(/game record/);
    expect(() => parseRecord({ ...rec, moves: null })).toThrow(/no move list/);
  });

  it('the vitest helper: passes a clean record, fails on an exception, skips an older-content record that no longer fits', () => {
    const { rec, st } = botRecord(6, 50);
    expect(checkRecord({ ...rec, expect: { moves: st.moves } }).state.moves).toBe(50);
    expect(() => checkRecord({ ...rec, expect: { moves: 49 } })).toThrow();
    const older = { ...rec, build: { ...rec.build, content: 'older' }, moves: [...rec.moves.slice(0, 10), [0, 'nope']] };
    const ctx = { skip: vi.fn() };
    checkRecord(older, { ctx, name: 'older.json' });
    expect(ctx.skip).toHaveBeenCalledWith(expect.stringMatching(/older rules content/));
    expect(() => checkRecord({ ...older, build: rec.build }, { ctx, name: 'current.json' })).toThrow(/Move 11/);
  });

  it('scripts/v4-replay.mjs replays a record file and reports the first illegal move with where the game stood', () => {
    const { rec } = botRecord(7, 40);
    const dir = mkdtempSync(join(tmpdir(), 'v4rec-'));
    writeFileSync(join(dir, 'ok.json'), recordText(rec));
    expect(execFileSync('node', ['scripts/v4-replay.mjs', join(dir, 'ok.json'), '--log', '0'], { encoding: 'utf8' })).toMatch(/OK: replayed 40 of 40 moves/);
    rec.moves[25] = [rec.moves[25][0], 'card:9999'];
    writeFileSync(join(dir, 'bad.json'), recordText(rec));
    let out = '', code = 0;
    try { execFileSync('node', ['scripts/v4-replay.mjs', join(dir, 'bad.json'), '--log', '2', '--state', join(dir, 'at.json')], { encoding: 'utf8' }); } catch (err) { out = err.stdout; code = err.status; }
    expect(code).toBe(1);
    expect(out).toMatch(/FAIL at move 26 of 40 \(illegal\)/);
    expect(out).toMatch(/Pending: P\d/);
    expect(out).toMatch(/State written to/);
  });
});
