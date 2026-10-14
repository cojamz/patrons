import { describe, it, expect } from 'vitest';
import { createLocalSession } from '../../../v4/session/index.js';
import { chooseBotMove } from '../../../engine/v4/index.js';
import { until, autoPlay } from './helpers.js';

describe('local session', () => {
  it('runs a full all-bot game to the end', async () => {
    const s = createLocalSession({ seats: [{ name: 'A', kind: 'bot' }, { name: 'B', kind: 'bot' }, { name: 'C', kind: 'bot' }], seed: 11, botDelayMs: 0 });
    const seen = [];
    s.subscribe((state, info) => seen.push(info.version));
    expect(seen).toEqual([1]); // called once immediately
    expect(s.mySeats).toEqual([]);
    await until(() => s.getState().over, { label: 'game over' });
    expect(s.getState().ranking).toHaveLength(3);
    expect(s.info.mode).toBe('local');
    expect(seen.length).toBe(s.info.version);
    s.destroy();
  });

  it('hot-seat: humans play through submit, bots fill in, game completes', async () => {
    const s = createLocalSession({ seats: [{ name: 'A', kind: 'human' }, { name: 'B', kind: 'bot' }, { name: 'C', kind: 'human' }], seed: 3, botDelayMs: 0 });
    expect(s.mySeats).toEqual([0, 2]);
    s.subscribe(state => {
      if (state.pending && s.mySeats.includes(state.pending.player)) queueMicrotask(() => s.submit(chooseBotMove(state)).catch(() => {}));
    });
    await until(() => s.getState().over, { label: 'game over' });
    s.destroy();
  });

  it('rejects wrong seat, wrong turn, and illegal options', async () => {
    const s = createLocalSession({ seats: [{ name: 'A' }, { name: 'B', kind: 'bot' }], seed: 5, botDelayMs: 10_000 });
    const st = s.getState();
    expect(st.pending.player).toBe(0);
    await expect(s.submit({ player: 1, option: st.pending.options[0].id })).rejects.toThrow(/isn't yours/);
    await expect(s.submit({ player: 0, option: 'nope' })).rejects.toThrow(/Illegal/);
    const before = s.info.version;
    await s.submit({ player: 0, option: st.pending.options[0].id });
    expect(s.info.version).toBe(before + 1);
    s.destroy();
  });
});

// ── resume + undo ──────────────────────────────────────────────

const humans2 = [{ name: 'A' }, { name: 'B' }];

/** Plays pending moves with the bot brain (through submit) until `stop(state)` is true. Humans only. */
async function driveUntil(s, stop) {
  for (let i = 0; i < 500 && !stop(s.getState()); i++) await s.submit(chooseBotMove(s.getState()));
  if (!stop(s.getState())) throw new Error('driveUntil: condition never reached');
}

/** Drives to the first placement, makes it, and returns the state from just before it. */
async function placeOnce(s) {
  await driveUntil(s, st => st.pending && st.pending.kind === 'place');
  const pre = s.getState();
  await s.submit({ option: pre.pending.options[0].id });
  return pre;
}

describe('local session: undo', () => {
  it('undo restores exactly the pre-placement state, once', async () => {
    const s = createLocalSession({ seats: humans2, seed: 21, botDelayMs: 0 });
    const pre = await placeOnce(s);
    const preCopy = structuredClone(pre);
    expect(s.canUndo()).toBe(true);
    const v = s.info.version;
    let heard = null;
    s.subscribe(st => { heard = st; });
    expect(s.undo()).toBe(true);
    expect(s.getState()).toEqual(preCopy);
    expect(heard).toEqual(preCopy);
    expect(s.info.version).toBe(v + 1);
    expect(s.canUndo()).toBe(false);
    expect(s.undo()).toBe(false);
    // and the game plays on from there
    await s.submit({ option: s.getState().pending.options[0].id });
    expect(s.canUndo()).toBe(true);
    s.destroy();
  });

  it('is not offered after a pass', async () => {
    const s = createLocalSession({ seats: humans2, seed: 21, botDelayMs: 0 });
    const pre = await placeOnce(s);
    const me = pre.pending.player;
    await driveUntil(s, st => st.pending.player !== me || st.pending.kind === 'buy');
    expect(s.getState().pending.kind).toBe('buy'); // seed 21: the placement leads straight to a buy
    expect(s.canUndo()).toBe(true);
    await s.submit({ option: 'pass' });
    expect(s.canUndo()).toBe(false);
    expect(s.undo()).toBe(false);
    s.destroy();
  });

  it('is not offered after a buy, even if the same player still has a decision', async () => {
    let found = false;
    for (let seed = 1; seed < 40 && !found; seed++) {
      const s = createLocalSession({ seats: humans2, seed, botDelayMs: 0 });
      // play placements until one is followed by a buy with something real to buy
      for (let turn = 0; turn < 12 && !found && !s.getState().over; turn++) {
        const pre = await placeOnce(s);
        const me = pre.pending.player;
        await driveUntil(s, st => st.over || st.pending.player !== me || st.pending.kind === 'buy');
        const st = s.getState();
        const buy = st.pending && st.pending.player === me && st.pending.kind === 'buy'
          && st.pending.options.find(o => o.kind === 'card' || o.kind === 'tier');
        if (!buy) continue;
        expect(s.canUndo()).toBe(true);
        await s.submit({ option: buy.id });
        // a multi-way payment opens a 'pay' step: still undoable until paid
        if (s.getState().pending?.kind === 'pay') {
          expect(s.canUndo()).toBe(true);
          await s.submit({ option: s.getState().pending.options[0].id });
        }
        expect(s.canUndo()).toBe(false);
        expect(s.undo()).toBe(false);
        found = true;
      }
      s.destroy();
    }
    expect(found).toBe(true);
  });

  it('is never offered for bot placements', async () => {
    const s = createLocalSession({ seats: [{ name: 'Bot', kind: 'bot' }, { name: 'H' }], seed: 9, botDelayMs: 0 });
    let botTurnsSeen = 0;
    const errors = [];
    s.subscribe(st => {
      if (!st.pending || st.over) return;
      if (st.players[st.pending.player].kind === 'bot') {
        botTurnsSeen++;
        if (s.canUndo()) errors.push(`undo offered on bot turn at move ${st.moves}`);
        if (s.undo()) errors.push('bot placement was undone');
      } else {
        queueMicrotask(() => s.submit(chooseBotMove(s.getState())).catch(() => {}));
      }
    });
    await until(() => s.getState().over, { label: 'game over' });
    expect(botTurnsSeen).toBeGreaterThan(10);
    expect(errors).toEqual([]);
    s.destroy();
  });

  it('an all-bot game never offers undo', async () => {
    const s = createLocalSession({ seats: [{ name: 'A', kind: 'bot' }, { name: 'B', kind: 'bot' }], seed: 2, botDelayMs: 0 });
    let offered = false;
    s.subscribe(() => { if (s.canUndo()) offered = true; });
    await until(() => s.getState().over, { label: 'game over' });
    expect(offered).toBe(false);
    s.destroy();
  });
});

describe('local session: resume', () => {
  it('resumes from a saved state with the same seats and position', async () => {
    const a = createLocalSession({ seats: [{ name: 'A' }, { name: 'B', kind: 'bot' }, { name: 'C' }], seed: 13, botDelayMs: 10_000 });
    const saved = JSON.parse(JSON.stringify(a.getState()));
    a.destroy();
    const b = createLocalSession({ state: saved, botDelayMs: 10_000 });
    expect(b.getState()).toEqual(saved);
    expect(b.mySeats).toEqual([0, 2]);
    expect(b.info.seats.map(x => x.kind)).toEqual(['human', 'bot', 'human']);
    expect(b.canUndo()).toBe(false);
    b.destroy();
  });

  it('bots pick up where they left off after a resume, and the game finishes', async () => {
    // Play the human seat until it's the bot's turn, with bots frozen.
    const a = createLocalSession({ seats: [{ name: 'H' }, { name: 'Bot', kind: 'bot' }], seed: 17, botDelayMs: 10_000 });
    await driveUntil(a, st => st.pending && st.pending.player === 1);
    const saved = JSON.parse(JSON.stringify(a.getState()));
    a.destroy();
    expect(saved.pending.player).toBe(1);

    const b = createLocalSession({ state: saved, botDelayMs: 0 });
    await until(() => b.getState().moves > saved.moves, { label: 'bot moves after resume' });
    const stop = autoPlay(b);
    await until(() => b.getState().over, { label: 'game over' });
    stop();
    expect(b.getState().ranking).toHaveLength(2);
    b.destroy();
  });

  it('undo works in a resumed game', async () => {
    const a = createLocalSession({ seats: humans2, seed: 21, botDelayMs: 0 });
    await driveUntil(a, st => st.pending && st.pending.kind === 'place');
    const saved = JSON.parse(JSON.stringify(a.getState()));
    a.destroy();
    const b = createLocalSession({ state: saved, botDelayMs: 0 });
    await b.submit({ option: saved.pending.options[0].id });
    expect(b.canUndo()).toBe(true);
    b.undo();
    expect(b.getState()).toEqual(saved);
    b.destroy();
  });
});
