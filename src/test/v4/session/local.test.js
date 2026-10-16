import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createLocalSession } from '../../../v4/session/index.js';
import { chooseBotMove } from '../../../engine/v4/index.js';
import { until, autoPlay } from './helpers.js';
import { revealed } from '../../../v4/session/local.js';
import { seededRandom } from '../../../engine/v4/rng.js';

// No wall clock: bots and the host run on fake timers, and until() advances them (helpers.js).
beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

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
    // (seed 7: the human draws first place in round I, whose order is set before the starting picks)
    const s = createLocalSession({ seats: [{ name: 'A' }, { name: 'B', kind: 'bot' }], seed: 7, botDelayMs: 10_000 });
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

/** Plays pending moves with the bot brain (through submit) until `stop(state)` is true. Humans only. `rand` seeds the
 *  bot brain where a test must play the same game every run. */
async function driveUntil(s, stop, rand = Math.random) {
  for (let i = 0; i < 500 && !stop(s.getState()); i++) await s.submit(chooseBotMove(s.getState(), rand));
  if (!stop(s.getState())) throw new Error('driveUntil: condition never reached');
}

/** Drives to the first placement, makes it, and returns the state from just before it. */
async function placeOnce(s, rand = Math.random) {
  await driveUntil(s, st => st.pending && st.pending.kind === 'place', rand);
  const pre = s.getState();
  await s.submit({ option: pre.pending.options[0].id });
  return pre;
}

/** What undo should allow after `after`, given the state `before` the last move and who made it. */
// placedFrom: the state before the placement whose Undo is still open (null when none): a choice that goes on, one pick
// at a time, keeps it while the same person is still choosing and nothing hidden was shown since the placement
const expectUndo = (before, move, after, humans, placedFrom = null) => {
  if (!before.pending || !humans.includes(move.player) || after.over || after.round !== before.round) return false;
  const k = before.pending.kind;
  // a placement: while it's still the placer's decision
  // ...and never once it showed hidden cards (New Faces' fresh row): undo would leak the deck
  if (k === 'place') return !revealed(before, after) && !!(after.pending && after.pending.player === move.player && after.pending.kind !== 'place');
  // a completed purchase: until anyone moves next (paid at once, or after choosing how to pay)
  // ...but never once the device passes to another person
  const handedOff = !!(after.pending && after.pending.player !== move.player && humans.includes(after.pending.player));
  if (k === 'buy') return /^(card|tier):/.test(move.option) && !(after.pending && after.pending.kind === 'pay') && !handedOff;
  if (k === 'pay') return move.option !== 'back' && !handedOff;
  // a first starting pick: while the same person's second pick is open
  if (k === 'setup') return !!(after.pending && after.pending.kind === 'setup' && after.pending.player === move.player);
  if (k === 'choose' && placedFrom) return placedFrom.round === after.round && !revealed(placedFrom, after) && !!(after.pending && after.pending.kind === 'choose' && after.pending.player === move.player);
  return false;
};

/** Drives to a placement and makes one that leads straight to the placer's buy (trying options via undo). */
async function placeToBuy(s) {
  await driveUntil(s, st => st.pending && st.pending.kind === 'place');
  const pre = s.getState();
  for (const o of pre.pending.options) {
    await s.submit({ option: o.id });
    const st = s.getState();
    if (st.pending && st.pending.player === pre.pending.player && st.pending.kind === 'buy') return pre;
    expect(s.undo()).toBe(true);
  }
  throw new Error('no placement leads straight to a buy');
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

  it('is not offered after a placement that showed hidden cards (New Faces), and is after one that did not', async () => {
    const s = createLocalSession({ seats: humans2, seed: 21, botDelayMs: 0, quadrants: ['market', 'gold', 'red', 'silver'] });
    await driveUntil(s, st => st.pending && st.pending.kind === 'place');
    const pre = s.getState();
    const slot = name => pre.pending.options.find(o => o.kind === 'slot' && o.label === name).id;
    // a placement that shows nothing new: undo is there
    await s.submit({ option: slot('Name Drop') });
    expect(s.canUndo()).toBe(true);
    expect(s.undo()).toBe(true);
    // New Faces sweeps the row: the old row must not come back
    await s.submit({ option: slot('New Faces') });
    const after = s.getState();
    expect(after.shop).not.toEqual(pre.shop);
    expect(after.pending.player).toBe(pre.pending.player);
    expect(s.canUndo()).toBe(false);
    expect(s.undo()).toBe(false);
    expect(s.getState().shop).toEqual(after.shop);
    s.destroy();
  });

  it('is not offered after a pass', async () => {
    const s = createLocalSession({ seats: humans2, seed: 21, botDelayMs: 0 });
    await placeToBuy(s);
    expect(s.canUndo()).toBe(true);
    await s.submit({ option: 'pass' });
    expect(s.canUndo()).toBe(false);
    expect(s.undo()).toBe(false);
    s.destroy();
  });

  it('after a buy it undoes the buy (back to the buy step); after a follow-up choice only while that choice goes on', async () => {
    // the bot brain is seeded: on Math.random it passed about 3 runs in 4
    let bought = false, followedUp = false;
    for (let seed = 1; seed < 60 && !(bought && followedUp); seed++) {
      const rand = seededRandom(seed * 7919);
      const s = createLocalSession({ seats: humans2, seed, botDelayMs: 0 });
      for (let turn = 0; turn < 12 && !s.getState().over; turn++) {
        const pre = await placeOnce(s, rand);
        const st = s.getState();
        // only a placement that leaves the placer a decision (not a snake double's next placement) is undoable
        if (!st.pending || st.pending.player !== pre.pending.player || st.round !== pre.round || st.pending.kind === 'place') continue;
        // ...and never once it showed hidden cards (Open Door's free recruit refills the row): undo would leak the deck
        if (revealed(pre, st)) { expect(s.canUndo()).toBe(false); await driveUntil(s, x => x.over || x.pending.kind === 'place', rand); continue; }
        expect(s.canUndo()).toBe(true);
        const buy = st.pending.kind === 'buy' && st.pending.options.find(o => o.kind === 'card' || o.kind === 'tier');
        if (buy) {
          await s.submit({ option: buy.id });
          // paying may ask how; a completed purchase is then undoable as a buy, back to the buy step
          if (s.getState().pending?.kind === 'pay') await s.submit({ option: s.getState().pending.options.find(o => o.default).id });
          bought = true;
          const after = s.getState();
          const handedOff = after.pending && after.pending.player !== pre.pending.player; // both seats are people here
          if (after.over || after.round !== st.round || handedOff) {
            // a buy that ends the round (or game), or that hands the device on, can't be taken back
            expect(s.undoKind).toBe(null);
          } else {
            expect(s.undoKind).toBe('buy');
            expect(s.undo()).toBe(true);
            expect(s.getState().pending.kind).toBe('buy');
            expect(s.getState().pending.player).toBe(pre.pending.player);
            expect(s.canUndo()).toBe(false);
          }
          await driveUntil(s, x => x.over || x.pending.kind === 'place', rand);
          continue;
        }
        await s.submit(chooseBotMove(st, rand)); followedUp = true; // a 'choose' from the action, etc.
        // a choice that goes on, one pick at a time (a steal coin by coin), keeps Undo placement until it ends (live
        // panel round 3, Cory's lane brief: it vanished after the first pick); a finished choice ends it
        const mid = s.getState();
        const goesOn = st.pending.kind === 'choose' && mid.pending && mid.pending.kind === 'choose' && mid.pending.player === pre.pending.player
          && mid.round === pre.round && !revealed(pre, mid);
        expect(s.canUndo()).toBe(goesOn);
        if (goesOn) {
          expect(s.undoKind).toBe('place');
          expect(s.undo()).toBe(true);
          expect(s.getState().pending.kind).toBe('place');
          expect(s.getState().pending.player).toBe(pre.pending.player);
          expect(s.getState().moves).toBe(pre.moves);
        } else expect(s.undo()).toBe(false);
        await driveUntil(s, x => x.over || x.pending.kind === 'place', rand);
      }
      s.destroy();
    }
    expect(bought).toBe(true);
    expect(followedUp).toBe(true);
  });

  it('is offered exactly while a human placement or buy is the last move: never past other moves, bots or round ends', async () => {
    let roundEndsSeen = 0, undoable = 0, botMovesSeen = 0;
    for (const seed of [3, 9, 27]) {
      const s = createLocalSession({ seats: [{ name: 'H1' }, { name: 'Bot', kind: 'bot' }, { name: 'H2' }], seed, botDelayMs: 0 });
      const errors = [];
      let prev = s.getState();
      let lastMove = null;
      // wrap submit-side moves; bot moves are inferred from the pending player of `prev`
      s.subscribe(st => {
        if (st !== prev) check(st);
        if (st.pending && !st.over && s.mySeats.includes(st.pending.player)) {
          const m = chooseBotMove(st);
          lastMove = { ...m, at: st.moves };
          queueMicrotask(() => s.submit(m).catch(e => errors.push(e.message)));
        }
      });
      let placedFrom = null; // the placement whose Undo is open, while its choice goes on
      function check(st) {
        const move = lastMove && lastMove.at === prev.moves ? lastMove : { player: prev.pending?.player };
        const want = !!move.option && expectUndo(prev, move, st, s.mySeats, placedFrom && placedFrom.player === move.player ? placedFrom.state : null);
        const k = prev.pending && prev.pending.kind;
        placedFrom = want && (k === 'place' || k === 'choose') ? (k === 'place' ? { state: prev, player: move.player } : placedFrom) : null;
        if (want) undoable++;
        if (!move.option) botMovesSeen++;
        if (st.round !== prev.round) roundEndsSeen++;
        if (s.canUndo() !== want) errors.push(`seed ${seed} move ${st.moves}: canUndo ${s.canUndo()}, expected ${want}`);
        // on a bot's turn, undo only ever takes back a human's just-made buy, never anything else
        if (!want && st.pending && st.players[st.pending.player].kind === 'bot' && s.undo()) errors.push('undid on a bot turn');
        prev = st;
      }
      await until(() => s.getState().over, { label: 'game over' });
      expect(errors).toEqual([]);
      s.destroy();
    }
    expect(roundEndsSeen).toBeGreaterThan(3);
    expect(undoable).toBeGreaterThan(10);
    expect(botMovesSeen).toBeGreaterThan(10);
  });

  it('a move that ends the round is never undoable', async () => {
    // (the engine now always follows a placement with its buy step, so the round ends on a buy or a pass)
    let found = 0;
    for (let seed = 1; seed < 30 && found < 4; seed++) {
      const s = createLocalSession({ seats: humans2, seed, botDelayMs: 0 });
      while (!s.getState().over) {
        const st = s.getState();
        const move = st.pending.kind === 'place' ? { option: st.pending.options[0].id } : chooseBotMove(st);
        await s.submit(move);
        const after = s.getState();
        if (after.round !== st.round || after.over) {
          found++;
          expect(s.canUndo()).toBe(false);
          expect(s.undo()).toBe(false);
        }
      }
      s.destroy();
    }
    expect(found).toBeGreaterThan(0);
  });

  it('an all-bot game never offers undo', async () => {
    const s = createLocalSession({ seats: [{ name: 'A', kind: 'bot' }, { name: 'B', kind: 'bot' }], seed: 2, botDelayMs: 0 });
    let offered = false;
    s.subscribe(() => { if (s.canUndo()) offered = true; });
    await until(() => s.getState().over, { label: 'game over' });
    expect(offered).toBe(false);
    expect(s.undoCheckpoint).toBe(null);
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

  it('keeps undo across a reload when the saved checkpoint is still valid', async () => {
    const a = createLocalSession({ seats: humans2, seed: 21, botDelayMs: 0 });
    const pre = structuredClone(await placeOnce(a));
    expect(a.undoCheckpoint).not.toBe(null);
    const saved = JSON.parse(JSON.stringify({ state: a.getState(), undo: a.undoCheckpoint }));
    a.destroy();
    const b = createLocalSession({ state: saved.state, undo: saved.undo, botDelayMs: 0 });
    expect(b.canUndo()).toBe(true);
    expect(b.undo()).toBe(true);
    expect(b.getState()).toEqual(pre);
    expect(b.undoCheckpoint).toBe(null);
    b.destroy();
  });

  it('drops a saved checkpoint that no longer matches the saved state', async () => {
    const a = createLocalSession({ seats: humans2, seed: 21, botDelayMs: 0 });
    await placeToBuy(a);
    const stale = JSON.parse(JSON.stringify(a.undoCheckpoint));
    await a.submit({ option: 'pass' });
    const state = JSON.parse(JSON.stringify(a.getState()));
    a.destroy();
    const b = createLocalSession({ state, undo: stale, botDelayMs: 0 });
    expect(b.canUndo()).toBe(false);
    expect(b.undo()).toBe(false);
    expect(b.getState()).toEqual(state);
    b.destroy();
  });

  it('undo works for a placement made after a resume', async () => {
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

describe('local session: undo never crosses a hand-off', () => {
  it("after P1 buys and the device passes to another person, nobody can undo P1's buy", async () => {
    let checked = 0;
    for (let seed = 1; seed < 80 && checked < 3; seed++) {
      const s = createLocalSession({ seats: [{ name: 'P1' }, { name: 'Ana' }], seed, botDelayMs: 0 });
      for (let i = 0; i < 400 && !s.getState().over; i++) {
        const st = s.getState();
        const m = chooseBotMove(st);
        await s.submit(m);
        const now = s.getState();
        const boughtThenHandedOff = (st.pending.kind === 'buy' || st.pending.kind === 'pay') && /^(card|tier|pay):/.test(m.option)
          && now.pending && now.pending.player !== m.player && !(now.pending.kind === 'pay');
        if (boughtThenHandedOff) {
          checked++;
          expect(s.canUndo()).toBe(false);
          expect(s.undo()).toBe(false);
        }
      }
      s.destroy();
    }
    expect(checked).toBeGreaterThan(0);
  });
});
