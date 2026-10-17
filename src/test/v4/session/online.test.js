import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createRoom, joinRoom, createMemoryStore, createMemoryTransport, ROOM_ROOT,
} from '../../../v4/session/index.js';
import { until, pause, autoPlay, fingerprint } from './helpers.js';

// No wall clock: bots and the host run on fake timers, and until() advances them (helpers.js).
beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

const DELAY = 0;

async function table(nGuests, { bots = 0, seed = 21 } = {}) {
  const store = createMemoryStore();
  const ht = createMemoryTransport(store);
  const host = await createRoom({ name: 'Host', transport: ht, seed, botDelayMs: DELAY });
  const guests = [];
  for (let i = 0; i < nGuests; i++) {
    const t = createMemoryTransport(store);
    guests.push({ t, ...(await joinRoom({ code: host.code, name: `G${i + 1}`, transport: t, botDelayMs: DELAY })) });
  }
  for (let i = 0; i < bots; i++) await host.lobby.addBot();
  return { store, host: { t: ht, ...host }, guests };
}

const started = lobby => new Promise(r => lobby.onStart(r));
const room = (store, code) => store.data?.[ROOM_ROOT]?.[code];

describe('online session over the memory transport', () => {
  it('lobby: seats, bots, start, and every client gets a session', async () => {
    const { host, guests, store } = await table(1, { bots: 1 });
    const view = host.lobby.getView();
    expect(view.code).toHaveLength(5);
    expect(view.players.map(p => [p.seat, p.kind])).toEqual([[0, 'human'], [1, 'human'], [2, 'bot']]);
    expect(view.isHost).toBe(true);
    expect(guests[0].lobby.getView().me.seat).toBe(1);
    await expect(guests[0].lobby.start()).rejects.toThrow(/host/);
    expect(room(store, host.code).game).toBe('v4');
    const [hs, gs] = await Promise.all([started(host.lobby), started(guests[0].lobby), host.lobby.start()]);
    await until(() => hs.getState() && gs.getState(), { label: 'first state' });
    expect(gs.info).toMatchObject({ mode: 'online', roomCode: host.code, isHost: false, version: 1 });
    expect(hs.info.isHost).toBe(true);
    expect(hs.mySeats).toEqual([0]);
    expect(gs.mySeats).toEqual([1]);
    expect(typeof room(store, host.code).state.stateJson).toBe('string');
    host.lobby.destroy(); guests[0].lobby.destroy();
  });

  it('table: the host picks the spheres; the guest sees it in the lobby and every client plays on it, one sphere per player', async () => {
    const store = createMemoryStore();
    const host = await createRoom({ name: 'Host', transport: createMemoryTransport(store), seed: 5, botDelayMs: DELAY, table: { mode: 'custom', quadrants: ['gold', 'red', 'thieves', 'echo'] } });
    const guest = await joinRoom({ code: host.code, name: 'G1', transport: createMemoryTransport(store), botDelayMs: DELAY });
    await until(() => guest.lobby.getView().table, { label: 'guest sees table' });
    expect(guest.lobby.getView().table.quadrants).toEqual(['gold', 'red', 'thieves', 'echo']);
    await host.lobby.setTable({ mode: 'random', quadrants: ['yellow', 'market', 'thieves', 'trading'] });
    await until(() => guest.lobby.getView().table?.quadrants[0] === 'yellow', { label: 'guest sees new table' });
    await expect(guest.lobby.setTable({ mode: 'custom', quadrants: ['gold', 'red', 'blue', 'green'] })).rejects.toThrow(/host/);
    await expect(host.lobby.setTable({ mode: 'custom', quadrants: ['gold', 'red', 'blue', 'market'] })).rejects.toThrow();
    const [hs, gs] = await Promise.all([started(host.lobby), started(guest.lobby), host.lobby.start()]);
    await until(() => hs.getState() && gs.getState(), { label: 'first state' });
    // one sphere per player (Cory, 2026-10-15): two players play the table's first two
    expect(hs.getState().quadrants).toEqual(['yellow', 'market']);
    expect(gs.getState().quadrants).toEqual(['yellow', 'market']);
    host.lobby.destroy(); guest.lobby.destroy();
  });

  it('host + 2 guests (+1 bot) play a full game; all clients end identical', async () => {
    const { host, guests } = await table(2, { bots: 1 });
    const sessions = await Promise.all([started(host.lobby), ...guests.map(g => started(g.lobby)), host.lobby.start()].slice(0, 3));
    const errors = [];
    const stops = sessions.map((s, i) => autoPlay(s, { seed: 100 + i, errors }));
    await until(() => sessions.every(s => s.getState()?.over), { timeout: 20000, label: 'game over everywhere' });
    expect(errors).toEqual([]);
    const fp = sessions.map(s => fingerprint(s.getState()));
    expect(new Set(fp).size).toBe(1);
    expect(new Set(sessions.map(s => s.info.version)).size).toBe(1);
    await until(() => host.lobby.getView().status === 'over', { label: 'status over' });
    stops.forEach(f => f());
    sessions.forEach(s => s.destroy());
  });

  it('duplicate submission is applied once', async () => {
    const { host, guests, store } = await table(1);
    const [hs, gs] = await Promise.all([started(host.lobby), started(guests[0].lobby), host.lobby.start()]);
    await until(() => hs.getState() && gs.getState());
    const st = hs.getState();
    const actor = st.pending.player === 0 ? hs : gs;
    const move = { player: st.pending.player, option: st.pending.options[0].id };
    // same call twice -> same promise
    const p1 = actor.submit(move), p2 = actor.submit(move);
    expect(p2).toBe(p1);
    await p1;
    expect(hs.info.version).toBe(2);
    // a raw record delivered twice (same mid) is applied once
    const t = guests[0].t;
    await until(() => gs.info.version === 2);
    const st2 = gs.getState();
    expect(st2.pending.kind).toBe('place'); // the remaining draft color was autoassigned
    expect(st2.pending.player).not.toBe(move.player); // reverse draft: first placer drafted last
    const base = `${ROOM_ROOT}/${host.code}`;
    const nextSeat = st2.pending.player;
    const nextId = nextSeat === 0 ? host.playerId : guests[0].playerId;
    const rec = { by: nextId, seat: nextSeat, move: { player: nextSeat, option: st2.pending.options[0].id }, n: 2, mid: 'dupmid' };
    await t.push(`${base}/moves`, rec);
    await t.push(`${base}/moves`, rec);
    await until(() => hs.info.version === 3 && !room(store, host.code).moves, { label: 'moves drained' });
    await pause(20);
    expect(hs.info.version).toBe(3);
    expect(room(store, host.code).state.version).toBe(3);
    host.lobby.destroy(); guests[0].lobby.destroy();
  });

  it('illegal / out-of-turn / wrong-seat moves are rejected with a reason', async () => {
    const { host, guests, store } = await table(1);
    const [hs, gs] = await Promise.all([started(host.lobby), started(guests[0].lobby), host.lobby.start()]);
    await until(() => hs.getState() && gs.getState());
    const activeSeat = hs.getState().pending.player;
    const active = activeSeat === 0 ? hs : gs;
    const inactiveSeat = 1 - activeSeat;
    const inactive = inactiveSeat === 0 ? hs : gs;
    // Local checks: neither impersonation nor acting from the inactive seat is allowed.
    await expect(inactive.submit({ player: activeSeat, option: 'color:gold' })).rejects.toThrow(/isn't yours/);
    await expect(inactive.submit({ player: inactiveSeat, option: 'color:gold' })).rejects.toThrow(/Not your turn/);
    // Repeat the same attacks at the host, bypassing only local validation.
    await expect(inactive.submit({ player: inactiveSeat, option: 'color:gold' }, { skipLocalCheck: true })).rejects.toThrow(/Not your turn/);
    await expect(active.submit({ player: activeSeat, option: 'bogus' }, { skipLocalCheck: true })).rejects.toThrow(/Illegal move/);
    await expect(inactive.submit({ player: activeSeat, option: hs.getState().pending.options[0].id }, { skipLocalCheck: true })).rejects.toThrow(/isn't yours/);
    expect(hs.info.version).toBe(1);
    await until(() => !room(store, host.code).moves && !room(store, host.code).rejects, { label: 'queues drained' });
    host.lobby.destroy(); guests[0].lobby.destroy();
  });

  it('ignores out-of-order (older) snapshots', async () => {
    const { host, guests, store } = await table(1);
    const [hs, gs] = await Promise.all([started(host.lobby), started(guests[0].lobby), host.lobby.start()]);
    await until(() => hs.getState() && gs.getState());
    const oldNode = room(store, host.code).state;
    const initial = hs.getState().pending;
    await (initial.player === 0 ? hs : gs).submit({ player: initial.player, option: initial.options[0].id });
    await until(() => gs.info.version === 2);
    const fpBefore = fingerprint(gs.getState());
    // a stale writer republishes version 1
    await guests[0].t.set(`${ROOM_ROOT}/${host.code}/state`, oldNode);
    await pause(20);
    expect(gs.info.version).toBe(2);
    expect(fingerprint(gs.getState())).toBe(fpBefore);
    host.lobby.destroy(); guests[0].lobby.destroy();
  });

  it('host disconnects mid-game: lowest connected human takes over, old host rejoins, game finishes', async () => {
    const { store, host, guests } = await table(2, { bots: 1, seed: 33 });
    const [hs, g1s, g2s] = await Promise.all([started(host.lobby), ...guests.map(g => started(g.lobby)), host.lobby.start()].slice(0, 3));
    const errors = [];
    const stops = [autoPlay(hs, { seed: 1, errors }), autoPlay(g1s, { seed: 2, errors }), autoPlay(g2s, { seed: 3, errors })];
    await until(() => g1s.info.version >= 25, { label: 'mid-game' });

    stops[0]();
    host.t.goOffline();
    host.lobby.destroy();
    await until(() => room(store, host.code).hostId === guests[0].playerId, { label: 'migration' });
    expect(g1s.info.isHost).toBe(true);
    expect(g1s.info.seats[0].connected).toBe(false);

    // Old host comes back on a fresh connection with the same playerId and gets seat 0 back.
    const t2 = createMemoryTransport(store);
    const back = await joinRoom({ code: host.code, transport: t2, playerId: host.playerId, botDelayMs: DELAY });
    expect(back.rejoined).toBe(true);
    const hs2 = await started(back.lobby);
    expect(hs2.mySeats).toEqual([0]);
    expect(hs2.info.isHost).toBe(false);
    stops[0] = autoPlay(hs2, { seed: 4, errors });

    await until(() => [hs2, g1s, g2s].every(s => s.getState()?.over), { timeout: 20000, label: 'game over after migration' });
    expect(errors).toEqual([]);
    expect(new Set([hs2, g1s, g2s].map(s => fingerprint(s.getState()))).size).toBe(1);
    stops.forEach(f => f());
    [hs2, g1s, g2s].forEach(s => s.destroy());
  });

  it('guest reconnect gets the same seat back', async () => {
    const { store, host, guests } = await table(2);
    const g = guests[1];
    expect(g.lobby.getView().me.seat).toBe(2);
    const [, , g2s] = await Promise.all([started(host.lobby), started(guests[0].lobby), started(g.lobby), host.lobby.start()]);
    await until(() => g2s.getState());
    g.t.goOffline();
    g.lobby.destroy();
    await until(() => room(store, host.code).players[g.playerId].connected === false, { label: 'marked offline' });
    expect(host.lobby.getView().players[2].connected).toBe(false);

    const t = createMemoryTransport(store);
    const again = await joinRoom({ code: host.code.toLowerCase(), name: 'G2', transport: t, playerId: g.playerId });
    const s = await started(again.lobby);
    await until(() => s.getState());
    expect(again.lobby.getView().me.seat).toBe(2);
    expect(s.mySeats).toEqual([2]);
    await until(() => host.lobby.getView().players[2].connected === true, { label: 'marked online' });
    // a stranger can't join a running game
    await expect(joinRoom({ code: host.code, name: 'X', transport: createMemoryTransport(store) })).rejects.toThrow(/started/);
    host.lobby.destroy(); guests[0].lobby.destroy(); again.lobby.destroy();
  });

  it('two joins at once get distinct seats; a fifth player is turned away', async () => {
    const store = createMemoryStore();
    const host = await createRoom({ name: 'H', transport: createMemoryTransport(store) });
    const joins = await Promise.all(['A', 'B', 'C'].map(name => joinRoom({ code: host.code, name, transport: createMemoryTransport(store) })));
    const seats = joins.map(j => j.lobby.getView().me.seat);
    expect(new Set(seats).size).toBe(3);
    expect(seats.every(s => s >= 1 && s <= 3)).toBe(true);
    await expect(joinRoom({ code: host.code, name: 'D', transport: createMemoryTransport(store) })).rejects.toThrow(/full/);
    await expect(host.lobby.addBot()).rejects.toThrow(/full/);
    // host removes a seat, then a bot fills it; seats compact on start
    await host.lobby.removeSeat(2);
    await host.lobby.addBot();
    await until(() => host.lobby.getView().players.some(p => p.kind === 'bot'));
    await host.lobby.start();
    await until(() => host.lobby.getView().status === 'playing', { label: 'playing' });
    const view = host.lobby.getView();
    expect(view.players.map(p => p.seat)).toEqual([0, 1, 2, 3]);
    host.lobby.destroy(); joins.forEach(j => j.lobby.destroy());
  });

  it('lobby leave hands host to the next human; last one out closes the room', async () => {
    const store = createMemoryStore();
    const host = await createRoom({ name: 'H', transport: createMemoryTransport(store) });
    const g = await joinRoom({ code: host.code, name: 'G', transport: createMemoryTransport(store) });
    await host.lobby.leave();
    await until(() => g.lobby.getView().isHost, { label: 'host handoff' });
    expect(g.lobby.getView().players.map(p => p.name)).toEqual(['G']);
    await g.lobby.leave();
    expect(room(store, host.code) ?? null).toBe(null);
  });
});
