// One local game, one owning tab (saboteur RC1 #1); a reload on a round summary reopens it (#3); a finished game's
// results outlive a reload (#2). The two-tab hand-off is simulated with two leases on one shared storage and a fake
// BroadcastChannel bus; the save guard runs through saved.js on jsdom's localStorage.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTabLease, OWNER_KEY } from '../../../v4/session/owner.js';
import { createLocalSession } from '../../../v4/session/index.js';
import { AWAY_TEXT } from '../../../v4/session/local.js';
import { restoredMoment } from '../../../v4/session/moment.js';
import { loadLocal, saveLocal, clearLocal, finishLocal, loadLast, clearLast, claimLocal, ownsLocal, localLease, ROUND_START } from '../../../v4/saved.js';
import { until, pause } from './helpers.js';

const memStorage = () => {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: k => { m.delete(k); } };
};
// a BroadcastChannel stand-in: every port hears every other port's messages (never its own), like the real one
const channelBus = () => {
  const ports = new Set();
  return () => {
    const fns = new Set();
    const port = {
      postMessage: m => { for (const p of ports) if (p !== port) p.deliver(m); },
      deliver: m => fns.forEach(fn => fn({ data: m })),
      addEventListener: (t, fn) => { if (t === 'message') fns.add(fn); },
      removeEventListener: (t, fn) => fns.delete(fn),
    };
    ports.add(port);
    return port;
  };
};
// window's storage event, as another tab's write fires it here
const storageEvents = () => {
  const fns = new Set();
  return {
    addEventListener: (t, fn) => { if (t === 'storage') fns.add(fn); },
    removeEventListener: (t, fn) => fns.delete(fn),
    fire: (key, newValue) => fns.forEach(fn => fn({ key, newValue })),
  };
};

describe('one tab owns a local game', () => {
  it('the newest tab takes over: the older one hears it on the channel and stops owning', () => {
    const storage = memStorage(), port = channelBus();
    const a = createTabLease({ storage, channel: port(), id: 'A' });
    const b = createTabLease({ storage, channel: port(), id: 'B' });
    let lostA = 0, lostB = 0;
    a.onLost(() => lostA++); b.onLost(() => lostB++);
    a.claim();
    expect(a.owns()).toBe(true);
    expect(b.owns()).toBe(false); // b never claimed: it may not write A's game
    expect(lostB).toBe(0); // and a tab that held nothing loses nothing
    b.claim();
    expect(lostA).toBe(1);
    expect(a.holding()).toBe(false);
    expect(a.owns()).toBe(false);
    expect(b.owns()).toBe(true);
    // "Play here": the old tab claims back, and the other one lets go in turn
    a.claim();
    expect(lostB).toBe(1);
    expect(a.owns()).toBe(true);
    expect(b.owns()).toBe(false);
    expect(lostA).toBe(1); // claiming never fires your own loss
  });

  it('falls back to the storage event without a BroadcastChannel', () => {
    const storage = memStorage(), events = storageEvents();
    const a = createTabLease({ storage, events, id: 'A' });
    const b = createTabLease({ storage, id: 'B' });
    let lost = 0;
    a.onLost(() => lost++);
    a.claim();
    b.claim();
    events.fire(OWNER_KEY, storage.getItem(OWNER_KEY)); // the browser tells A that B wrote the owner key
    expect(lost).toBe(1);
    events.fire(OWNER_KEY, storage.getItem(OWNER_KEY)); // once
    expect(lost).toBe(1);
  });

  it('notices a lost claim on its own next check, with no message at all', () => {
    const storage = memStorage();
    const a = createTabLease({ storage, id: 'A' });
    const b = createTabLease({ storage, id: 'B' });
    let lost = 0;
    a.onLost(() => lost++);
    a.claim();
    b.claim();
    expect(lost).toBe(0);
    expect(a.owns()).toBe(false);
    expect(lost).toBe(1);
  });

  it('release clears only its own mark', () => {
    const storage = memStorage();
    const a = createTabLease({ storage, id: 'A' });
    const b = createTabLease({ storage, id: 'B' });
    a.claim(); b.claim();
    a.release();
    expect(JSON.parse(storage.getItem(OWNER_KEY)).tab).toBe('B');
    b.release();
    expect(storage.getItem(OWNER_KEY)).toBe(null);
    expect(a.owns()).toBe(true); // nobody owns it: anyone may write
  });
});

describe('the save guard (saved.js)', () => {
  beforeEach(() => localStorage.clear());
  const fake = { players: [{ id: 0, name: 'Ana' }], round: 1 };

  it('a tab that lost the game never overwrites, clears or finishes the owner\'s save', () => {
    claimLocal();
    expect(saveLocal({ a: 1 }, { ...fake, moves: 5 })).toBe(true);
    const ours = localStorage.getItem('patrons.v4.local');
    localStorage.setItem(ROUND_START, JSON.stringify({ seed: 1, round: 1, names: 'Ana', state: fake }));
    // another tab claims the game (what its claimLocal writes)
    localStorage.setItem(OWNER_KEY, JSON.stringify({ tab: 'the-other-tab', at: Date.now() }));
    expect(ownsLocal()).toBe(false);
    expect(saveLocal({ a: 2 }, { ...fake, moves: 3 })).toBe(false);
    clearLocal();
    finishLocal(null, { ...fake, over: true });
    expect(localStorage.getItem('patrons.v4.local')).toBe(ours);
    expect(localStorage.getItem(ROUND_START)).not.toBe(null);
    expect(localStorage.getItem('patrons.v4.last')).toBe(null);
    // taking it back ("Play here") makes this tab the writer again
    claimLocal();
    expect(saveLocal({ a: 3 }, { ...fake, moves: 6 })).toBe(true);
    expect(JSON.parse(localStorage.getItem('patrons.v4.local')).state.moves).toBe(6);
    localLease().release();
  });
});

describe('two tabs on one local game: no move is lost', () => {
  beforeEach(() => { vi.useFakeTimers(); localStorage.clear(); });
  afterEach(() => { vi.useRealTimers(); });
  const seats = [{ name: 'Ana', kind: 'human' }, { name: 'P2', kind: 'bot' }, { name: 'P3', kind: 'bot' }];

  it('the old tab applies nothing after the hand-off, and the new tab resumes from its last move', async () => {
    const storage = memStorage(), port = channelBus();
    const leaseA = createTabLease({ storage, channel: port(), id: 'A' });
    const leaseB = createTabLease({ storage, channel: port(), id: 'B' });
    // each tab saves the way App does: through the guard
    const save = lease => st => { if (lease.owns()) storage.setItem('save', JSON.stringify(st)); };
    leaseA.claim();
    const tabA = createLocalSession({ seats, seed: 11, botDelayMs: 5, isOwner: () => leaseA.owns() });
    tabA.subscribe(save(leaseA));
    let lostA = false;
    leaseA.onLost(() => { lostA = true; tabA.destroy(); });
    // Ana's starting picks, then bots move on their own
    for (let k = 0; k < 40 && !(tabA.getState().round >= 1 && tabA.getState().moves > 12); k++) {
      const st = tabA.getState();
      if (st.pending && st.pending.player === 0) await tabA.submit({ player: 0, option: st.pending.options[0].id });
      await pause(10);
    }
    const before = tabA.getState();
    expect(JSON.parse(storage.getItem('save')).moves).toBe(before.moves);

    // tab B opens the game: claim first, then read the save
    leaseB.claim();
    const saved = JSON.parse(storage.getItem('save'));
    expect(lostA).toBe(true);
    expect(saved.moves).toBe(before.moves); // every move A made is in what B loads
    const tabB = createLocalSession({ state: saved, seats, botDelayMs: 5, isOwner: () => leaseB.owns() });
    tabB.subscribe(save(leaseB));

    // A, even if its bots or its person still try (a click that raced the message), applies nothing and saves nothing
    const tabA2 = createLocalSession({ state: before, botDelayMs: 5, isOwner: () => leaseA.owns() });
    await pause(200);
    expect(tabA2.getState().moves).toBe(before.moves);
    if (before.pending && before.pending.player === 0) {
      await expect(tabA2.submit({ player: 0, option: before.pending.options[0].id })).rejects.toThrow(AWAY_TEXT);
    }
    // B plays on, and the save follows B alone
    for (let k = 0; k < 60 && tabB.getState().moves < before.moves + 6; k++) {
      const st = tabB.getState();
      if (st.pending && st.pending.player === 0) await tabB.submit({ player: 0, option: st.pending.options[0].id });
      await pause(10);
    }
    expect(tabB.getState().moves).toBeGreaterThan(before.moves);
    expect(JSON.parse(storage.getItem('save')).moves).toBe(tabB.getState().moves);
    tabA2.destroy(); tabB.destroy();
  });
});

describe('a reload on the round summary reopens it, and the bots wait', () => {
  beforeEach(() => { vi.useFakeTimers(); localStorage.clear(); });
  afterEach(() => { vi.useRealTimers(); });
  const bots = [{ name: 'B1', kind: 'bot' }, { name: 'B2', kind: 'bot' }, { name: 'B3', kind: 'bot' }];

  it('holds at the round end, survives a save and resume held, and goes on only after continueRound', async () => {
    const s = createLocalSession({ seats: bots, seed: 4, botDelayMs: 1, holdRoundEnds: true });
    await until(() => s.roundHold, { timeout: 60000, label: 'round I scored' });
    const end = s.getState();
    expect(end.contests.length).toBe(1);
    expect(s.roundHold).toEqual({ moves: end.moves });
    await pause(2000);
    expect(s.getState().moves).toBe(end.moves); // nobody moves while the summary is up

    // the app's save carries the hold; a "reload" resumes held, and the summary can be rebuilt from the save
    claimLocal();
    saveLocal({ speed: 'normal' }, end, null, s.roundHold);
    const v = loadLocal();
    expect(v.hold).toEqual({ moves: end.moves });
    const again = createLocalSession({ state: v.state, hold: v.hold, botDelayMs: 1, holdRoundEnds: true });
    expect(again.roundHold).toEqual({ moves: end.moves });
    const m = restoredMoment(again, again.getState());
    expect(m).not.toBe(null);
    expect(m.result.round).toBe('I');
    expect(m.after).toBe(again.getState());
    expect(m.start.round).toBe(1);
    expect(m.start.moves).toBeLessThan(end.moves);
    expect(m.board).not.toBe(null); // the scoring snapshot, from the replayed state before the last move
    await pause(2000);
    expect(again.getState().moves).toBe(end.moves);

    // dismissed: the bots go on, and the next save has no hold
    let saves = 0;
    again.subscribe(st => { saves++; saveLocal({ speed: 'normal' }, st, null, again.roundHold); });
    expect(again.continueRound()).toBe(true);
    expect(loadLocal().hold).toBe(undefined);
    await until(() => again.getState().moves > end.moves, { label: 'bots after the summary' });
    expect(saves).toBeGreaterThan(1);
    s.destroy(); again.destroy();
    localLease().release();
  });

  it('a save without a hold (older build) resumes unheld, and sessions without holdRoundEnds never hold', async () => {
    const s = createLocalSession({ seats: bots, seed: 4, botDelayMs: 1 });
    await until(() => s.getState().contests.length === 1, { timeout: 60000, label: 'round I scored' });
    expect(s.roundHold).toBe(null);
    const st = s.getState();
    s.destroy();
    const again = createLocalSession({ state: st, botDelayMs: 1, holdRoundEnds: true });
    expect(again.roundHold).toBe(null);
    expect(restoredMoment(again, st)).toBe(null);
    await until(() => again.getState().moves > st.moves, { label: 'bots go on' });
    again.destroy();
  });
});

describe('the last finished game', () => {
  beforeEach(() => localStorage.clear());

  it('is kept after its results are shown, until a new game starts', async () => {
    vi.useFakeTimers();
    const s = createLocalSession({ seats: [{ name: 'B1', kind: 'bot' }, { name: 'B2', kind: 'bot' }], seed: 9, botDelayMs: 0 });
    await until(() => s.getState().over, { timeout: 60000, label: 'game over' });
    vi.useRealTimers();
    const st = s.getState();
    s.destroy();
    saveLocal({ speed: 'fast' }, st);
    finishLocal({ speed: 'fast' }, st);
    expect(loadLocal()).toBe(null); // nothing to resume
    const last = loadLast();
    expect(last.state.moves).toBe(st.moves);
    expect(last.config).toEqual({ speed: 'fast' });
    // its results and record come back from a session on the finished state, which never moves
    const view = createLocalSession({ state: last.state });
    expect(view.getState().over).toBe(true);
    view.destroy();
    clearLast();
    expect(loadLast()).toBe(null);
  });
});
